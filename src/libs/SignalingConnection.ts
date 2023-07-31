import type {Socket} from 'socket.io-client';
import {io} from 'socket.io-client';

let currentSignalingConnection: SignalingConnection | null = null;

export type {SignalingConnection};

class SignalingConnection {
  private socket: Socket;

  constructor() {
    this.socket = io('ws://localhost:8080', {auth: {token: 'alice'}});
    console.log('Connecting to signaling server');

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('disconnect', reason => {
      console.log('Disconnected from signaling server:', reason);
    });

    this.socket.on('connect_error', error => {
      console.log('Connection error:', error);
    });
  }

  public on(event: string, callback: (...args: any[]) => void) {
    this.socket.on(event, callback);
  }

  public emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  public disconnect() {
    console.log('Disconnecting from signaling server');
    this.socket.disconnect();
  }
}

export function getSignalingServer() {
  if (!currentSignalingConnection) {
    currentSignalingConnection = new SignalingConnection();
  }

  return currentSignalingConnection;
}

export function disconnectSignalingServer() {
  if (currentSignalingConnection) {
    currentSignalingConnection.disconnect();
    currentSignalingConnection = null;
  }
}
