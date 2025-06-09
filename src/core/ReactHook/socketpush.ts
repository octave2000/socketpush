import { useEffect, useRef } from "react";
import { socket } from "../websocket/instance";
import { socketpush } from "../websocket/wrappers";

// Types for socket events and callbacks
type OnlineStatusCallback = (data: { isOnline: boolean; user: string }) => void;
type OnlineUsersCallback = (users: string[]) => void;
type MessageCallback = (
  message: string,
  encrypted: boolean,
  from?: string,
  room?: string
) => void;
type EventCallback = (data: any) => void;

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

  useEffect(() => {
    return () => {
      const { onMessage, onOnlineUsers, onOnlineStatus, customEvents } =
        callbacksRef.current;

      if (onMessage) socket.off("receiveMessage", onMessage);
      if (onOnlineUsers) socket.off("onlineUsers", onOnlineUsers);
      if (onOnlineStatus) socket.off("status", onOnlineStatus);

      customEvents.forEach((cb, event) => socket.off(event, cb));
      callbacksRef.current.customEvents.clear();
    };
  }, []);

  function onMessage(callback: MessageCallback) {
    if (callbacksRef.current.onMessage) {
      socket.off("receiveMessage", callbacksRef.current.onMessage);
    }
    callbacksRef.current.onMessage = callback;
    socketpush.onMessage(callback);
  }

  function onOnlineUsers(callback: OnlineUsersCallback) {
    if (callbacksRef.current.onOnlineUsers) {
      socket.off("onlineUsers", callbacksRef.current.onOnlineUsers);
    }
    callbacksRef.current.onOnlineUsers = callback;
    socketpush.getOnlineUsers();
    socketpush.onOnlineUsers(callback);
  }

  function onOnlineStatus(callback: OnlineStatusCallback) {
    if (callbacksRef.current.onOnlineStatus) {
      socket.off("status", callbacksRef.current.onOnlineStatus);
    }
    callbacksRef.current.onOnlineStatus = callback;
    socketpush.onOnlineStatus(callback);
  }

  function onEvent(event: string, callback: EventCallback) {
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
    message: socketpush.message,
    getOnlineUsers: socketpush.getOnlineUsers,
    onMessage,
    onOnlineUsers,
    onOnlineStatus,
    onEvent,
  };
}
