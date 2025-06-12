import { useEffect, useRef, useState } from "react";

import { socketpush } from "../websocket/wrappers";
import { getSocket } from "../websocket/instance";

// Types for socket events and callbacks
type OnlineStatusCallback = (data: { isOnline: boolean; user: string }) => void;
type OnlineUsersCallback = (users: string[]) => void;
type MessageCallback = ({
  message,
  encrypted,
  sender,
}: {
  message: string;
  encrypted: boolean;
  sender: string;
}) => void;
type EventCallback = (
  eventData: Record<string, string> | number | string | unknown
) => void;

type CallbacksRef = {
  onMessage: MessageCallback | null;
  onOnlineUsers: OnlineUsersCallback | null;
  onOnlineStatus: OnlineStatusCallback | null;
  customEvents: Map<string, EventCallback>;
};

export function useSocketPush() {
  const callbacksRef = useRef<CallbacksRef>({
    onMessage: null,
    onOnlineUsers: null,
    onOnlineStatus: null,
    customEvents: new Map(),
  });

  // 🟢 Only create socket on client
  const [socket, setSocket] = useState<ReturnType<typeof getSocket> | null>(
    null
  );

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    return () => {
      const { onMessage, onOnlineUsers, onOnlineStatus, customEvents } =
        callbacksRef.current;

      if (s) {
        if (onMessage) s.off("receiveMessage", onMessage);
        if (onOnlineUsers) s.off("onlineUsers", onOnlineUsers);
        if (onOnlineStatus) s.off("status", onOnlineStatus);

        customEvents.forEach((cb, event) => s.off(event, cb));
      }

      callbacksRef.current.customEvents.clear();
    };
  }, []);

  function onMessage(callback: MessageCallback) {
    if (!socket) return;
    if (callbacksRef.current.onMessage) {
      socket.off("receiveMessage", callbacksRef.current.onMessage);
    }
    callbacksRef.current.onMessage = callback;
    socketpush.onMessage(callback);
  }

  function onOnlineUsers(callback: OnlineUsersCallback) {
    if (!socket) return;

    // Clear previous
    if (callbacksRef.current.onOnlineUsers) {
      socket.off("onlineUsers", callbacksRef.current.onOnlineUsers);
    }

    // Save and bind new
    callbacksRef.current.onOnlineUsers = callback;
    socket.on("onlineUsers", callback);

    // Trigger initial fetch
    socket.emit("usersOnline", {
      app_uuid: process.env.NEXT_PUBLIC_SOCKET_APP,
    });
  }

  function onOnlineStatus(callback: OnlineStatusCallback) {
    if (!socket) return;
    if (callbacksRef.current.onOnlineStatus) {
      socket.off("status", callbacksRef.current.onOnlineStatus);
    }
    callbacksRef.current.onOnlineStatus = callback;
    socketpush.onOnlineStatus(callback);
  }

  function onEvent(event: string, callback: EventCallback) {
    if (!socket) return;
    const existing = callbacksRef.current.customEvents.get(event);
    if (existing) {
      socket.off(event, existing);
    }
    callbacksRef.current.customEvents.set(event, callback);
    socketpush.onEvent(event, callback);
  }

  return {
    connect: socketpush.connect,
    trigger: socketpush.trigger,
    join: socketpush.join,
    leave: socketpush.leave,
    triggerRoomEvents: socketpush.triggerRoomEvents,
    message: socketpush.message,
    getOnlineUsers: socketpush.getOnlineUsers,
    onMessage,
    onOnlineUsers,
    onOnlineStatus,
    onEvent,
  };
}
