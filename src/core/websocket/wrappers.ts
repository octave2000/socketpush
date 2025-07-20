import type { InternalPayload } from "../../types";
import { getSocket } from "./instance";

const socket = getSocket();

function emitWithAck<T>(
  eventName: string,
  data: any,
  timeout = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      return reject(
        new Error(
          "Socket not connected. Please connect before emitting events."
        )
      );
    }

    const timer = setTimeout(() => {
      reject(new Error(`Event '${eventName}' timed out after ${timeout}ms`));
    }, timeout);

    socket.emit(eventName, data, (response: T) => {
      clearTimeout(timer);
      if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        !response.success
      ) {
        const message =
          "message" in response && typeof response.message === "string"
            ? response.message
            : `Event '${eventName}' failed.`;
        return reject(new Error(message));
      }
      resolve(response);
    });
  });
}

export const socketpush = {
  connect({
    alias,
    app_uuid,
    token,
    metadata,
  }: {
    alias: string;
    app_uuid?: string;
    token?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve, reject) => {
      socket.io.on("open", () => {
        emitWithAck<{ success: boolean; message?: string }>("register", {
          app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
          alias,
          token,
          metadata,
        })
          .then(resolve)
          .catch((error) => {
            console.error("Registration failed:", error.message);
            reject(error);
          });
      });
      socket.io.on("error", (err) => {
        reject(new Error(`Connection failed: ${err.message}`));
      });
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
    return emitWithAck("event", {
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
    return emitWithAck("roomevents", {
      event,
      room,
      payload,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  join({ room, app_uuid }: { room: string; app_uuid?: string }) {
    return emitWithAck("join", {
      room,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  leave({ room, app_uuid }: { room: string; app_uuid?: string }) {
    return emitWithAck("leave", {
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
    msgId,
  }: {
    message: string;
    encrypted: boolean;
    room?: string;
    alias?: string;
    app_uuid?: string;
    msgId?: string;
  }) {
    return emitWithAck("message", {
      message,
      encrypted,
      room,
      alias,
      msgId,
      app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  },

  onDelivery(
    callback: ({
      alias,
      status,
      msgId,
      evtId,
    }: {
      alias: string;
      status: string;
      msgId?: string;
      evtId?: string;
    }) => void
  ) {
    socket.on("delivery-receipt", callback);
  },

  fetchOnlineUsers(
    callback: (users: { alias: string }[]) => void,
    app_uuid?: string
  ) {
    socket.emit(
      "getOnlineUsers",
      {
        app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
      },
      callback
    );
  },

  getOnlineUsers(
    callback: (users: { alias: string }[]) => void,
    app_uuid?: string
  ) {
    socket.on("status", () => {
      socket.emit(
        "getOnlineUsers",
        {
          app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
        },
        callback
      );
    });
  },

  onOnlineStatus(
    callback: (data: { isOnline: boolean; user: string }) => void
  ) {
    socket.on("status", callback);
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
    socket.on(
      "receiveMessage",
      (
        data: {
          message: string;
          encrypted: boolean;
          sender: string;
        },
        ack: () => void
      ) => {
        callback(data);
        if (ack) ack();
      }
    );
  },

  onEvent<T extends Record<string, any>>(
    event: string,
    callback: (data: {
      payload: T & Partial<InternalPayload>;
      isRoom: boolean;
    }) => void
  ) {
    socket.on(event, (data, ack: () => void) => {
      callback(data);
      if (ack) ack();
    });
  },
};

//more wrappers to come guys
