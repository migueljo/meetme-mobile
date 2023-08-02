import type {Socket} from 'socket.io-client';
import {io} from 'socket.io-client';

const url = 'ws://192.168.0.6:8080';
let socket: Socket | null = null;

export const EventTypes = {
  offer: 'offer',
  answer: 'answer',
  newIceCandidate: 'new-ice-candidate',
} as const;

async function initWebSocket({
  authToken,
}: {
  authToken: string;
}): Promise<Socket> {
  return new Promise((resolve, reject) => {
    socket = io(url, {auth: {token: authToken}});
    console.log('Connecting to signaling server');

    socket.on('connect', () => {
      console.log('Connected to signaling server');
      resolve(socket as Socket);
    });

    socket.on('disconnect', reason => {
      console.log('Disconnected from signaling server:', reason);
    });

    socket.on('connect_error', error => {
      console.log('Connection error:', error);
      reject(error);
    });
  });
}

async function stopWebSocket() {
  if (socket) {
    console.log('Disconnecting from signaling server');
    socket.disconnect();
    socket = null;
  }
  console.log('Already disconnected from signaling server');
}

export async function getSignalingConnection({
  authToken,
}: GetSignalingConnectionArgs) {
  if (!socket) {
    socket = await initWebSocket({authToken});
  }

  return socket;
}

export function disconnectSignalingConnection() {
  stopWebSocket();
}

export type SignalingConnectionType = Socket;

export type GetSignalingConnectionArgs = {
  authToken: string;
};
