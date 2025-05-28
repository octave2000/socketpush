

importScripts(
  "https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js"
);

const SW_VERSION = "v0.0.1";


//  Inject your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDo405YhmN0bXIf_ekjOJ812dXGDycUtlQ",
  authDomain: "real-sync-40951.firebaseapp.com",
  projectId: "real-sync-40951",
  storageBucket: "real-sync-40951.appspot.com",
  messagingSenderId: "1021854933750",
  appId: "1:1021854933750:web:6e45b242cd89368f35c2d7",
  measurementId: "G-91G1B0L5YC",
};

// Default notification fallback options
const DEFAULT_NOTIFICATION_OPTIONS = {
  icon: "./logo.png",
  renotify: true,
  fallbackUrl: "/",
  vibrate: [200, 100, 200],
  requireInteraction: false,
  actions: [],
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM SW] Background message received:", payload);

  const notification = payload.notification || {};
  const data = payload.data || {};
  const fcmOptions = payload.fcmOptions || {};

  const notificationTitle = notification.title || "New Notification";
  const notificationBody = notification.body || "You have a new message.";
  const notificationIcon =
    notification.icon || DEFAULT_NOTIFICATION_OPTIONS.icon;
  const clickUrl =
    fcmOptions.link || data.link || DEFAULT_NOTIFICATION_OPTIONS.fallbackUrl;
  const type = data.type || "default";
  const tag = data.tag ;

  const notificationOptions = {
    body: notificationBody,
    icon: notificationIcon,
    vibrate: DEFAULT_NOTIFICATION_OPTIONS.vibrate,
    requireInteraction: DEFAULT_NOTIFICATION_OPTIONS.requireInteraction,
    actions: DEFAULT_NOTIFICATION_OPTIONS.actions,
    tag,
    data: {
      url: clickUrl,
      type,
      ...data,
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[FCM SW] Notification clicked:", event.notification);

  const { url } = event.notification.data || {};
  event.notification.close();

  if (!url) {
    console.warn("[FCM SW] No URL in notification data.");
    return;
  }

  const openPromise = clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients
          .openWindow(url)
          .catch((err) =>
            console.error("[FCM SW] Failed to open window:", err)
          );
      }
    });

  event.waitUntil(
    Promise.race([
      openPromise,
      new Promise((_, reject) => setTimeout(reject, 5000)), // Timeout safety
    ])
  );
});

// Handle notification dismiss
self.addEventListener("notificationclose", (event) => {
  console.log("[FCM SW] Notification dismissed:", event.notification);
});

