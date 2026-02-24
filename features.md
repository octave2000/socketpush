# Socket.IO Feature and Message Contract

This document describes how to communicate with this backend over Socket.IO for all realtime features (events, room events, messaging, presence, scheduling, retries, delivery receipts, and control APIs).

It is based on the current server implementation in:

- `src/modules/socketpush/connection/ConnectionManager.ts`
- `src/modules/socketpush/connection/apiVersion/routes.ts`
- `src/modules/socketpush/BullMq/workers/eventWorker.ts`
- `src/modules/socketpush/BullMq/workers/retryWorker.ts`

## 1) Scope and model

- Transport: Socket.IO (default namespace).
- Realtime identity: `(app_uuid, alias)`.
- You must `register` first before using other socket actions.
- The server also supports plain WebSocket clients and bridges delivery between Socket.IO and plain WebSocket clients.

## 2) Client -> server Socket.IO events

## 2.1 `register`

Register a socket into an app and alias.

Payload:

```json
{
  "app_uuid": "my-app",
  "alias": "user-a",
  "token": "optional-auth-token",
  "metadata": { "role": "admin" },
  "deviceToken": "optional-device-token"
}
```

Fields:

- `app_uuid` (required)
- `alias` (optional, defaults to `socket.id`)
- `token` (required only when app has `is_auth_required = true`)
- `metadata` (optional object, echoed in `status` events)
- `deviceToken` (accepted and stored in socket data; not used by realtime logic right now)

Ack callback shape:

```json
{ "success": true }
```

or

```json
{ "success": false, "message": "..." }
```

Possible `message` values:

- `Invalid registration data`
- `Auth not configured`
- `Auth token required`
- `Unauthorized`
- `Webhook error`
- `Connection limit exceeded`
- `Error adding online user`

Side effects on success:

- Socket joins room `app_uuid`.
- Alias mapping is stored in Redis.
- Other app members receive:

```json
{
  "isOnline": true,
  "user": "user-a",
  "metadata": {}
}
```

via server event: `status`.

- Any queued undelivered messages for `(app_uuid, alias)` are replayed to this socket, then deleted.

## 2.2 `event` (targeted custom event to alias)

Payload:

```json
{
  "app_uuid": "my-app",
  "alias": "user-b",
  "event": "order.updated",
  "payload": { "orderId": "o1", "status": "paid" }
}
```

Ack callback: `boolean`

- `true`: accepted (or scheduled/delivered path succeeded)
- `false`: currently not delivered to online target (queued for retry path)

Delivery shape at receiver (Socket.IO target):

- Event name: value from `event` field (dynamic)
- Data:

```json
{ "payload": { "...": "..." }, "isRoom": false }
```

Scheduling support:

- If `payload.scheduled_at` exists, event is scheduled instead of immediate.
- Optional `payload.frequency` and `payload.repeat_until`.

Sender delivery confirmation event:

- Server emits to sender: `delivery-receipt`
- Example:

```json
{
  "event": "order.updated",
  "alias": "user-b",
  "status": "delivered"
}
```

Important: for Socket.IO target delivery, this receipt is emitted only when the target client acknowledges the emitted event within 5 seconds.

## 2.3 `roomevents` (broadcast custom event to room)

Payload:

```json
{
  "app_uuid": "my-app",
  "room": "room-1",
  "event": "typing",
  "payload": { "alias": "user-a" }
}
```

Ack callback: `boolean`

Receiver shape:

- Event name: value from `event`
- Data:

```json
{ "payload": { "...": "..." }, "isRoom": true }
```

Scheduling support:

- Same scheduler fields are supported via `payload.scheduled_at`, optional `payload.frequency`, `payload.repeat_until`.

Notes:

- Sender does not receive room event via `socket.to(room)`.
- No per-recipient delivery receipt for room broadcast.

## 2.4 `join`

Payload:

```json
{ "room": "room-1" }
```

Ack callback: `boolean`

- `true` on handler completion.

## 2.5 `leave`

Payload:

```json
{ "room": "room-1" }
```

Ack callback: `boolean`

- `true` on handler completion.

## 2.6 `message` (chat/message primitive)

Payload:

```json
{
  "app_uuid": "my-app",
  "alias": "user-b",
  "room": "room-1",
  "message": "hello",
  "encrypted": false
}
```

Fields:

- `message` required
- `room` optional (broadcast to room)
- `alias` + `app_uuid` optional pair (direct message)
- Both `room` and `alias` can be provided in one emit; both paths are executed.

Ack callback: `boolean`

- `true`: accepted and delivered to online targets, or room broadcast path executed.
- `false`: alias path could not deliver online and was queued for retry.

Receiver event:

- Event name: `receiveMessage`
- Direct or room immediate payload:

```json
{
  "message": "hello",
  "encrypted": false,
  "sender": "sender-alias"
}
```

Sender delivery confirmation event for alias path:

- `delivery-receipt`
- Example:

```json
{ "alias": "user-b", "status": "delivered" }
```

For Socket.IO direct alias delivery, this receipt depends on target ack within 5s.

## 3) Server -> client Socket.IO events

## 3.1 `status`

Presence changes inside the same `app_uuid`.

Payload:

```json
{
  "isOnline": true,
  "user": "user-a",
  "metadata": {}
}
```

Sent when:

- A client registers.
- A client disconnects.
- Plain WebSocket clients register/disconnect (bridged to Socket.IO users in same app).

## 3.2 `receiveMessage`

Chat/direct/room message payload.

Typical immediate shape:

```json
{
  "message": "...",
  "encrypted": false,
  "sender": "alias"
}
```

Replay/retry shape can include extra keys:

```json
{
  "payload": null,
  "message": "...",
  "encrypted": false,
  "sender": "alias",
  "isRoom": false
}
```

Client package should tolerate both.

## 3.3 Dynamic custom event names

For `event`/`roomevents` features, receiver gets dynamic event names (for example `order.updated`, `typing`, etc).

Payload can vary by source path:

- Wrapped:

```json
{ "payload": { "...": "..." }, "isRoom": false }
```

or

```json
{ "payload": { "...": "..." }, "isRoom": true }
```

- Raw payload (from some HTTP API routes such as `/api/event/app` or `/api/topic`).

Client package should support both wrapped and raw forms.

## 3.4 `delivery-receipt`

Emitted to sender for successful direct alias delivery.

Event direct form:

```json
{ "event": "custom.name", "alias": "user-b", "status": "delivered" }
```

Message direct form:

```json
{ "alias": "user-b", "status": "delivered" }
```

## 3.5 `limitExceeded`

Emitted when per-app event/message rate exceeds plan limit.

Examples:

- `Event limit exceeded.`
- `Message limit exceeded.`

## 3.6 `max`

Used when connection limit is exceeded. Emitted as:

```json
"Maximum concurrent connections reached."
```

Current implementation emits this to room `"main"` (not directly to the offending socket).

## 4) Delivery, retry, and scheduling semantics

## 4.1 Alias delivery order

For direct alias sends:

1. Try Socket.IO alias mapping in Redis.
2. Fallback to plain WebSocket alias mapping.
3. If still offline, persist in `undelivered_messages` and enqueue retry job.

## 4.2 Offline queue and retry worker

Queued record fields include:

- `app_uuid`, `alias`, `event`
- optional `payload`, `message`, `encrypted`, `sender`

Retry worker policy:

- Queue name: `message-retries`
- Max retries: `5`
- Exponential backoff: `1000 * 2^retryCount` ms (2s, 4s, 8s, 16s, 32s after first failed worker attempt)
- On successful resend: row is deleted.
- On max retries exceeded: row is not auto-deleted by retry worker.

## 4.3 Pending replay on register

After successful `register`, server loads undelivered rows for `(app_uuid, alias)`, emits them to this socket, then deletes them from DB.

## 4.4 Scheduled events

Scheduling inputs:

- `scheduled_at` (date string)
- optional `frequency` (string like `5s`, `5m`, `1h`, `1d`, `1w`)
- optional `repeat_until` (date string)

Execution:

- Queue name: `scheduled-events`
- Emitted by `eventWorker`
- One-time events are deleted from `scheduled` table after emission.

## 5) Rate and connection limits (per app plan)

Plan limits currently configured:

- `free`: `500` concurrent connections, `6000` events/min
- `standard`: `2500` connections, `25000` events/min
- `pro`: `10000` connections, `200000` events/min
- `premium`: `60000` connections, `700000` events/min
- `enterprise`: unlimited

Rate key strategy:

- `rate_limit:${app_uuid}:${minute}`

## 6) Auth behavior for realtime register

Per app config (`apps` table):

- If `is_auth_required = true`:
  - `token` is required in `register`.
  - Backend POSTs `{ token }` to `auth_webhook_url`.
  - Non-2xx response rejects registration.

Test helper endpoint exists:

- `POST /api/verifyToken`
- Accepts token `valid-tokens` as valid (for simple testing).

## 7) HTTP control APIs for realtime features (`/api/*`)

Base route prefix: `/api`.

These routes are not wrapped by auth middleware in current code.

## 7.1 Event APIs

1. `POST /api/event`
- Body: `{ app_uuid, alias?, event, payload? }`
- Sends optional alias-targeted emit (raw `payload`) and app-wide emit (raw `payload`).

2. `POST /api/event/alias`
- Body: `{ app_uuid, alias, event, payload?, queueIfOffline? }`
- Emits direct alias event as wrapped `{ payload, isRoom: false }`.
- If offline and `queueIfOffline !== false`, returns `202` and queues retry.

3. `POST /api/event/app`
- Body: `{ app_uuid, event, payload? }`
- Broadcasts to all app members with raw `payload`.

4. `POST /api/event/room`
- Body: `{ room, event, payload? }`
- Emits wrapped `{ payload, isRoom: true }`.

5. `POST /api/topic`
- Body: `{ topic, event, payload? }`
- Uses topic as room; emits raw `payload`.

## 7.2 Room/topic membership APIs

1. `POST /api/join`
- Body: `{ app_uuid, alias, room }`

2. `POST /api/leave`
- Body: `{ app_uuid, alias, room }`

3. `POST /api/subscribe`
- Body: `{ app_uuid, alias, topic }`
- Alias joins topic room.

4. `POST /api/unsubscribe`
- Body: `{ app_uuid, alias, topic }`
- Alias leaves topic room.

## 7.3 Message APIs

1. `POST /api/message`
- Body: `{ app_uuid, alias?, room?, message, encrypted?, sender? }`
- Room path emits `receiveMessage`.
- Alias path emits direct `receiveMessage`; queues if offline.

2. `POST /api/message/alias`
- Body: `{ app_uuid, alias, message, encrypted?, sender? }`
- Direct message with offline queue.

3. `POST /api/message/room`
- Body: `{ room, message, encrypted?, sender? }`
- Room broadcast `receiveMessage`.

## 7.4 Presence and connection control APIs

1. `GET /api/online-users/:app_uuid`
- Returns merged Socket.IO + plain WebSocket online aliases.

2. `GET /api/online-status/:app_uuid/:alias`
- Returns `isOnline`, plus `transport` (`socket.io`, `plain-websocket`, or `null`).

3. `POST /api/disconnect`
- Body: `{ app_uuid, alias }`
- Disconnects alias if connected.

## 7.5 Schedule and undelivered introspection APIs

1. `POST /api/schedule/alias`
- Body: `{ app_uuid, alias, event, payload?, scheduled_at, frequency?, repeat_until? }`

2. `POST /api/schedule/room`
- Body: `{ app_uuid, room, event, payload?, scheduled_at, frequency?, repeat_until? }`

3. `GET /api/schedule/:app_uuid`
- Lists scheduled rows.

4. `DELETE /api/schedule/:id`
- Deletes scheduled row and removes queue job if present.

5. `GET /api/undelivered/:app_uuid/:alias`
- Lists undelivered queued rows for alias.

## 8) Package implementation guidance (important)

To keep your package compatible with this backend behavior:

1. Normalize inbound custom-event payloads:
- Accept both raw payload and wrapped `{ payload, isRoom }`.

2. Normalize inbound `receiveMessage` payloads:
- Accept direct form and replay/retry form (which may include extra keys).

3. Treat socket ack callback booleans as "accepted/enqueued", not strict final delivery.

4. Use `delivery-receipt` as delivery signal for direct alias sends.

5. If you want reliable `delivery-receipt` for direct Socket.IO deliveries, ensure receiver handlers call ack callback:

```ts
socket.on("receiveMessage", (data, ack) => {
  // process data
  if (typeof ack === "function") ack({ ok: true });
});
```

And similarly for dynamic custom events your package listens to.

## 9) Important behavior quirks to handle in your package

1. Socket action name is `roomevents` (plural) for Socket.IO.
- Plain WebSocket uses `roomevent` (singular). Do not mix them.

2. Room namespace is global (not app-scoped in transport layer).
- Use app-prefixed room names (example: `my-app:room-1`) to avoid cross-app collisions.

3. `POST /api/event` can duplicate delivery when `alias` is provided.
- It may emit once directly to alias and again via app broadcast.
- Use `POST /api/event/alias` for strictly direct delivery.

4. Alias uniqueness is not strictly enforced for Socket.IO.
- Re-registering same alias can overwrite alias mapping in Redis.
- Use your own client/session policy if strict single-session alias is required.
