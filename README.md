# HubSync Web: Real-Time Communication for React

![HubSync Logo](https://via.placeholder.com/150x50?text=HubSync)

**HubSync Web** is a lightweight and powerful React library that makes it incredibly simple to add real-time features to your web applications. Whether you're building a chat app, a notification system, or a collaborative tool, HubSync has you covered.

## Features

- **WebSocket Messaging:** Real-time, bidirectional communication with support for rooms and end-to-end encryption.
- **Online Presence:** Easily track which users are online and receive updates when their status changes.
- **Custom Events:** A flexible event system that allows you to send and receive any type of data you need.
- **Push Notifications:** Seamless integration with Firebase Cloud Messaging (FCM) for reliable push notifications.
- **Foreground and Background Handling:** Intelligently handles notifications whether your app is in the foreground or background.
- **Easy to Use:** Simple React hooks that make it easy to integrate HubSync into your existing codebase.

## Installation

```bash
npm install hubsync-web
# or
yarn add hubsync-web
```

## Migration Note

The legacy names `useSocketPush`, `useSpToken`, `getSPToken`, and `sendSPNotification` are still exported as aliases.

## Core Concepts

Before we dive in, let's quickly cover the two main parts of HubSync:

- **WebSockets (`useHubSync`):** This is for real-time, two-way communication. Think of it like a telephone call: once the connection is established, both you and the server can talk to each other instantly. This is perfect for features like chat, live updates, and online presence.
- **Push Notifications (`useHubSyncToken`, `useOnForeground`):** This is for sending one-way messages from the server to the user, even when the app is not open. This is ideal for things like news alerts, new message notifications, and other important updates.

## Getting Started: A Simple Chat App

Let's build a basic chat component to see how easy it is to get started with HubSync.

```jsx
import { useHubSync, useHubSyncToken } from 'hubsync-web';
import { useEffect } from 'react';

function ChatComponent() {
  const socket = useHubSync();
  const fcmToken = useHubSyncToken({ vapidKey: 'YOUR_VAPID_KEY' });

  useEffect(() => {
    // Connect to the HubSync server with a unique user alias
    socket.connect({ alias: 'my_user' });

    // Join a room
    socket.join({ room: 'general' });

    // Listen for incoming messages
    socket.onMessage(({ message, encrypted, sender }) => {
      console.log(`New message from ${sender}: ${message} (encrypted: ${encrypted})`);
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    // Send a message to the 'general' room
    socket.message({ message: 'Hello, world!', room: 'general' });
  };

  return (
    <div>
      <h2>My Chat App</h2>
      <button onClick={sendMessage}>Send Test Message</button>
      <p>FCM Token: {fcmToken || 'Generating...'}</p>
    </div>
  );
}
```

## Features in Detail

### `useHubSync` Hook

This is the main hook for all your WebSocket communication needs.

#### Connecting and Disconnecting

To start, you need to connect to the HubSync server. You can also provide an optional app UUID.

```jsx
const socket = useHubSync();

// Connect to the server
socket.connect({
  alias: 'user_alias',
  app_uuid: 'optional_app_uuid',
  token: 'optional-auth-token',
  deviceToken: 'optional-device-token'
});

// Disconnect from the server
socket.disconnect();
```

#### Managing Rooms

Rooms are a great way to organize your communication channels.

```jsx
// Join a room
socket.join({ room: 'game-lobby' });

// Leave a room
socket.leave({ room: 'game-lobby' });
```

#### Sending Messages

You can send both plain and encrypted messages.

```jsx
// Send a plain text message
socket.message({ message: 'Hello!', room: 'general' });

// Send an encrypted message
socket.message({
  message: 'This is a secret!',
  room: 'private-chat',
  encrypted: true,
  alias: 'user1'
});
```

#### Custom Events

For more complex interactions, you can use custom events.

```jsx
// Trigger a custom event
socket.trigger({
  event: 'player-move',
  alias: 'player1',
  payload: { x: 10, y: 5 }
});

// Listen for a custom event
socket.onEvent('player-move', ({ payload, isRoom }) => {
  console.log(`Move ${payload.x},${payload.y} (room event: ${isRoom})`);
});
```

### `useHubSyncToken` Hook

This hook manages the Firebase Cloud Messaging (FCM) token for push notifications.

```jsx
const fcmToken = useHubSyncToken({
  vapidKey: 'YOUR_VAPID_KEY', // Your VAPID key from Firebase
  maxRetries: 3,              // Number of times to retry token generation
  onError: (error) => {       // Optional error handler
    console.error('FCM Token Error:', error);
  }
});
```

### `useOnForeground` Hook

This hook allows you to handle push notifications when your app is in the foreground.

```jsx
import { useOnForeground } from 'hubsync-web';

useOnForeground((payload) => {
  console.log('Received foreground notification:', payload);
  // You can show a custom in-app notification here
  showToast(payload.notification.title);
});
```

### Sending Notifications

To send a push notification, you can use the `sendHubSyncNotification` function.

```ts
import { sendHubSyncNotification } from 'hubsync-web';

async function sendNotification(token) {
  try {
    await sendHubSyncNotification(token, {
      title: 'New Message',
      body: 'You have a new message from Alice.',
      icon: '/path/to/icon.png'
    });
    console.log('Notification sent successfully!');
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
```

### Manual Token Retrieval

If you need more control over token management, you can use the `getHubSyncToken` function.

```ts
import { getHubSyncToken } from 'hubsync-web';
import firebase from 'firebase/app';
import 'firebase/messaging';

async function setupPushNotifications() {
  try {
    const token = await getHubSyncToken(
      process.env.VAPID_KEY,
      3, // Number of retries
      firebase.messaging() // Optional custom Firebase messaging instance
    );
    console.log('FCM Token:', token);
  } catch (error) {
    console.error('Failed to get FCM token:', error);
  }
}
```

## Complete API Reference

Here is a quick overview of the available functions and their parameters.

### `useHubSync`

| Method | Description |
| --- | --- |
| `connect({ alias, app_uuid?, token?, deviceToken?, metadata? })` | Connects to the WebSocket server and registers identity. |
| `disconnect()` | Disconnects from the WebSocket server. |
| `join({ room, app_uuid? })` | Joins a room. |
| `leave({ room, app_uuid? })` | Leaves a room. |
| `message({ message, encrypted?, room?, alias?, app_uuid?, msgId? })` | Sends a message. |
| `trigger({ event, alias, payload?, app_uuid? })` | Triggers a custom event. |
| `roomEmit({ event, room, payload?, app_uuid? })` | Triggers a room event. |
| `onMessage(callback)` | Listens for incoming messages. |
| `onEvent(event, callback)` | Listens for custom events. |
| `onOnlineUsers(callback)` | Listens for a list of online users. |
| `onOnlineStatus(callback)` | Listens for changes in online status. |
| `onDelivery(callback)` | Listens for delivery receipts. |
| `onFetchUsers(callback)` | Fetches online users once. |
| `offMessage(callback)` | Removes a message listener. |
| `offEvent(event, callback)` | Removes an event listener. |
| `offOnlineUsers(callback)` | Removes the online users listener. |
| `offOnlineStatus(callback)` | Removes the online status listener. |
| `offDelivery(callback)` | Removes a delivery receipt listener. |

### `useHubSyncToken`

| Prop | Description |
| --- | --- |
| `vapidKey` | Your Firebase VAPID key. |
| `maxRetries` | The maximum number of times to retry token generation. |
| `onError` | A callback function to handle errors. |

### `useOnForeground`

| Argument | Description |
| --- | --- |
| `callback` | A function to be called when a notification is received in the foreground. |

### `sendHubSyncNotification`

| Argument | Description |
| --- | --- |
| `token` | The FCM token of the recipient. |
| `options` | The notification options (title, body, icon, etc.). |

### `getHubSyncToken`

| Argument | Description |
| --- | --- |
| `vapidKey` | Your Firebase VAPID key. |
| `maxRetries` | The maximum number of times to retry token generation. |
| `messaging` | An optional custom Firebase messaging instance. |
| `onError` | Optional callback for token fetch errors during retries. |

## Full Example

Here is a more complete example that demonstrates how to use all the features of HubSync together.

```jsx
import { useHubSync, useHubSyncToken, useOnForeground } from 'hubsync-web';
import { useEffect, useState } from 'react';

function ComprehensiveChat() {
  const socket = useHubSync();
  const fcmToken = useHubSyncToken({ vapidKey: 'YOUR_VAPID_KEY' });
  const [onlineUsers, setOnlineUsers] = useState([]);

  useOnForeground((payload) => {
    console.log('Foreground notification:', payload);
    alert(`New notification: ${payload.notification.title}`);
  });

  useEffect(() => {
    socket.connect({ alias: 'chat_user' });
    socket.join({ room: 'support' });

    const handleOnlineUsers = (users) => {
      console.log('Online users:', users);
      setOnlineUsers(users);
    };

    const handleStatusChange = ({ user, isOnline }) => {
      console.log(`${user} is now ${isOnline ? 'online' : 'offline'}`);
    };

    const handleNewMessage = ({ message, encrypted, sender }) => {
      console.log(`New message from ${sender}: ${message} (encrypted: ${encrypted})`);
    };

    const handleTypingIndicator = ({ payload, isRoom }) => {
      console.log('Typing payload:', payload, 'room event:', isRoom);
    };

    // Set up all the event listeners
    socket.onOnlineUsers(handleOnlineUsers);
    socket.onOnlineStatus(handleStatusChange);
    socket.onMessage(handleNewMessage);
    socket.onEvent('typing', handleTypingIndicator);

    // Clean up all the event listeners when the component unmounts
    return () => {
      socket.offOnlineUsers(handleOnlineUsers);
      socket.offOnlineStatus(handleStatusChange);
      socket.offMessage(handleNewMessage);
      socket.offEvent('typing', handleTypingIndicator);
      socket.disconnect();
    };
  }, []);

  const sendTypingEvent = () => {
    socket.roomEmit({
      event: 'typing',
      room: 'support',
      payload: { isTyping: true }
    });
  };

  return (
    <div>
      <h2>Support Chat</h2>
      <p>FCM Token: {fcmToken || 'Generating...'}</p>
      <div>
        <h3>Online Users</h3>
        <ul>
          {onlineUsers.map((user) => (
            <li key={user}>{user}</li>
          ))}
        </ul>
      </div>
      <input type="text" onKeyPress={sendTypingEvent} placeholder="Type a message..." />
    </div>
  );
}
```
