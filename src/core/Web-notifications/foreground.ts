import { useEffect } from "react";
import { getMessagingInstance } from "../../firebase/firebase";
import { type Messaging } from "firebase/messaging";

type MessageHandler = (payload: any) => void;

export function useOnForeground(
  handler: MessageHandler,
  messagingInstance?: Messaging
) {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const loadOnMessage = async () => {
      const { onMessage } = await import("firebase/messaging");
      const activeMessaging =
        messagingInstance || (await getMessagingInstance());
      unsubscribe = onMessage(activeMessaging, handler);
    };
    loadOnMessage();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handler, messagingInstance]);
}
