# HubSync Web - Full Usage Guide

This guide explains how to use `hubsync-web` end to end.
It is based on the current implementation in `src/`.

## 1) What this package gives you

`hubsync-web` provides:

- React hook for realtime socket workflows: `useHubSync` (alias: `useSocketPush`)
- React hook for FCM token management: `useHubSyncToken` (alias: `useSpToken`)
- Foreground push listener hook: `useOnForeground`
- Manual token functions: `getHubSyncToken` / `removeToken`
- Notification sender helper: `sendHubSyncNotification` (alias: `sendSPNotification`)
- Low-level realtime wrapper object: `hubsync` (alias: `socketpush`)

## 2) Installation

```bash
npm install hubsync-web
```

or

```bash
yarn add hubsync-web
```

## 3) Prerequisites

Before using realtime and push features, make sure:

- You have an app UUID from your backend.
- You set `NEXT_PUBLIC_SOCKET_APP` in your frontend env, or pass `app_uuid` per call.
- You provide a valid Firebase VAPID key for push token generation.
- Your app can serve `public/` files (for service worker file registration).

Example `.env`:

```env
NEXT_PUBLIC_SOCKET_APP=my-app-uuid
SOCKET_API_KEY=your-server-api-key
```

## 4) Service worker setup (for push notifications)

The package ships a CLI command `hubsync` (from package `bin`) that writes service-worker files to `public/`.

Run:

```bash
npx hubsync
```

It writes:

- `public/hubsync-sw.js`
- `public/socketpush-sw.js` (legacy fallback)

The generated worker imports the remote worker script from HubSync infrastructure.

## 5) Quick start (React)

```tsx
import { useEffect } from "react";
import { useHubSync, useHubSyncToken, useOnForeground } from "hubsync-web";

export function ChatPage() {
  const socket = useHubSync();
  const fcmToken = useHubSyncToken({
    vapidKey: "YOUR_VAPID_KEY",
    maxRetries: 3,
    onError: (error) => console.error("Token error:", error),
  });

  useOnForeground((payload) => {
    console.log("Foreground push:", payload);
  });

  useEffect(() => {
    const setup = async () => {
      await socket.connect({
        alias: "user-1",
        app_uuid: "my-app-uuid",
        token: "optional-auth-token",
        deviceToken: "optional-device-token",
        metadata: { role: "admin" },
      });

      await socket.join({ room: "support" });
    };

    const handleMessage = ({
      message,
      encrypted,
      sender,
    }: {
      message: string;
      encrypted: boolean;
      sender: string;
    }) => {
      console.log("Message", { message, encrypted, sender });
    };

    const handleTyping = ({
      payload,
      isRoom,
    }: {
      payload: { isTyping: boolean };
      isRoom: boolean;
    }) => {
      console.log("Typing event", { payload, isRoom });
    };

    const handleOnlineStatus = ({
      user,
      isOnline,
    }: {
      user: string;
      isOnline: boolean;
    }) => {
      console.log("Status change", user, isOnline);
    };

    socket.onMessage(handleMessage);
    socket.onEvent("typing", handleTyping);
    socket.onOnlineStatus(handleOnlineStatus);

    setup().catch(console.error);

    return () => {
      socket.offMessage(handleMessage);
      socket.offEvent("typing", handleTyping);
      socket.offOnlineStatus(handleOnlineStatus);
      socket.disconnect();
    };
  }, []);

  const sendMessage = async () => {
    await socket.message({
      message: "Hello from UI",
      room: "support",
      encrypted: false,
    });
  };

  const sendTyping = async () => {
    await socket.roomEmit({
      event: "typing",
      room: "support",
      payload: { isTyping: true },
    });
  };

  return (
    <div>
      <button onClick={sendMessage}>Send message</button>
      <button onClick={sendTyping}>Typing event</button>
      <p>FCM token: {fcmToken || "Generating..."}</p>
    </div>
  );
}
```

## 6) Realtime API (`useHubSync`)

### 6.1 Connection and state

`useHubSync()` returns:

- `connectionState`: `"disconnected" | "connecting" | "connected" | "error"`
- `error`: `string | null`
- `connect(params)`
- `disconnect()`
- socket command methods (`trigger`, `join`, `leave`, `roomEmit`, `message`)
- listeners and unsubscribers (`on*` / `off*`)

`connect` signature:

```ts
connect({
  alias: string;
  app_uuid?: string;
  token?: string;
  deviceToken?: string;
  metadata?: Record<string, any>;
}): Promise<void>
```

Important behavior:

- `connect` opens socket transport, then emits `register`.
- If `register` fails, it throws and state becomes `"error"`.
- If you call command methods before connected, hook throws an error.

### 6.2 Emit methods

All methods return:

```ts
Promise<{ success: boolean; message?: string }>
```

#### Trigger a direct custom event

```ts
await socket.trigger({
  event: "order.updated",
  alias: "user-b",
  payload: { orderId: "o1", status: "paid" },
  app_uuid: "my-app-uuid",
});
```

#### Trigger a room event

```ts
await socket.roomEmit({
  event: "typing",
  room: "room-1",
  payload: { alias: "user-a" },
  app_uuid: "my-app-uuid",
});
```

#### Join/leave room

```ts
await socket.join({ room: "room-1" });
await socket.leave({ room: "room-1" });
```

#### Send message

```ts
await socket.message({
  message: "hello",
  encrypted: false,
  room: "room-1",     // optional
  alias: "user-b",    // optional direct target
  app_uuid: "my-app", // optional if env var exists
  msgId: "custom-id", // optional
});
```

Notes:

- You can provide `room`, `alias`, or both.
- Backend may treat command ack as accepted/enqueued, not guaranteed final delivery.

### 6.3 Listener methods

#### Message listener

```ts
const onMessage = ({
  message,
  encrypted,
  sender,
}: {
  message: string;
  encrypted: boolean;
  sender: string;
}) => {};

socket.onMessage(onMessage);
socket.offMessage(onMessage);
```

#### Custom event listener

```ts
const onTyping = ({
  payload,
  isRoom,
}: {
  payload: { isTyping: boolean };
  isRoom: boolean;
}) => {};

socket.onEvent("typing", onTyping);
socket.offEvent("typing", onTyping);
```

Payload normalization behavior:

- If backend sends wrapped form `{ payload, isRoom }`, callback receives it.
- If backend sends raw payload, wrapper converts to `{ payload: raw, isRoom: false }`.

#### Online users and status

```ts
const onUsers = (users: { alias: string }[]) => {};
const onStatus = (data: { isOnline: boolean; user: string }) => {};

socket.onOnlineUsers(onUsers);
socket.onOnlineStatus(onStatus);

socket.offOnlineUsers(onUsers);
socket.offOnlineStatus(onStatus);
```

One-time fetch:

```ts
socket.onFetchUsers((users) => {
  console.log("Current online users", users);
});
```

#### Delivery receipts

```ts
const onDelivery = (data: {
  alias: string;
  status: string;
  msgId?: string;
  evtId?: string;
}) => {};

socket.onDelivery(onDelivery);
socket.offDelivery(onDelivery);
```

## 7) Scheduling fields in event payloads

`trigger` and `roomEmit` payloads support scheduling metadata:

```ts
await socket.trigger({
  event: "reminder",
  alias: "user-b",
  payload: {
    text: "Daily reminder",
    scheduled_at: "2026-02-25T09:00:00.000Z",
    frequency: "1d",
    repeat_until: "2026-03-31T23:59:59.999Z",
  },
});
```

Supported `frequency` units:

- `s`, `m`, `h`, `d`, `w` (for example `5m`, `1d`)

## 8) Push token APIs

### 8.1 `useHubSyncToken`

Preferred options form:

```ts
const token = useHubSyncToken({
  vapidKey: "YOUR_VAPID_KEY",
  maxRetries: 3,
  messagingInstance,  // optional
  serviceWorker,      // optional
  onError: (err) => console.error(err),
});
```

Also supported (legacy positional):

```ts
const token = useHubSyncToken(
  "YOUR_VAPID_KEY",
  3,
  messagingInstance,
  serviceWorker
);
```

### 8.2 `getHubSyncToken` (manual)

```ts
import { getHubSyncToken } from "hubsync-web";
import { getMessaging } from "firebase/messaging";

const token = await getHubSyncToken(
  "YOUR_VAPID_KEY",
  3,
  getMessaging(),
  undefined,
  (err) => console.error("Token fetch error", err)
);
```

### 8.3 `removeToken`

```ts
import { removeToken } from "hubsync-web";

const removed = await removeToken();
console.log("Token removed:", removed);
```

## 9) Foreground notifications

```ts
import { useOnForeground } from "hubsync-web";

useOnForeground((payload) => {
  console.log("Foreground notification payload:", payload);
});
```

## 10) Sending notifications via API helper

`sendHubSyncNotification` sends a POST to:

- default: `https://websocket.hubfly.app/send-notification`

Signature:

```ts
sendHubSyncNotification(
  token: string,
  options?: {
    title?: string;
    message?: string;
    body?: string;
    icon?: string;
    link?: string;
    type?: string;
    data?: Record<string, any>;
    actions?: { action: string; title: string }[];
  },
  api?: string
)
```

Example:

```ts
import { sendHubSyncNotification } from "hubsync-web";

await sendHubSyncNotification(
  "recipient-fcm-token",
  {
    title: "New Message",
    body: "You have a new message.",
    icon: "/icon.png",
    data: { room: "support" },
  },
  "https://websocket.hubfly.app/send-notification"
);
```

Auth header uses:

- `Authorization: Bearer ${process.env.SOCKET_API_KEY}`

## 11) Low-level wrapper usage (`hubsync`)

If you do not want the React hook, you can import `hubsync` directly:

```ts
import { hubsync } from "hubsync-web";

await hubsync.connect({ alias: "user-a", app_uuid: "my-app" });
await hubsync.join({ room: "general" });
await hubsync.message({ message: "Hello", room: "general" });
```

Hook usage is recommended because it provides connection state and safer lifecycle cleanup.

## 12) Legacy alias exports

Backward-compatible aliases currently exported:

- `useSocketPush` -> `useHubSync`
- `useSpToken` -> `useHubSyncToken`
- `getSPToken` -> `getHubSyncToken`
- `sendSPNotification` -> `sendHubSyncNotification`
- `socketpush` -> `hubsync`

## 13) Troubleshooting

### Connection fails or never registers

Check:

- `NEXT_PUBLIC_SOCKET_APP` is set or `app_uuid` is provided.
- `token` is present when backend auth is enabled.
- Network can reach `https://websocket.hubfly.app`.

### Commands throw "Socket is not connected"

- Wait for `await socket.connect(...)` to finish.
- Check `connectionState` and `error`.

### Notifications not working

Check:

- Service worker files exist in `public/` (`npx hubsync`).
- Browser notification permission is granted.
- Valid VAPID key is used.
- Token generation errors via `onError` callback.

### Delivery receipts not appearing

- Receipts are for direct alias delivery paths.
- Receiver must acknowledge socket events (package listener wrappers already acknowledge by default).

## 14) Type notes

Core payload types are exported from package `types`:

- `InternalPayload` for scheduling fields
- `MessageCallback`
- `EventCallback`
- `OnlineUsersCallback`
- `OnlineStatusCallback`
- `deliveryCallback`

You can import them:

```ts
import type { EventCallback, MessageCallback } from "hubsync-web";
```
