import { socket } from "./instance";

export const socketpush = {
  connect(alias: string, app_uuid?: string) {
    socket.emit("register", {
      app_uuid: app_uuid || process.env.SOCKET_APP,
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
      app_uuid: app_uuid || process.env.SOCKET_APP,
    });
  },

  join(room: string, alias: string, app_uuid?: string) {
    socket.emit("subscribe", {
      room,
      alias,
      app_uuid: app_uuid || process.env.SOCKET_APP,
    });
  },

  leave(room: string, alias: string, app_uuid?: string) {
    socket.emit("unsubscribe", {
      room,
      alias,
      app_uuid: app_uuid || process.env.SOCKET_APP,
    });
  },

  message(
    message: string,
    room?: string,
    encrypted?: boolean,
    alias?: string,
    app_uuid?: string
  ) {
    socket.emit("message", {
      message,
      encrypted,
      room,
      alias,
      app_uuid: app_uuid || process.env.SOCKET_APP,
    });
  },
};
