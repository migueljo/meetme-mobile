import {
  mediaDevices,
  RTCPeerConnection,
  MediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';

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
  #localMediaStream: any;
  #remoteMediaStream: any;
  #peerConnection: any;
  #remoteCandidates = [];

  #createOffer = async () => {
    let sessionConstraints = {
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true,
        VoiceActivityDetection: true,
      },
    };

    try {
      const offerDescription = await this.#peerConnection.createOffer(
        sessionConstraints,
      );
      await this.#peerConnection.setLocalDescription(offerDescription);

      // TODO: 2. Send the offerDescription to the other participant. Use "video-offer" message through the signaling server
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
  };

  // TODO: Add type for iceCandidate.
  // TODO: Where to call this function?
  #handleRemoteCandidate(iceCandidate) {
    iceCandidate = new RTCIceCandidate(iceCandidate);
    // TODO: what does remoteDescription mean/do?
    if (this.#peerConnection.remoteDescription == null) {
      return this.#remoteCandidates.push(iceCandidate);
    }
    return this.#peerConnection.addIceCandidate(iceCandidate);
  }

  #processCandidates() {
    if (this.#remoteCandidates.length === 0) {
      return;
    }

    this.#remoteCandidates.map(candidate =>
      this.#peerConnection.addIceCandidate(candidate),
    );
    this.#remoteCandidates = [];
  }

  // TODO: Where to call this function?
  #handleOffer = async (offerDescription: any) => {
    try {
      // Use the received offerDescription
      offerDescription = new RTCSessionDescription(offerDescription);
      await this.#peerConnection.setRemoteDescription(offerDescription);

      const answerDescription = await this.#peerConnection.createAnswer();
      await this.#peerConnection.setLocalDescription(answerDescription);

      // Here is a good place to process candidates.
      this.#processCandidates();

      // Send the answerDescription back as a response to the offerDescription.
    } catch (err) {
      throw err;
      // TODO: Think about how to handle this error.
    }
  };

  // TODO: Where to call this function?
  #handleAnswer = async (answerDescription: any) => {
    try {
      // Use the received answerDescription
      answerDescription = new RTCSessionDescription(answerDescription);
      await this.#peerConnection.setRemoteDescription(answerDescription);
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
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

      this.#localMediaStream = mediaStream;
    } catch (err) {
      // TODO: Think about how to handle this error.
      throw err;
    }
  };

  startCall = async () => {
    this.#peerConnection = new RTCPeerConnection(PEER_CONSTRAINTS);

    // TODO: Add type for event.
    this.#peerConnection.addEventListener('connectionstatechange', event => {
      switch (this.#peerConnection.connectionState) {
        case 'closed':
          // You can handle the call being disconnected here.

          break;
      }
    });

    // TODO: Add type for event.
    this.#peerConnection.addEventListener('icecandidate', event => {
      // When you find a null candidate then there are no more candidates.
      // Gathering of candidates has finished.
      if (!event.candidate) {
        return;
      }

      // TODO: 3. Send candidates to the remote peer by the signaling server. Use "new-ice-candidate" through the signaling server
      // Send the event.candidate onto the person you're calling.
      // Keeping to Trickle ICE Standards, you should send the candidates immediately.
    });

    // TODO: Add type for event.
    this.#peerConnection.addEventListener('icecandidateerror', event => {
      // You can ignore some candidate errors.
      // Connections can still be made even when errors occur.
    });

    // TODO: Add type for event.
    this.#peerConnection.addEventListener('iceconnectionstatechange', event => {
      switch (this.#peerConnection.iceConnectionState) {
        case 'connected':
        case 'completed':
          // You can handle the call being connected here.
          // Like setting the video streams to visible.
          // TODO: Dispatch event to the component to handle the call being connected.
          break;
      }
    });

    // TODO: Add type for event.
    this.#peerConnection.addEventListener('negotiationneeded', event => {
      // You can start the offer stages here.
      // Be careful as this event can be called multiple times.
      // TODO: 1. create the off ONCE, call #createOffer.
    });

    // TODO: Add type for event.
    this.#peerConnection.addEventListener('signalingstatechange', event => {
      switch (this.#peerConnection.signalingState) {
        case 'closed':
          // You can handle the call being disconnected here.
          // TODO: Dispatch event to the component to handle the call being disconnected.
          break;
      }
    });

    // TODO: Add type for event.
    this.#peerConnection.addEventListener('track', event => {
      // Grab the remote track from the connected participant.
      this.#remoteMediaStream =
        this.#remoteMediaStream || new MediaStream(undefined);
      this.#remoteMediaStream.addTrack(event.track, this.#remoteMediaStream);
    });

    // TODO: Add type for track.
    // Add our stream to the peer connection.
    this.#localMediaStream
      .getTracks()
      .forEach(track =>
        this.#peerConnection.addTrack(track, this.#localMediaStream),
      );
  };
}
