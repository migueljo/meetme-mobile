import {useRef} from 'react';

import {
  getSignalingServer,
  disconnectSignalingServer,
} from '../libs/SignalingConnection';
import type {SignalingConnection} from '../libs/SignalingConnection';

export default function useSignalingConnection() {
  const signalingConnectionRef = useRef<SignalingConnection>();

  const handleConnect = () => {
    console.log('Connected to signaling server');
  };

  const start = () => {
    signalingConnectionRef.current = getSignalingServer();
    signalingConnectionRef.current.on('connect', handleConnect);
  };

  const stop = () => {
    signalingConnectionRef.current?.on('connect', handleConnect);
    disconnectSignalingServer();
    signalingConnectionRef.current = undefined;
  };

  return {
    start,
    stop,
  };
}
