import type { InternalPayload } from "../../types";
import { getSocket } from "./instance";

const socket = getSocket();

export const socketpush = {
  connect({ alias, app_uuid }: { alias?: string; app_uuid?: string }) {
    socket.emit("register", {
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
      alias,
    });
  },

  trigger<T extends Record<string, any>>({
    event,
    alias,
    payload,
    app_uuid,
  }: {
    event: string;

    alias: string;
    payload?: T & Partial<InternalPayload>;
    app_uuid?: string;
  }) {
    socket.emit("event", {
      event,
      alias,
      payload,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  triggerRoomEvents<T extends Record<string, any>>({
    event,
    room,
    payload,
    app_uuid,
  }: {
    event: string;
    room: string;
    payload?: T & Partial<InternalPayload>;
    app_uuid?: string;
  }) {
    socket.emit("event", {
      event,
      room,
      payload,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  join({ room, app_uuid }: { room: string; app_uuid?: string }) {
    socket.emit("join", {
      room,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  leave({ room, app_uuid }: { room: string; app_uuid?: string }) {
    socket.emit("leave", {
      room,

      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  message({
    message,
    encrypted = false,
    room,
    alias,
    app_uuid,
  }: {
    message: string;
    encrypted: boolean;
    room?: string;
    alias?: string;
    app_uuid?: string;
  }) {
    socket.emit("message", {
      message,
      encrypted,
      room,
      alias,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  getOnlineUsers(app_uuid?: string) {
    socket.emit("usersOnline", {
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  onOnlineStatus(
    callback: (data: { isOnline: boolean; user: string }) => void
  ) {
    socket.on("status", callback);
  },

  onOnlineUsers(callback: (users: string[]) => void) {
    socket.on("onlineUsers", callback);
  },

  onMessage(
    callback: ({
      message,
      encrypted,
      sender,
    }: {
      message: string;
      encrypted: boolean;
      sender: string;
    }) => void
  ) {
    socket.on("receiveMessage", callback);
  },

  onEvent<T extends Record<string, any>>(
    event: string,
    callback: (data: {
      payload: T & Partial<InternalPayload>;
      isRoom: boolean;
    }) => void
  ) {
    socket.on(event, (data) => {
      callback(data);
    });
  },
};
