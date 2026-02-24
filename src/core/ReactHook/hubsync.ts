import { useEffect, useRef, useState, useCallback } from "react";
import { hubsync } from "../websocket/wrappers";
import { getSocket } from "../websocket/instance";
import type {
  CallbacksRef,
  deliveryCallback,
  EventCallback,
  MessageCallback,
  onFetchOnlineUsersCallback,
  OnlineStatusCallback,
  OnlineUsersCallback,
} from "../../types";

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export function useHubSync() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const callbacksRef = useRef<CallbacksRef>({
    onMessage: null,
    onOnlineUsers: null,
    onOnlineStatus: null,
    onDelivery: null,
    onFetchOnlineUsers: null,
    customEvents: new Map(),
  });

  const socket = getSocket();

  useEffect(() => {
    return () => {
      const { onMessage, onOnlineUsers, onOnlineStatus, onDelivery, customEvents } =
        callbacksRef.current;

      if (onMessage) hubsync.offMessage(onMessage);
      if (onOnlineUsers) hubsync.offOnlineUsers(onOnlineUsers);
      if (onOnlineStatus) hubsync.offOnlineStatus(onOnlineStatus);
      if (onDelivery) hubsync.offDelivery(onDelivery);

      for (const [event, callback] of customEvents) {
        hubsync.offEvent(event, callback);
      }
    };
  }, []);

  useEffect(() => {
    const onConnect = () => {
      setConnectionState("connected");
      setError(null);
    };
    const onDisconnect = () => setConnectionState("disconnected");
    const onConnectError = (err: Error) => {
      setError(err.message);
      setConnectionState("error");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [socket]);

  const connect = useCallback(
    async (params: {
      alias: string;
      app_uuid?: string;
      token?: string;
      deviceToken?: string;
      metadata?: Record<string, any>;
    }) => {
      if (connectionState === "connected" || connectionState === "connecting") {
        console.warn(`Connect called while in '${connectionState}' state.`);
        return;
      }

      setConnectionState("connecting");
      setError(null);

      socket.connect();

      try {
        await new Promise<void>((resolve, reject) => {
          socket.once("connect", () => resolve());
          socket.once("connect_error", (err) => reject(err));
        });

        const registration = await hubsync.connect(params);
        if (!registration.success) {
          throw new Error(registration.message || "Socket registration failed.");
        }
        setConnectionState("connected");
      } catch (err: any) {
        setError(err.message || "An unknown connection error occurred.");
        setConnectionState("error");
        if (socket.connected) {
          socket.disconnect();
        }
        throw err;
      }
    },
    [connectionState, socket]
  );

  const ensureConnected = () => {
    if (connectionState !== "connected") {
      throw new Error(
        "Socket is not connected. Please call connect() and wait for the connection to establish."
      );
    }
  };

  const trigger = useCallback(
    async (...args: Parameters<typeof hubsync.trigger>) => {
      ensureConnected();
      return hubsync.trigger(...args);
    },
    [connectionState]
  );

  const join = useCallback(
    async (...args: Parameters<typeof hubsync.join>) => {
      ensureConnected();
      return hubsync.join(...args);
    },
    [connectionState]
  );

  const leave = useCallback(
    async (...args: Parameters<typeof hubsync.leave>) => {
      ensureConnected();
      return hubsync.leave(...args);
    },
    [connectionState]
  );

  const message = useCallback(
    async (...args: Parameters<typeof hubsync.message>) => {
      ensureConnected();
      return hubsync.message(...args);
    },
    [connectionState]
  );

  const roomEmit = useCallback(
    async (...args: Parameters<typeof hubsync.triggerRoomEvents>) => {
      ensureConnected();
      return hubsync.triggerRoomEvents(...args);
    },
    [connectionState]
  );

  const onMessage = useCallback(
    (callback: MessageCallback) => {
      if (callbacksRef.current.onMessage) {
        hubsync.offMessage(callbacksRef.current.onMessage);
      }
      callbacksRef.current.onMessage = callback;
      hubsync.onMessage(callback);
    },
    []
  );

  const onDelivery = useCallback(
    (callback: deliveryCallback) => {
      if (callbacksRef.current.onDelivery) {
        hubsync.offDelivery(callbacksRef.current.onDelivery);
      }
      callbacksRef.current.onDelivery = callback;
      hubsync.onDelivery(callback);
    },
    []
  );

  const onFetchUsers = useCallback(
    (callback: onFetchOnlineUsersCallback) => {
      callbacksRef.current.onFetchOnlineUsers = callback;
      hubsync.fetchOnlineUsers(callback);
    },
    []
  );

  const onOnlineUsers = useCallback(
    (callback: OnlineUsersCallback) => {
      if (callbacksRef.current.onOnlineUsers) {
        hubsync.offOnlineUsers(callbacksRef.current.onOnlineUsers);
      }
      callbacksRef.current.onOnlineUsers = callback;
      hubsync.getOnlineUsers(callback);
    },
    []
  );

  const onOnlineStatus = useCallback(
    (callback: OnlineStatusCallback) => {
      if (callbacksRef.current.onOnlineStatus) {
        hubsync.offOnlineStatus(callbacksRef.current.onOnlineStatus);
      }
      callbacksRef.current.onOnlineStatus = callback;
      hubsync.onOnlineStatus(callback);
    },
    []
  );

  const onEvent = useCallback(
    (event: string, callback: EventCallback) => {
      const existing = callbacksRef.current.customEvents.get(event);
      if (existing) {
        hubsync.offEvent(event, existing);
      }
      callbacksRef.current.customEvents.set(event, callback);
      hubsync.onEvent(event, callback);
    },
    []
  );

  const offMessage = useCallback((callback: MessageCallback) => {
    hubsync.offMessage(callback);
    if (callbacksRef.current.onMessage === callback) {
      callbacksRef.current.onMessage = null;
    }
  }, []);

  const offDelivery = useCallback((callback: deliveryCallback) => {
    hubsync.offDelivery(callback);
    if (callbacksRef.current.onDelivery === callback) {
      callbacksRef.current.onDelivery = null;
    }
  }, []);

  const offOnlineUsers = useCallback((callback: OnlineUsersCallback) => {
    hubsync.offOnlineUsers(callback);
    if (callbacksRef.current.onOnlineUsers === callback) {
      callbacksRef.current.onOnlineUsers = null;
    }
  }, []);

  const offOnlineStatus = useCallback((callback: OnlineStatusCallback) => {
    hubsync.offOnlineStatus(callback);
    if (callbacksRef.current.onOnlineStatus === callback) {
      callbacksRef.current.onOnlineStatus = null;
    }
  }, []);

  const offEvent = useCallback((event: string, callback: EventCallback) => {
    hubsync.offEvent(event, callback);
    const current = callbacksRef.current.customEvents.get(event);
    if (current === callback) {
      callbacksRef.current.customEvents.delete(event);
    }
  }, []);

  return {
    connectionState,
    error,
    connect,
    disconnect: () => socket.disconnect(),
    trigger,
    join,
    leave,
    roomEmit,
    message,
    onMessage,
    onOnlineUsers,
    onOnlineStatus,
    onEvent,
    onFetchUsers,
    onDelivery,
    offMessage,
    offDelivery,
    offOnlineUsers,
    offOnlineStatus,
    offEvent,
  };
}

export const useSocketPush = useHubSync;
