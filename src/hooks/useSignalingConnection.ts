import {useRef} from 'react';

import {
  getSignalingConnection,
  disconnectSignalingConnection,
  SignalingConnectionType,
  GetSignalingConnectionArgs,
} from '../libs/SignalingConnection';

export default function useSignalingConnection() {
  const signalingConnectionRef = useRef<SignalingConnectionType | null>();

  const handleConnect = () => {
    console.log('Connected to signaling server');
  };

  const start = async ({authToken}: GetSignalingConnectionArgs) => {
    signalingConnectionRef.current = await getSignalingConnection({authToken});
    signalingConnectionRef.current.on('connect', handleConnect);
  };

  const stop = () => {
    signalingConnectionRef.current?.off('connect', handleConnect);
    disconnectSignalingConnection();
    signalingConnectionRef.current = null;
  };

  return {
    start,
    stop,
  };
}
