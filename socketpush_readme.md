# 📦 SocketPush React Hooks

A small library of React hooks to handle:

✅ WebSocket real-time messaging  
✅ Online user tracking  
✅ Custom events  
✅ Firebase Cloud Messaging (FCM) tokens  
✅ Foreground push notifications

---

## 🚀 Installation

\`\`\`bash
npm install your-package-name
\`\`\`

---

## 📚 Hook Overview

### 1️⃣ `useSocketPush()`

**Provides socket actions and event handlers.**

\`\`\`tsx
const socket = useSocketPush();
\`\`\`

---

### 🛠️ Available Methods

#### 1️⃣ `connect(alias?: string, app_uuid?: string)`

👉 **Purpose**: Connect to the socket server.  
👉 **Parameters**:

- \`alias\`: (optional) A custom name or alias for the user.
- \`app_uuid\`: (optional) Your app’s unique identifier. If not provided, defaults to \`process.env.NEXT_PUBLIC_SOCKET_APP\`.

**Example**:
\`\`\`ts
socket.connect("john_doe");
\`\`\`

---

#### 2️⃣ `trigger(event: string, room?: string, alias?: string, payload?: any, app_uuid?: string)`

👉 **Purpose**: Trigger a custom event.  
👉 **Parameters**:

- \`event\`: (required) Name of the custom event.
- \`room\`: (optional) Room to send the event to.
- \`alias\`: (optional) Sender’s alias.
- \`payload\`: (optional) Data to send with the event.
- \`app_uuid\`: (optional) Your app’s unique ID.

**Example**:
\`\`\`ts
socket.trigger("like", "room1", "john_doe", { postId: "123" });
\`\`\`

---

#### 3️⃣ `join(room: string, alias: string, app_uuid?: string)`

👉 **Purpose**: Join a chat room.  
👉 **Parameters**:

- \`room\`: (required) Room name to join.
- \`alias\`: (required) User’s alias.
- \`app_uuid\`: (optional) App ID.

**Example**:
\`\`\`ts
socket.join("general", "john_doe");
\`\`\`

---

#### 4️⃣ `leave(room: string, alias: string, app_uuid?: string)`

👉 **Purpose**: Leave a chat room.  
👉 **Parameters**:

- \`room\`: (required) Room name.
- \`alias\`: (required) User’s alias.
- \`app_uuid\`: (optional) App ID.

**Example**:
\`\`\`ts
socket.leave("general", "john_doe");
\`\`\`

---

#### 5️⃣ `message(message: string, room?: string, encrypted = false, alias?: string, app_uuid?: string)`

👉 **Purpose**: Send a message.  
👉 **Parameters**:

- \`message\`: (required) Message text.
- \`room\`: (optional) Room to send to.
- \`encrypted\`: (optional) \`true\` if message should be encrypted.
- \`alias\`: (optional) Sender’s alias.
- \`app_uuid\`: (optional) App ID.

**Example**:
\`\`\`ts
socket.message("Hello, everyone!", "general", false, "john_doe");
\`\`\`

---

#### 6️⃣ `getOnlineUsers(app_uuid?: string)`

👉 **Purpose**: Get the list of online users.  
👉 **Parameters**:

- \`app_uuid\`: (optional) App ID.

**Example**:
\`\`\`ts
socket.getOnlineUsers();
\`\`\`

---

#### 7️⃣ Event Handlers

| Method                 | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| \`onOnlineUsers(cb)\`  | Get real-time list of online users.       |
| \`onOnlineStatus(cb)\` | Get updates when users go online/offline. |
| \`onMessage(cb)\`      | Receive messages.                         |
| \`onEvent(event, cb)\` | Listen to custom events.                  |

**Example**:
\`\`\`ts
socket.onMessage((msg, encrypted, from, room) => {
console.log("New message:", msg);
});
\`\`\`

---

### 2️⃣ `useSpToken()`

**Get a fresh FCM push token.**

\`\`\`tsx
const fcmToken = useSpToken();
\`\`\`

Options:

- \`vapidKey\`: (optional) Public VAPID key for FCM.
- \`maxRetries\`: (optional) Retry count for getting the token.
- \`messagingInstance\`: (optional) Custom Firebase messaging instance.
- \`serviceWorker\`: (optional) Custom service worker.

---

### 3️⃣ `useOnForeground()`

**Handle push notifications when app is open.**

\`\`\`tsx
useOnForeground((payload) => {
console.log("Foreground push:", payload);
});
\`\`\`

---

### 4️⃣ `getSPToken()`

**Directly get an FCM push token.**

\`\`\`ts
const token = await getSPToken(vapidKey, 3, messagingInstance, serviceWorker);
console.log("Token:", token);
\`\`\`

---

## 🌟 Example

\`\`\`tsx
export default function App() {
const socket = useSocketPush();
const fcmToken = useSpToken();

useEffect(() => {
socket.connect("john_doe");
socket.join("general", "john_doe");
socket.onMessage((msg) => console.log("New msg:", msg));
}, []);

return (

<div>
<h1>My Chat</h1>
<p>FCM Token: {fcmToken}</p>
</div>
);
}
\`\`\`

---

## 📁 Files Overview

| File                   | Description                            |
| ---------------------- | -------------------------------------- |
| \`useSocketPush.ts\`   | Main hook for socket-based messaging   |
| \`useSpToken.ts\`      | Hook for getting FCM push token        |
| \`useOnForeground.ts\` | Hook for foreground push notifications |
| \`getSPToken.ts\`      | Function to get FCM token manually     |
| \`socketpush.ts\`      | Internal socket action implementation  |

---

✅ Now you have everything you need to start using **SocketPush**! Enjoy coding! 🚀
