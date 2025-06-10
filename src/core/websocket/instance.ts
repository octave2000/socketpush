// socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket && typeof window !== "undefined") {
    socket = io("https://realsyncbackend-ja9x.onrender.com");
  }
  return socket as Socket;
}
