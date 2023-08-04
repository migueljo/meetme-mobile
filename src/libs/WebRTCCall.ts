import {
  mediaDevices,
  RTCPeerConnection,
  MediaStream,
  RTCIceCandidate,
} from 'react-native-webrtc';
import _ from 'lodash';
import EventEmitter from 'events';

import {
  EventTypes,
  GetSignalingConnectionArgs,
  SignalingConnectionType,
  getSignalingConnection,
} from './SignalingConnection';
import {useUserStore} from '../store';
import {Platform} from 'react-native';

const PEER_CONSTRAINTS = {
  iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
};

export class WebRTCCall extends EventEmitter {
  private remoteMediaStream: any;
  private peerConnection: RTCPeerConnection | null = null;
  private remoteCandidates: RTCIceCandidate[] = [];
  private offer = null;
  private signalingConnection: SignalingConnectionType | null = null;
  private role: 'caller' | 'callee' | null = null;
  private target: string | null = null;

  constructor() {
    super();
    this.remoteCandidates = [];
    (async () => {
      const authToken = await useUserStore.getState().user;
      this.signalingConnection = await getSignalingConnection({authToken});
      this.signalingConnection?.on(
        EventTypes.newIceCandidate,
        this.handleRemoteICECandidate,
      );
    })();
  }

  private createOffer = async () => {
    const sessionConstraints = {
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true,
        VoiceActivityDetection: true,
      },
    };

    try {
      const offerDescription = await this.peerConnection?.createOffer(
        sessionConstraints,
      );
      this.offer = offerDescription;
      const userStore = useUserStore.getState();
      const offerData: OfferMessageData = {
        type: offerDescription.type,
        name: userStore.user,
        target: userStore.callee,
        sdp: offerDescription.sdp,
      };

      console.log(
        `WebRTCCall: createOffer() Setting local description on ${Platform.OS}`,
        _.omit(offerData, 'sdp'),
      );
      await this.peerConnection?.setLocalDescription(offerDescription);

      console.log('WebRTCCall: Emitting offer', _.omit(offerData, 'sdp'));
      this.signalingConnection?.emit(EventTypes.offer, offerData);
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
  };

  private handleRemoteOffer = async (offerData: OfferMessageData) => {
    console.log('WebRTCCall: Handle remote offer', _.omit(offerData, 'sdp'));
    try {
      await this.peerConnection?.setRemoteDescription({
        type: offerData.type,
        sdp: offerData.sdp,
      });

      const answerDescription = await this.peerConnection?.createAnswer();
      const answerData: AnswerMessageData = {
        type: answerDescription.type,
        name: offerData.target,
        target: offerData.name,
        sdp: answerDescription.sdp,
      };

      console.log(
        'WebRTCCall: Setting local description on',
        Platform.OS,
        _.omit(answerData, 'sdp'),
      );
      await this.peerConnection?.setLocalDescription(answerDescription);

      // Here is a good place to process candidates.
      this.processCandidates();
      // Send the answerDescription back as a response to the offerDescription.
      console.log('WebRTCCall: Emitting answer', _.omit(answerData, 'sdp'));
      this.signalingConnection?.emit(EventTypes.answer, answerData);
    } catch (err) {
      throw err;
      // TODO: Think about how to handle this error.
    }
  };

  private handleRemoteAnswer = async (answerData: AnswerMessageData) => {
    console.log('WebRTCCall: Received answer', _.omit(answerData, 'sdp'));
    try {
      console.log(
        'WebRTCCall: handleRemoteAnswer() Setting remote description',
        Platform.OS,
        _.omit(answerData, 'sdp'),
      );
      await this.peerConnection?.setRemoteDescription({
        sdp: answerData.sdp,
        type: answerData.type,
      });
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
  };

  private handleRemoteICECandidate = (
    iceCandidateMessage: IceCandidateMessageData,
  ) => {
    console.log(
      'WebRTCCall: Received remote ICE candidate',
      iceCandidateMessage,
    );
    const iceCandidate = new RTCIceCandidate({
      candidate: iceCandidateMessage.candidate.candidate,
      // @ts-ignore
      sdpMid: iceCandidateMessage.candidate.sdpMid,
      // @ts-ignore
      sdpMLineIndex: iceCandidateMessage.candidate.sdpMLineIndex,
    });

    // If remote peer connection is not set yet, store the candidate for processing later.
    if (!this.peerConnection?.remoteDescription) {
      this.remoteCandidates.push(iceCandidate);
      return;
    }
    console.log(
      `WebRTCCall: Adding remote ICE candidate on ${Platform.OS}`,
      iceCandidate,
    );
    return this.peerConnection?.addIceCandidate(iceCandidate);
  };

  private processCandidates = () => {
    console.log(`WebRTCCall: Processing candidates on ${Platform.OS}`, {
      remoteCandidates: this.remoteCandidates.length,
    });
    if (this.remoteCandidates.length === 0) {
      return;
    }

    this.remoteCandidates.forEach(candidate =>
      this.peerConnection?.addIceCandidate(candidate),
    );
    this.remoteCandidates = [];
  };

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

      return mediaStream;
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
  };

  // TODO: Add type for event.
  private handleConnectionStateChange = event => {
    console.log(
      `WebRTCCall: handleConnectionStateChange() event on ${Platform.OS}`,
      {connectionState: this.peerConnection?.connectionState},
    );

    switch (this.peerConnection?.connectionState) {
      case 'closed':
        // You can handle the call being disconnected here.
        console.log('WebRTCCall: handleConnectionStateChange() closed');
        break;
    }
  };

  // TODO: Add type for event.
  private handleIceCandidate = event => {
    // When you find a null candidate then there are no more candidates.
    // Gathering of candidates has finished.
    console.log(
      `WebRTCCall: handleIceCandidate() event on ${Platform.OS}`,
      event.candidate,
    );
    if (!event.candidate) {
      return;
    }

    const iceCandidateData: IceCandidateMessageData = {
      candidate: event.candidate,
      target: this.target as string,
      type: EventTypes.newIceCandidate,
    };

    // Keeping to Trickle ICE Standards, you should send the candidates immediately.
    // Send the event.candidate to the remote peer through the signaling server.
    this.signalingConnection?.emit(
      EventTypes.newIceCandidate,
      iceCandidateData,
    );
  };

  // TODO: Add type for event.
  private handleIceCandidateError = event => {
    console.log('WebRTCCall: handleIceCandidateError()');
    // You can ignore some candidate errors.
    // Connections can still be made even when errors occur.
  };

  // TODO: Add type for event.
  private handleIceConnectionStateChange = event => {
    console.log(
      'WebRTCCall: handleIceConnectionStateChange()',
      this.peerConnection?.iceConnectionState,
    );

    switch (this.peerConnection?.iceConnectionState) {
      case 'connected':
      case 'completed':
        // You can handle the call being connected here.
        // Like setting the video streams to visible.
        // TODO: Dispatch event to the component to handle the call being connected.
        console.log(`WebRTCCall: Call is connected now on ${Platform.OS}`);
        break;
    }
  };

  // TODO: Add type for event.
  private handleNegotiationNeeded = event => {
    console.log('WebRTCCall: handleNegotiationNeeded()');
    // Start the offer stage here.
    // This event can be called multiple times. so make sure to only create an offer once. to avoid weird states
    if (this.offer || this.role === 'callee') {
      return;
    }

    this.createOffer();
  };

  // TODO: Add type for event.
  private handleSignalingStateChange = event => {
    console.log('WebRTCCall: handleSignalingStateChange()');
    switch (this.peerConnection?.signalingState) {
      case 'closed':
        // You can handle the call being disconnected here.
        // TODO: Dispatch event to the component to handle the call being disconnected.
        console.log('WebRTCCall: handleSignalingStateChange() closed');
        break;
    }
  };

  // TODO: Add type for event.
  private handleNewRemoteTrack = event => {
    console.log(
      `WebRTCCall: handleNewRemoteTrack() on ${Platform.OS}`,
      event.track,
    );
    // Grab the remote track from the connected participant.
    this.remoteMediaStream =
      this.remoteMediaStream || new MediaStream(undefined);
    this.remoteMediaStream.addTrack(event.track, this.remoteMediaStream);
  };

  private addWebRTCEventListeners = () => {
    this.peerConnection?.addEventListener(
      'connectionstatechange',
      this.handleConnectionStateChange,
    );

    this.peerConnection?.addEventListener(
      'icecandidate',
      this.handleIceCandidate,
    );

    this.peerConnection?.addEventListener(
      'icecandidateerror',
      this.handleIceCandidateError,
    );

    this.peerConnection?.addEventListener(
      'iceconnectionstatechange',
      this.handleIceConnectionStateChange,
    );

    this.peerConnection?.addEventListener(
      'negotiationneeded',
      this.handleNegotiationNeeded,
    );

    this.peerConnection?.addEventListener(
      'signalingstatechange',
      this.handleSignalingStateChange,
    );

    this.peerConnection?.addEventListener('track', this.handleNewRemoteTrack);
  };

  private removeWebRTCEventListeners = () => {
    this.peerConnection?.removeEventListener(
      'connectionstatechange',
      this.handleConnectionStateChange,
    );

    this.peerConnection?.removeEventListener(
      'icecandidate',
      this.handleIceCandidate,
    );

    this.peerConnection?.removeEventListener(
      'icecandidateerror',
      this.handleIceCandidateError,
    );

    this.peerConnection?.removeEventListener(
      'iceconnectionstatechange',
      this.handleIceConnectionStateChange,
    );

    this.peerConnection?.removeEventListener(
      'negotiationneeded',
      this.handleNegotiationNeeded,
    );

    this.peerConnection?.removeEventListener(
      'signalingstatechange',
      this.handleSignalingStateChange,
    );

    this.peerConnection?.removeEventListener(
      'track',
      this.handleNewRemoteTrack,
    );
  };

  private handleCallRejected = () => {
    console.log('WebRTCCall: handle rejected call');
    this.reset();
  };

  private addSignalingEventListeners = () => {
    console.log(
      'WebRTCCall: adding signaling event listeners?',
      !!this.signalingConnection,
    );
    // Remote offer messages are handled by the signaling connecting which is setup in the Call component.
    // this.signalingConnection?.on(EventTypes.offer, this.handleRemoteOffer);
    this.signalingConnection?.on(EventTypes.answer, this.handleRemoteAnswer);
    this.signalingConnection?.on(
      EventTypes.callRejected,
      this.handleCallRejected,
    );
  };

  private removeSignalingEventListeners = () => {
    console.log(
      'WebRTCCall: removing signaling event listeners?',
      !!this.signalingConnection,
    );
    // this.signalingConnection?.off(EventTypes.offer, this.handleRemoteOffer);
    this.signalingConnection?.off(EventTypes.answer, this.handleRemoteAnswer);
    this.signalingConnection?.off(
      EventTypes.callRejected,
      this.handleCallRejected,
    );
  };

  private reset = () => {
    this.peerConnection?.close();
    this.removeWebRTCEventListeners();
    this.removeSignalingEventListeners();

    this.peerConnection = null;
    this.signalingConnection = null;
    this.remoteMediaStream = null;
    this.remoteCandidates = [];
    this.offer = null;
    this.role = null;
    this.target = null;
  };

  startCall = async ({
    authToken,
    target,
  }: GetSignalingConnectionArgs & {target: string}) => {
    this.role = 'caller';
    this.target = target;

    console.log('WebRTCCall: start call');
    this.signalingConnection = await getSignalingConnection({authToken});
    this.peerConnection = new RTCPeerConnection(PEER_CONSTRAINTS);
    const localMediaStream = await this.getUserMedia();

    this.addWebRTCEventListeners();
    this.addSignalingEventListeners();

    // Add our media stream tracks to the peer connection.
    localMediaStream
      .getTracks()
      .forEach(track => this.peerConnection?.addTrack(track, localMediaStream));
  };

  endCall = () => {
    console.log('WebRTCCall: ending call');
    this.reset();
  };

  acceptCall = async ({remoteOffer}: AcceptCallFnArgs) => {
    console.log('WebRTCCall: accept call', {remoteOffer});
    this.role = 'callee';
    this.target = remoteOffer.name;
    console.log('WebRTCCall: accepting call from:', remoteOffer.target);
    this.signalingConnection = await getSignalingConnection({
      authToken: remoteOffer.target,
    });
    this.peerConnection = new RTCPeerConnection(PEER_CONSTRAINTS);
    const localMediaStream = await this.getUserMedia();

    this.addWebRTCEventListeners();
    this.addSignalingEventListeners();

    // Add our media stream tracks to the peer connection.
    localMediaStream
      .getTracks()
      .forEach(track => this.peerConnection?.addTrack(track, localMediaStream));

    await this.handleRemoteOffer(remoteOffer);
  };

  rejectCall = async ({from, target}: {target: string; from: string}) => {
    console.log('WebRTCCall: rejecting call from:', from);
    this.signalingConnection = await getSignalingConnection({authToken: from});
    const rejectCallData: RejectCallData = {
      from,
      target,
      type: 'reject-call',
    };
    console.log('WebRTCCall: sending reject call data:', rejectCallData);
    this.signalingConnection?.emit(EventTypes.rejectCall, rejectCallData);
  };
}

export type OfferMessageData = {
  type: 'offer';
  name: string; // Sender's name
  target: string; // // Person receiving the description
  sdp: string; // Description to send
};

export type AnswerMessageData = {
  type: 'answer';
  name: string; // Sender's name
  target: string; // // Person receiving the description
  sdp: string; // Description to send
};

export type IceCandidateMessageData = {
  type: 'new-ice-candidate';
  target: string; // Person receiving the description
  candidate: {
    candidate: string; // The SDP candidate string
    sdpMLineIndex: number; // The index (starting at zero) of the m-line in the SDP this candidate is associated with.
    sdpMid: string; // The media stream identification, "audio" or "video", for the m-line this candidate is associated with.
  };
};

export type RejectCallData = {
  type: 'reject-call';
  target: string;
  from: string;
};

export type CallRejectedData = {
  type: 'call-rejected';
};

export type AcceptCallFnArgs = {
  remoteOffer: OfferMessageData;
};
