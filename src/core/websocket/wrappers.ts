import { resolve } from "path";
import type { InternalPayload } from "../../types";
import { getSocket } from "./instance";
import type { P } from "vitest/dist/chunks/environment.d.Dmw5ulng.js";

const socket = getSocket();

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
  }): Promise<{ success: boolean; message: string }> {
    const appId = app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP;

    return new Promise((resolve) => {
      socket.emit(
        "register",
        {
          app_uuid: appId,
          alias,
          token,
          metadata,
        },
        (response: { success: boolean; message?: string }) => {
          if (response?.success) {
            resolve({
              success: true,
              message: response.message || "Connected successfully",
            });
          } else {
            resolve({
              success: false,
              message: response.message || "Connection failed",
            });
          }
        }
      );
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
  }): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      socket.emit(
        "event",
        {
          event,
          alias,
          payload,
          app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
        },
        (response: { success: boolean; message?: string }) => {
          if (response?.success) {
            resolve({
              success: true,
              message: response.message || "Event triggered successfully",
            });
          } else {
            resolve({
              success: false,
              message: response.message || "Failed to trigger event",
            });
          }
        }
      );
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
  }): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      socket.emit(
        "roomevents",
        {
          event,
          room,
          payload,
          app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
        },
        (response: { success: boolean; message?: string }) => {
          if (response?.success) {
            resolve({
              success: true,
              message: response.message || "Room event triggered successfully",
            });
          } else {
            resolve({
              success: false,
              message: response.message || "Failed to trigger room event",
            });
          }
        }
      );
    });
  },

  join({
    room,
    app_uuid,
  }: {
    room: string;
    app_uuid?: string;
  }): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      socket.emit(
        "join",
        {
          room,
          app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
        },
        (response: { success: boolean; message?: string }) => {
          if (response?.success) {
            resolve({
              success: true,
              message: response.message || "Joined room successfully",
            });
          } else {
            resolve({
              success: false,
              message: response.message || "Failed to join room",
            });
          }
        }
      );
    });
  },

  leave({
    room,
    app_uuid,
  }: {
    room: string;
    app_uuid?: string;
  }): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      socket.emit(
        "leave",
        {
          room,
          app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
        },
        (response: { success: boolean; message?: string }) => {
          if (response?.success) {
            resolve({
              success: true,
              message: response.message || "Left room successfully",
            });
          } else {
            resolve({
              success: false,
              message: response.message || "Failed to leave room",
            });
          }
        }
      );
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
  }): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      socket.emit(
        "message",
        {
          message,
          encrypted,
          room,
          alias,
          msgId,
          app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
        },
        (response: { success: boolean; message?: string }) => {
          if (response?.success) {
            resolve({
              success: true,
              message: response.message || "Message sent successfully",
            });
          } else {
            resolve({
              success: false,
              message: response.message || "Failed to send message",
            });
          }
        }
      );
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
