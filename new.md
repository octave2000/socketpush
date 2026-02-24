# hubsync-web (simple usage)

## 1) Install

```bash
npm install hubsync-web
```

## 2) Important rules

- Use only public imports from `"hubsync-web"`.
- Do not import internal paths like `"hubsync-web/firebase/firebase"`.
- In Next.js App Router, use this package in client components (`"use client"`).

## 3) Push setup (only if you need notifications)

Generate service worker file:

```bash
npx hubsync
```

This creates:

- `public/hubsync-sw.js`

## 4) Realtime (main hook)

```tsx
"use client";

import { useEffect } from "react";
import { useHubSync } from "hubsync-web";

export default function Chat() {
  const socket = useHubSync();

  useEffect(() => {
    const start = async () => {
      await socket.connect({
        alias: "user-1",
        app_uuid: "your-app-uuid", // optional if NEXT_PUBLIC_SOCKET_APP is set
        token: "optional-auth-token",
        deviceToken: "optional-device-token",
        metadata: { role: "member" },
      });

      await socket.join({ room: "general" });
    };

    const onMessage = ({
      message,
      sender,
    }: {
      message: string;
      encrypted: boolean;
      sender: string;
    }) => {
      console.log("message:", message, "from:", sender);
    };

    const onTyping = ({
      payload,
      isRoom,
    }: {
      payload: { isTyping: boolean };
      isRoom: boolean;
    }) => {
      console.log("typing:", payload, "room event:", isRoom);
    };

    socket.onMessage(onMessage);
    socket.onEvent("typing", onTyping);
    start().catch(console.error);

    return () => {
      socket.offMessage(onMessage);
      socket.offEvent("typing", onTyping);
      socket.disconnect();
    };
  }, []);

  const sendMessage = async () => {
    await socket.message({ message: "Hello", room: "general" });
  };

  const sendTyping = async () => {
    await socket.roomEmit({
      event: "typing",
      room: "general",
      payload: { isTyping: true },
    });
  };

  return (
    <div>
      <button onClick={sendMessage}>Send Message</button>
      <button onClick={sendTyping}>Typing</button>
    </div>
  );
}
```

## 5) Realtime methods you will use

- `connect({ alias, app_uuid?, token?, deviceToken?, metadata? })`
- `disconnect()`
- `join({ room, app_uuid? })`
- `leave({ room, app_uuid? })`
- `message({ message, encrypted?, room?, alias?, app_uuid?, msgId? })`
- `trigger({ event, alias, payload?, app_uuid? })` (direct to alias)
- `roomEmit({ event, room, payload?, app_uuid? })` (room broadcast)
- `onMessage(cb)` / `offMessage(cb)`
- `onEvent(event, cb)` / `offEvent(event, cb)`
- `onOnlineUsers(cb)` / `offOnlineUsers(cb)`
- `onOnlineStatus(cb)` / `offOnlineStatus(cb)`
- `onDelivery(cb)` / `offDelivery(cb)`
- `onFetchUsers(cb)` (one-time fetch)

## 6) Push token hook

```tsx
"use client";

import { useHubSyncToken } from "hubsync-web";

export function TokenView() {
  const token = useHubSyncToken({
    vapidKey: "YOUR_VAPID_KEY",
    maxRetries: 3,
    onError: (err) => console.error(err),
  });

  return <p>{token || "Generating token..."}</p>;
}
```

## 7) Foreground notification listener

```tsx
"use client";

import { useOnForeground } from "hubsync-web";

export function ForegroundListener() {
  useOnForeground((payload) => {
    console.log("foreground notification:", payload);
  });

  return null;
}
```

## 8) Send notification (server-side helper)

```ts
import { sendHubSyncNotification } from "hubsync-web";

await sendHubSyncNotification("recipient-fcm-token", {
  title: "New message",
  body: "You have a new message",
  icon: "/icon.png",
  data: { room: "general" },
});
```

Uses:

- `Authorization: Bearer ${process.env.SOCKET_API_KEY}`

## 9) Manual token APIs

```ts
import { getHubSyncToken, removeToken } from "hubsync-web";
import { getMessaging } from "firebase/messaging";
import { initializeApp } from "firebase/app";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const token = await getHubSyncToken("YOUR_VAPID_KEY", 3, messaging);
const removed = await removeToken(messaging);
```

## 10) Low-level API (without React hook)

```ts
import { hubsync } from "hubsync-web";

await hubsync.connect({ alias: "user-1", app_uuid: "your-app-uuid" });
await hubsync.join({ room: "general" });
await hubsync.message({ message: "hello", room: "general" });
```

## 11) Legacy alias names (still exported)

- `useSocketPush` -> `useHubSync`
- `useSpToken` -> `useHubSyncToken`
- `getSPToken` -> `getHubSyncToken`
- `sendSPNotification` -> `sendHubSyncNotification`
- `socketpush` -> `hubsync`

