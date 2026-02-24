import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

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

const firebaseApp = initializeApp(defaultConfig);
const messaging = getMessaging(firebaseApp);

async function registerServiceWorker(options: {
  swPath?: string;
}): Promise<ServiceWorkerRegistration> {
  const primaryPath = options.swPath || "/hubsync-sw.js";

  try {
    const registration = await navigator.serviceWorker.register(primaryPath);
    console.log("[hubsync] Service worker registered:", registration.scope);
    return registration;
  } catch (error) {
    if (primaryPath !== "/hubsync-sw.js") {
      throw error;
    }

    const legacyPath = "/socketpush-sw.js";
    console.warn(
      `[hubsync] Failed to register ${primaryPath}, retrying with ${legacyPath}`
    );
    const fallbackRegistration = await navigator.serviceWorker.register(
      legacyPath
    );
    console.log(
      "[hubsync] Service worker registered via legacy path:",
      fallbackRegistration.scope
    );
    return fallbackRegistration;
  }
}

function webPushInit(config: FirebaseConfig): Messaging {
  const app: FirebaseApp = initializeApp(config);
  return getMessaging(app);
}

export { messaging, registerServiceWorker, webPushInit };
