import {useRef} from 'react';
import {WebRTCCall} from '../libs/WebRTCCall';

export function useWebRTCCall() {
  const webrtcCall = useRef(new WebRTCCall());

  return webrtcCall.current;
}
