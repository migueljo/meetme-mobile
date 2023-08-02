import {useEffect, useRef} from 'react';

import {
  getSignalingConnection,
  disconnectSignalingConnection,
  SignalingConnectionType,
  GetSignalingConnectionArgs,
  EventTypes,
} from '../libs/SignalingConnection';

export default function useSignalingConnection(callback?: (data: any) => void) {
  const signalingConnectionRef = useRef<SignalingConnectionType | null>();
  const callbackRef = useRef(callback);

  const handleConnect = () => {
    console.log('Connected to signaling server');
  };

  const start = async ({authToken}: GetSignalingConnectionArgs) => {
    signalingConnectionRef.current = await getSignalingConnection({authToken});
    signalingConnectionRef.current.on('connect', handleConnect);
    if (callbackRef.current) {
      signalingConnectionRef.current.on(EventTypes.offer, callbackRef.current);
    }
  };

  const stop = () => {
    signalingConnectionRef.current?.off('connect', handleConnect);
    if (callbackRef.current) {
      signalingConnectionRef.current?.on(EventTypes.offer, callbackRef.current);
    }
    disconnectSignalingConnection();
    signalingConnectionRef.current = null;
  };

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return {
    start,
    stop,
  };
}
