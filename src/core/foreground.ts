import { onMessage, type Messaging } from "firebase/messaging";
import { messaging } from "../firebase/firebase";

type MessageHandler = (payload: any) => void;

let initialized: boolean = false;
const handlers = new Set<MessageHandler>();

export function onForeground(
  handler: MessageHandler,
  messagingInstance: Messaging = messaging
) {
  handlers.add(handler);

  if (initialized) return;
  initialized = true;

  onMessage(messagingInstance, (payload) => {
    handlers.forEach((h) => h(payload));
  });
}
