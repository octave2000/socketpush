# Client Listen, Server Send (HubSync Web)

This is the straight path for **clients listening to custom events** and **server sending those events**.

## 1) Install

```bash
npm install hubsync-web
```

## 2) Client: connect + onEvent

```tsx
import { useEffect } from "react";
import { useHubSync } from "hubsync-web";

export function RealtimeListener() {
  const socket = useHubSync();

  useEffect(() => {
    const onOrderUpdate = ({ payload, isRoom }: {
      payload: { orderId: string; status: string };
      isRoom: boolean;
    }) => {
      console.log("order.updated", payload, { isRoom });
    };

    (async () => {
      await socket.connect({
        alias: "user-123",
        // optional if NEXT_PUBLIC_SOCKET_APP is set
        app_uuid: "YOUR_APP_UUID",
      });

      socket.onEvent("order.updated", onOrderUpdate);
    })().catch(console.error);

    return () => {
      socket.offEvent("order.updated", onOrderUpdate);
      socket.disconnect();
    };
  }, [socket]);

  return null;
}
```

Notes:
- `alias` is the user identifier the server targets.
- `event` string **must match** what the server sends.
- Callback always receives `{ payload, isRoom }`.

## 3) Server: send event to a user (Node.js)

```ts
import { createHubSyncHttpClient } from "hubsync-web/server";

const hub = createHubSyncHttpClient({
  // optional: defaults to the built-in HubSync baseUrl
  baseUrl: "https://ylpv246y.eu1.hubfly.app",
  appId: process.env.HUBSYNC_APP_UUID, // or pass app_uuid per call
  apiKey: process.env.SOCKET_API_KEY,  // optional if your backend requires it
});

export async function sendOrderUpdate() {
  await hub.eventAlias({
    alias: "user-123",
    event: "order.updated",
    payload: { orderId: "o-1", status: "paid" },
    // optional: app_uuid: "YOUR_APP_UUID"
  });
}
```

## 4) Server: send event to a room or everyone

```ts
// Room
await hub.eventRoom({
  room: "support",
  event: "typing",
  payload: { isTyping: true },
});

// App-wide broadcast
await hub.eventApp({
  event: "system.maintenance",
  payload: { startsAt: "2026-03-30T01:00:00Z" },
});
```

## 5) Minimal environment setup

Client:
```
NEXT_PUBLIC_SOCKET_APP=YOUR_APP_UUID
```

Server:
```
HUBSYNC_APP_UUID=YOUR_APP_UUID
SOCKET_API_KEY=YOUR_SERVER_API_KEY
```

That's it. Connect the client, listen with `onEvent`, and send from the server with `eventAlias` / `eventRoom` / `eventApp`.
