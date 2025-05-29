import type { Messaging } from "firebase/messaging";
import { useEffect, useState } from "react";
import { messaging as defaultMessaging } from "../../firebase/firebase";
import { getSPToken } from "../getToken";

export const useSpToken = (
  vapidKey: string = "BFEv9Wgb_yzEmfRRL3ApQVPx9bdeXadQNz8DsSdnnThfV4XKC35tq9fWk0iOThQIbAYWcOvwdRFBHQMJwCvek-w",
  maxRetries = 3,
  messagingInstance: Messaging = defaultMessaging,
  serviceWorker?: ServiceWorkerRegistration
) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const getToken = async () => {
      const t = await getSPToken(
        vapidKey,
        maxRetries,
        messagingInstance,
        serviceWorker
      );
      if (isMounted) setToken(t);
    };

    getToken();

    return () => {
      isMounted = false;
    };
  }, [vapidKey, maxRetries, messagingInstance, serviceWorker]);
  return token;
};
