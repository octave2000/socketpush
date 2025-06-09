import { useEffect } from "react";
import { messaging } from "../firebase/firebase";
import { type Messaging } from "firebase/messaging";

type MessageHandler = (payload: any) => void;

export function useOnForeground(
  handler: MessageHandler,
  messagingInstance: Messaging = messaging
) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("firebase/messaging").then(({ onMessage }) => {
        const unsubscribe = onMessage(messagingInstance, handler);

        return () => unsubscribe();
      });
    }
  }, [handler, messagingInstance]);
}
