import type { InternalPayload } from "../../types";
import { getSocket } from "./instance";

const socket = getSocket();

type AckResponse = boolean | { success?: boolean; message?: string } | undefined;

const normalizeAck = (
  response: AckResponse,
  successMessage: string,
  failureMessage: string
) => {
  if (typeof response === "boolean") {
    return {
      success: response,
      message: response ? successMessage : failureMessage,
    };
  }

  const success = Boolean(response?.success);
  return {
    success,
    message: response?.message || (success ? successMessage : failureMessage),
  };
};

const messageListeners = new WeakMap<
  (...args: any[]) => void,
  (data: any, ack?: (response?: unknown) => void) => void
>();
const deliveryListeners = new WeakMap<(...args: any[]) => void, (...args: any[]) => void>();
const onlineUsersListeners = new WeakMap<(...args: any[]) => void, () => void>();
const onlineStatusListeners = new WeakMap<(...args: any[]) => void, (...args: any[]) => void>();
const eventListeners = new Map<
  string,
  WeakMap<(...args: any[]) => void, (data: any, ack?: (response?: unknown) => void) => void>
>();

export const hubsync = {
  connect({
    alias,
    app_uuid,
    token,
    deviceToken,
    metadata,
  }: {
    alias: string;
    app_uuid?: string;
    token?: string;
    deviceToken?: string;
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
          deviceToken,
          metadata,
        },
        (response: AckResponse) =>
          resolve(
            normalizeAck(response, "Connected successfully", "Connection failed")
          )
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
        (response: AckResponse) =>
          resolve(
            normalizeAck(
              response,
              "Event triggered successfully",
              "Failed to trigger event"
            )
          )
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
        (response: AckResponse) =>
          resolve(
            normalizeAck(
              response,
              "Room event triggered successfully",
              "Failed to trigger room event"
            )
          )
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
        (response: AckResponse) =>
          resolve(
            normalizeAck(response, "Joined room successfully", "Failed to join room")
          )
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
        (response: AckResponse) =>
          resolve(
            normalizeAck(response, "Left room successfully", "Failed to leave room")
          )
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
    encrypted?: boolean;
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
        (response: AckResponse) =>
          resolve(
            normalizeAck(
              response,
              "Message sent successfully",
              "Failed to send message"
            )
          )
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
    hubsync.offDelivery(callback);
    deliveryListeners.set(callback, callback);
    socket.on("delivery-receipt", callback);
  },

  offDelivery(
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
    const listener = deliveryListeners.get(callback);
    if (!listener) return;
    socket.off("delivery-receipt", listener);
    deliveryListeners.delete(callback);
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
    hubsync.offOnlineUsers(callback);

    const statusListener = () => {
      socket.emit(
        "getOnlineUsers",
        {
          app_uuid: app_uuid || process.env.NEXT_PUBLIC_SOCKET_APP,
        },
        callback
      );
    };

    onlineUsersListeners.set(callback, statusListener);
    socket.on("status", statusListener);
  },

  offOnlineUsers(callback: (users: { alias: string }[]) => void) {
    const listener = onlineUsersListeners.get(callback);
    if (!listener) return;
    socket.off("status", listener);
    onlineUsersListeners.delete(callback);
  },

  onOnlineStatus(
    callback: (data: { isOnline: boolean; user: string }) => void
  ) {
    hubsync.offOnlineStatus(callback);
    onlineStatusListeners.set(callback, callback);
    socket.on("status", callback);
  },

  offOnlineStatus(callback: (data: { isOnline: boolean; user: string }) => void) {
    const listener = onlineStatusListeners.get(callback);
    if (!listener) return;
    socket.off("status", listener);
    onlineStatusListeners.delete(callback);
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
    hubsync.offMessage(callback);

    const listener = (
      data: {
        message: string;
        encrypted: boolean;
        sender: string;
        payload?: unknown;
        isRoom?: boolean;
      },
      ack?: (response?: unknown) => void
    ) => {
      callback({
        message: data?.message ?? "",
        encrypted: Boolean(data?.encrypted),
        sender: data?.sender ?? "",
      });
      if (typeof ack === "function") ack({ ok: true });
    };

    messageListeners.set(callback, listener);
    socket.on("receiveMessage", listener);
  },

  offMessage(
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
    const listener = messageListeners.get(callback);
    if (!listener) return;
    socket.off("receiveMessage", listener);
    messageListeners.delete(callback);
  },

  onEvent<T extends Record<string, any>>(
    event: string,
    callback: (data: {
      payload: T & Partial<InternalPayload>;
      isRoom: boolean;
    }) => void
  ) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new WeakMap());
    }

    const listeners = eventListeners.get(event)!;
    const existing = listeners.get(callback);
    if (existing) {
      socket.off(event, existing);
      listeners.delete(callback);
    }

    const listener = (data: any, ack?: (response?: unknown) => void) => {
      if (
        data &&
        typeof data === "object" &&
        ("payload" in data || "isRoom" in data)
      ) {
        callback({
          payload: data.payload as T & Partial<InternalPayload>,
          isRoom: Boolean(data.isRoom),
        });
      } else {
        callback({
          payload: data as T & Partial<InternalPayload>,
          isRoom: false,
        });
      }

      if (typeof ack === "function") ack({ ok: true });
    };

    listeners.set(callback, listener);
    socket.on(event, listener);
  },

  offEvent<T extends Record<string, any>>(
    event: string,
    callback: (data: {
      payload: T & Partial<InternalPayload>;
      isRoom: boolean;
    }) => void
  ) {
    const listeners = eventListeners.get(event);
    if (!listeners) return;
    const listener = listeners.get(callback);
    if (!listener) return;
    socket.off(event, listener);
    listeners.delete(callback);
  },
};

export const socketpush = hubsync;
