import type {Socket} from 'socket.io-client';
import {io} from 'socket.io-client';

let currentSignalingServer: SignalingServer | null = null;

class SignalingServer {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  public on(event: string, callback: (...args: any[]) => void) {
    this.socket.on(event, callback);
  }

  public emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  public disconnect() {
    this.socket.disconnect();
  }
}

export type {SignalingServer};

export function getSignalingServer() {
  if (!currentSignalingServer) {
    currentSignalingServer = new SignalingServer();
  }

  return currentSignalingServer;
}

export function disconnectSignalingServer() {
  if (currentSignalingServer) {
    currentSignalingServer.disconnect();
    currentSignalingServer = null;
  }
}
