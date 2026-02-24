import { initializeApp, type FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

const defaultConfig: FirebaseConfig = {
  apiKey: "AIzaSyDo405YhmN0bXIf_ekjOJ812dXGDycUtlQ",
  authDomain: "real-sync-40951.firebaseapp.com",
  projectId: "real-sync-40951",
  storageBucket: "real-sync-40951.firebasestorage.app",
  messagingSenderId: "1021854933750",
  appId: "1:1021854933750:web:6e45b242cd89368f35c2d7",
  measurementId: "G-91G1B0L5YC",
};

let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

function getFirebaseApp(config: FirebaseConfig = defaultConfig): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = initializeApp(config);
  }

  return firebaseApp;
}

async function getMessagingInstance(
  config: FirebaseConfig = defaultConfig
): Promise<Messaging> {
  if (typeof window === "undefined") {
    throw new Error("Firebase Messaging is only available in browser environments.");
  }

  if (!messagingInstance) {
    const { getMessaging } = await import("firebase/messaging");
    messagingInstance = getMessaging(getFirebaseApp(config));
  }

  return messagingInstance;
}

async function registerServiceWorker(options: {
  swPath?: string;
}): Promise<ServiceWorkerRegistration> {
  const swPath = options.swPath || "/hubsync-sw.js";
  const registration = await navigator.serviceWorker.register(swPath);
  console.log("[hubsync] Service worker registered:", registration.scope);
  return registration;
}

async function webPushInit(config: FirebaseConfig): Promise<Messaging> {
  if (typeof window === "undefined") {
    throw new Error("Firebase Messaging is only available in browser environments.");
  }

  const { getMessaging } = await import("firebase/messaging");
  const app: FirebaseApp = initializeApp(config);
  return getMessaging(app);
}

export { registerServiceWorker, webPushInit, getMessagingInstance };
