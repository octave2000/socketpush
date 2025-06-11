import { getSocket } from "./instance";

const socket = getSocket();

export const socketpush = {
  connect(alias?: string, app_uuid?: string) {
    socket.emit("register", {
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
      alias,
    });
  },

  trigger(
    event: string,
    room?: string,
    alias?: string,
    payload?: any,
    app_uuid?: string
  ) {
    socket.emit("event", {
      event,
      room,
      alias,
      payload,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  join(room: string, alias: string, app_uuid?: string) {
    socket.emit("join", {
      room,
      alias,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  leave(room: string, alias: string, app_uuid?: string) {
    socket.emit("leave", {
      room,
      alias,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  message(
    message: string,
    sender: string,
    encrypted = false,
    room?: string,
    alias?: string,
    app_uuid?: string
  ) {
    socket.emit("message", {
      message,
      sender,
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
    callback: (
      message: string,
      encrypted: boolean,
      from?: string,
      room?: string
    ) => void
  ) {
    socket.on("receiveMessage", callback);
  },

  onEvent(event: string, callback: (data: any) => void) {
    socket.on(event, callback);
  },
};
