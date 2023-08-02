import {
  mediaDevices,
  RTCPeerConnection,
  MediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';

import {
  EventTypes,
  GetSignalingConnectionArgs,
  SignalingConnectionType,
  getSignalingConnection,
} from './SignalingConnection';
import {useUserStore} from '../store';

type OfferMessageData = {
  type: 'offer';
  name: string; // Sender's name
  target: string; // // Person receiving the description
  sdp: string; // Description to send
};

type AnswerMessageData = {
  type: 'answer';
  name: string; // Sender's name
  target: string; // // Person receiving the description
  sdp: string; // Description to send
};

type IceCandidateMessageData = {
  type: 'new-ice-candidate';
  target: string; // Person receiving the description
  candidate: string; // The SDP candidate string
};

const PEER_CONSTRAINTS = {
  iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
};

/*
  TODO:
  4. Listen to "video-offer" and do:
    4.1. Create an RTCPeerConnection
    4.2. Create an RTCSessionDescription using the received SDP offer
    4.3. Call RTCPeerConnection.setRemoteDescription() to tell WebRTC about Naomi's configuration
    4.4. Call getUserMedia() to access the webcam and microphone
    4.5. Promise fulfilled: add the local stream's tracks by calling RTCPeerConnection.addTrack()
    4.6. Promise fulfilled: call RTCPeerConnection.createAnswer() to create an SDP answer to send to Naomi
    4.7. Promise fulfilled: configure Priya's end of the connection by match the generated answer by calling RTCPeerConnection.setLocalDescription()
    4.8. Promise fulfilled: send the SDP answer through the signaling server to Naomi in a message of type “video-answer”
*/

/**
 * TODO:
 * 5. Listen to "video-answer" and do:
 * 5.1. Create an RTCSessionDescriptio n using the received SDP answer
 * 5.2. Pass the session description to RTCPeerConnection.setRemoteDescription()
 *    to configure Naomi's WebRTC layer to know how Priya's end of the connection is configured
 */

export class WebRTCCall {
  private localMediaStream: any;
  private remoteMediaStream: any;
  private peerConnection: any;
  private remoteCandidates = [];
  private offer = null;
  private signalingConnection: SignalingConnectionType | null = null;

  private createOffer = async () => {
    const sessionConstraints = {
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true,
        VoiceActivityDetection: true,
      },
    };

    try {
      const offerDescription = await this.peerConnection.createOffer(
        sessionConstraints,
      );
      this.offer = offerDescription;
      const userStore = useUserStore();
      const offerData: OfferMessageData = {
        type: offerDescription.type,
        name: userStore.user,
        target: userStore.callee,
        sdp: offerDescription.sdp,
      };

      await this.peerConnection.setLocalDescription(offerDescription);

      console.log('WebRTC: Emitting offer', offerData);
      this.signalingConnection?.emit(EventTypes.offer, offerData);
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
  };

  private handleRemoteOffer = async (offerData: OfferMessageData) => {
    console.log('WebRTC: Received offer', offerData);
    try {
      const offerDescription = new RTCSessionDescription({
        sdp: offerData.sdp,
        type: offerData.type,
      });
      await this.peerConnection.setRemoteDescription(offerDescription);

      const answerDescription = await this.peerConnection.createAnswer();
      const answerData: AnswerMessageData = {
        type: answerDescription.type,
        name: offerData.target,
        target: offerData.name,
        sdp: answerDescription.sdp,
      };

      await this.peerConnection.setLocalDescription(answerDescription);

      // Here is a good place to process candidates.
      this.processCandidates();
      // Send the answerDescription back as a response to the offerDescription.
      console.log('WebRTC: Emitting answer', answerData);
      this.signalingConnection?.emit(EventTypes.answer, answerData);
    } catch (err) {
      throw err;
      // TODO: Think about how to handle this error.
    }
  };

  private handleRemoteAnswer = async (answerData: AnswerMessageData) => {
    console.log('WebRTC: Received answer', answerData);

    try {
      const answerDescription = new RTCSessionDescription({
        sdp: answerData.sdp,
        type: answerData.type,
      });
      await this.peerConnection.setRemoteDescription(answerDescription);
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
  };

  private handleRemoteICECandidate(
    iceCandidateMessage: IceCandidateMessageData,
  ) {
    console.log('WebRTC: Received remote ICE candidate', iceCandidateMessage);

    // TODO: Implement this.
    // const iceCandidate = new RTCIceCandidate(iceCandidate);
    // // TODO: what does remoteDescription mean/do?
    // if (this.peerConnection.remoteDescription == null) {
    //   return this.remoteCandidates.push(iceCandidate);
    // }
    // return this.peerConnection.addIceCandidate(iceCandidate);
  }

  private processCandidates() {
    if (this.remoteCandidates.length === 0) {
      return;
    }

    this.remoteCandidates.map(candidate =>
      this.peerConnection.addIceCandidate(candidate),
    );
    this.remoteCandidates = [];
  }

  getUserMedia = async () => {
    const mediaConstraints = {
      audio: true,
      video: {
        frameRate: 30,
        facingMode: 'user',
      },
    };
    const isVoiceOnly = true;

    try {
      const mediaStream = await mediaDevices.getUserMedia(mediaConstraints);

      if (isVoiceOnly) {
        let videoTrack = await mediaStream.getVideoTracks()[0];
        videoTrack.enabled = false;
      }

      this.localMediaStream = mediaStream;
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
  };

  // TODO: Add type for event.
  private handleConnectionStateChange = event => {
    switch (this.peerConnection.connectionState) {
      case 'closed':
        // You can handle the call being disconnected here.

        break;
    }
  };

  // TODO: Add type for event.
  private handleIceCandidate = event => {
    // When you find a null candidate then there are no more candidates.
    // Gathering of candidates has finished.
    if (!event.candidate) {
      return;
    }

    // TODO: 3. Send candidates to the remote peer by the signaling server. Use "new-ice-candidate" through the signaling server
    // Send the event.candidate onto the person you're calling.
    // Keeping to Trickle ICE Standards, you should send the candidates immediately.
  };

  // TODO: Add type for event.
  private handleIceCandidateError = event => {
    // You can ignore some candidate errors.
    // Connections can still be made even when errors occur.
  };

  // TODO: Add type for event.
  private handleIceConnectionStateChange = event => {
    switch (this.peerConnection.iceConnectionState) {
      case 'connected':
      case 'completed':
        // You can handle the call being connected here.
        // Like setting the video streams to visible.
        // TODO: Dispatch event to the component to handle the call being connected.
        break;
    }
  };

  // TODO: Add type for event.
  private handleNegotiationNeeded = event => {
    // You can start the offer stages here.
    // TODO: 1. create the off ONCE, call #createOffer.
    // This event can be called multiple times. so make sure to only create an offer once. to avoid weird states
    if (this.offer) {
      return;
    }

    this.createOffer();
  };

  // TODO: Add type for event.
  private handleSignalingStateChange = event => {
    switch (this.peerConnection.signalingState) {
      case 'closed':
        // You can handle the call being disconnected here.
        // TODO: Dispatch event to the component to handle the call being disconnected.
        break;
    }
  };

  // TODO: Add type for event.
  private handleNewRemoteTrack = event => {
    // Grab the remote track from the connected participant.
    this.remoteMediaStream =
      this.remoteMediaStream || new MediaStream(undefined);
    this.remoteMediaStream.addTrack(event.track, this.remoteMediaStream);
  };

  private addWebRTCEventListeners = () => {
    this.peerConnection.addEventListener(
      'connectionstatechange',
      this.handleConnectionStateChange,
    );

    this.peerConnection.addEventListener(
      'icecandidate',
      this.handleIceCandidate,
    );

    this.peerConnection.addEventListener(
      'icecandidateerror',
      this.handleIceCandidateError,
    );

    this.peerConnection.addEventListener(
      'iceconnectionstatechange',
      this.handleIceConnectionStateChange,
    );

    this.peerConnection.addEventListener(
      'negotiationneeded',
      this.handleNegotiationNeeded,
    );

    this.peerConnection.addEventListener(
      'signalingstatechange',
      this.handleSignalingStateChange,
    );

    this.peerConnection.addEventListener('track', this.handleNewRemoteTrack);
  };

  private removeWebRTCEventListeners = () => {
    this.peerConnection.removeEventListener(
      'connectionstatechange',
      this.handleConnectionStateChange,
    );

    this.peerConnection.removeEventListener(
      'icecandidate',
      this.handleIceCandidate,
    );

    this.peerConnection.removeEventListener(
      'icecandidateerror',
      this.handleIceCandidateError,
    );

    this.peerConnection.removeEventListener(
      'iceconnectionstatechange',
      this.handleIceConnectionStateChange,
    );

    this.peerConnection.removeEventListener(
      'negotiationneeded',
      this.handleNegotiationNeeded,
    );

    this.peerConnection.removeEventListener(
      'signalingstatechange',
      this.handleSignalingStateChange,
    );

    this.peerConnection.removeEventListener('track', this.handleNewRemoteTrack);
  };

  private addSignalingEventListeners = () => {
    this.signalingConnection?.on('offer', this.handleRemoteOffer);
    this.signalingConnection?.on('answer', this.handleRemoteAnswer);
    this.signalingConnection?.on(
      'new-ice-candidate',
      this.handleRemoteICECandidate,
    );
  };

  private removeSignalingEventListeners = () => {
    this.signalingConnection?.off('offer', this.handleRemoteOffer);
    this.signalingConnection?.off('answer', this.handleRemoteAnswer);
    this.signalingConnection?.off(
      'new-ice-candidate',
      this.handleRemoteICECandidate,
    );
  };

  private reset = () => {
    this.offer = null;
  };

  startCall = async ({authToken}: GetSignalingConnectionArgs) => {
    this.signalingConnection = await getSignalingConnection({authToken});
    this.peerConnection = new RTCPeerConnection(PEER_CONSTRAINTS);

    this.addWebRTCEventListeners();
    this.addSignalingEventListeners();

    // TODO: Add type for track.
    // Add our media stream tracks to the peer connection.
    this.localMediaStream
      .getTracks()
      .forEach(track =>
        this.peerConnection.addTrack(track, this.localMediaStream),
      );
  };

  endCall = () => {
    this.peerConnection.close();
    this.removeWebRTCEventListeners();
    this.removeSignalingEventListeners();
    this.reset();
  };
}
