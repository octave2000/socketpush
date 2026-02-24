import type { Messaging } from "firebase/messaging";
import { useEffect, useState } from "react";
import { getMessagingInstance } from "../../firebase/firebase";
import { getHubSyncToken } from "../Web-notifications/getToken";

const DEFAULT_VAPID_KEY =
  "BFEv9Wgb_yzEmfRRL3ApQVPx9bdeXadQNz8DsSdnnThfV4XKC35tq9fWk0iOThQIbAYWcOvwdRFBHQMJwCvek-w";

type UseHubSyncTokenOptions = {
  vapidKey?: string;
  maxRetries?: number;
  messagingInstance?: Messaging;
  serviceWorker?: ServiceWorkerRegistration;
  onError?: (error: unknown) => void;
};

export const useHubSyncToken = (
  optionsOrVapidKey: UseHubSyncTokenOptions | string = DEFAULT_VAPID_KEY,
  maxRetries = 3,
  messagingInstance?: Messaging,
  serviceWorker?: ServiceWorkerRegistration
) => {
  const resolved =
    typeof optionsOrVapidKey === "string"
      ? {
          vapidKey: optionsOrVapidKey,
          maxRetries,
          messagingInstance,
          serviceWorker,
          onError: undefined,
        }
      : {
          vapidKey: optionsOrVapidKey.vapidKey || DEFAULT_VAPID_KEY,
          maxRetries: optionsOrVapidKey.maxRetries ?? 3,
          messagingInstance: optionsOrVapidKey.messagingInstance,
          serviceWorker: optionsOrVapidKey.serviceWorker,
          onError: optionsOrVapidKey.onError,
        };

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const getToken = async () => {
      const activeMessaging =
        resolved.messagingInstance || (await getMessagingInstance());
      const t = await getHubSyncToken(
        resolved.vapidKey,
        resolved.maxRetries,
        activeMessaging,
        resolved.serviceWorker,
        resolved.onError
      );
      if (isMounted) setToken(t);
    };

    getToken();

    return () => {
      isMounted = false;
    };
  }, [
    resolved.vapidKey,
    resolved.maxRetries,
    resolved.messagingInstance,
    resolved.serviceWorker,
    resolved.onError,
  ]);
  return token;
};

export const useSpToken = useHubSyncToken;
