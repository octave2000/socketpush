import { useEffect, useRef, useState, useCallback } from "react";
import { socketpush } from "../websocket/wrappers";
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

export function useSocketPush() {
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

        await socketpush.connect(params);
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
    async (...args: Parameters<typeof socketpush.trigger>) => {
      ensureConnected();
      return socketpush.trigger(...args);
    },
    [connectionState]
  );

  const join = useCallback(
    async (...args: Parameters<typeof socketpush.join>) => {
      ensureConnected();
      return socketpush.join(...args);
    },
    [connectionState]
  );

  const leave = useCallback(
    async (...args: Parameters<typeof socketpush.leave>) => {
      ensureConnected();
      return socketpush.leave(...args);
    },
    [connectionState]
  );

  const message = useCallback(
    async (...args: Parameters<typeof socketpush.message>) => {
      ensureConnected();
      return socketpush.message(...args);
    },
    [connectionState]
  );

  const roomEmit = useCallback(
    async (...args: Parameters<typeof socketpush.triggerRoomEvents>) => {
      ensureConnected();
      return socketpush.triggerRoomEvents(...args);
    },
    [connectionState]
  );

  const onMessage = useCallback(
    (callback: MessageCallback) => {
      if (callbacksRef.current.onMessage) {
        socket.off("receiveMessage", callbacksRef.current.onMessage);
      }
      callbacksRef.current.onMessage = callback;
      socketpush.onMessage(callback);
    },
    [socket]
  );

  const onDelivery = useCallback(
    (callback: deliveryCallback) => {
      if (callbacksRef.current.onDelivery) {
        socket.off("delivery-receipt", callbacksRef.current.onDelivery);
      }
      callbacksRef.current.onDelivery = callback;
      socketpush.onDelivery(callback);
    },
    [socket]
  );

  const onFetchUsers = useCallback(
    (callback: onFetchOnlineUsersCallback) => {
      if (callbacksRef.current.onFetchOnlineUsers) {
        socket.off("fetchOnlineUsers", callbacksRef.current.onFetchOnlineUsers);
      }
      callbacksRef.current.onFetchOnlineUsers = callback;
      socketpush.fetchOnlineUsers(callback);
    },
    [socket]
  );

  const onOnlineUsers = useCallback(
    (callback: OnlineUsersCallback) => {
      if (callbacksRef.current.onOnlineUsers) {
        socket.off("onlineUsers", callbacksRef.current.onOnlineUsers);
      }
      callbacksRef.current.onOnlineUsers = callback;
      socketpush.getOnlineUsers(callback);
    },
    [socket]
  );

  const onOnlineStatus = useCallback(
    (callback: OnlineStatusCallback) => {
      if (callbacksRef.current.onOnlineStatus) {
        socket.off("status", callbacksRef.current.onOnlineStatus);
      }
      callbacksRef.current.onOnlineStatus = callback;
      socketpush.onOnlineStatus(callback);
    },
    [socket]
  );

  const onEvent = useCallback(
    (event: string, callback: EventCallback) => {
      const existing = callbacksRef.current.customEvents.get(event);
      if (existing) {
        socket.off(event, existing);
      }
      callbacksRef.current.customEvents.set(event, callback);
      socketpush.onEvent(event, callback);
    },
    [socket]
  );

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
  };
}
