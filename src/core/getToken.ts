import { getToken, type Messaging } from "firebase/messaging";
import {
  messaging as defaultMessaging,
  registerServiceWorker,
} from "../firebase/firebase";

export const getSPToken = async (
  vapidKey: string,
  maxRetries: number,
  messagingInstance: Messaging,
  serviceWorker?: ServiceWorkerRegistration
): Promise<string | null> => {
  // ✅ Make sure we’re in the browser first
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Notifications not supported in this environment");
    return null;
  }

  // ✅ Only register the service worker in the browser
  const defaultRegistration = await registerServiceWorker({
    swPath: "/socketpush-sw.js",
  });

  if (Notification.permission === "denied") {
    console.warn("Notification permission denied");
    return null;
  }

  // Request permission if not already granted
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }
  }

  // Try fetching the token with retries
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const token = await getToken(messagingInstance, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: serviceWorker || defaultRegistration,
      });
      if (token) {
        console.info("FCM token obtained:", token);
        return token;
      } else {
        console.warn(`No token received (attempt ${attempt + 1})`);
      }
    } catch (err) {
      console.error(`Error fetching FCM token (attempt ${attempt + 1})`, err);
    }

    attempt++;
    await new Promise((res) => setTimeout(res, 1000));
  }

  console.error("Failed to obtain FCM token after retries");
  return null;
};
