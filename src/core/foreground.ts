import { onMessage, type Messaging } from "firebase/messaging";
import { messaging } from "../firebase/firebase";
import { useEffect } from "react";

type MessageHandler = (payload: any) => void;

export function useOnForeground(
  handler: MessageHandler,
  messagingInstance: Messaging = messaging
) {
  useEffect(() => {
    const unsubscribe = onMessage(messagingInstance, handler);
    return () => unsubscribe();
  }, [handler, messagingInstance]);
}
