import { useEffect } from "react";
import { messaging } from "../firebase/firebase";
import { type Messaging } from "firebase/messaging";

type MessageHandler = (payload: any) => void;

export function useOnForeground(
  handler: MessageHandler,
  messagingInstance: Messaging = messaging
) {
  useEffect(() => {
    // ✅ Only runs in the browser!
    let unsubscribe: (() => void) | null = null;
    const loadOnMessage = async () => {
      const { onMessage } = await import("firebase/messaging");
      unsubscribe = onMessage(messagingInstance, handler);
    };
    loadOnMessage();

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handler, messagingInstance]);
}
