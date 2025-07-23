# SocketPush Web: Real-Time Communication for React

![SocketPush Logo](https://via.placeholder.com/150x50?text=SocketPush)

**SocketPush Web** is a lightweight and powerful React library that makes it incredibly simple to add real-time features to your web applications. Whether you're building a chat app, a notification system, or a collaborative tool, SocketPush has you covered.

## Features

- **WebSocket Messaging:** Real-time, bidirectional communication with support for rooms and end-to-end encryption.
- **Online Presence:** Easily track which users are online and receive updates when their status changes.
- **Custom Events:** A flexible event system that allows you to send and receive any type of data you need.
- **Push Notifications:** Seamless integration with Firebase Cloud Messaging (FCM) for reliable push notifications.
- **Foreground and Background Handling:** Intelligently handles notifications whether your app is in the foreground or background.
- **Easy to Use:** Simple React hooks that make it easy to integrate SocketPush into your existing codebase.

## Installation

```bash
npm install socketpush-web
# or
yarn add socketpush-web
```

## Core Concepts

Before we dive in, let's quickly cover the two main parts of SocketPush:

- **WebSockets (`useSocketPush`):** This is for real-time, two-way communication. Think of it like a telephone call: once the connection is established, both you and the server can talk to each other instantly. This is perfect for features like chat, live updates, and online presence.
- **Push Notifications (`useSpToken`, `useOnForeground`):** This is for sending one-way messages from the server to the user, even when the app is not open. This is ideal for things like news alerts, new message notifications, and other important updates.

## Getting Started: A Simple Chat App

Let's build a basic chat component to see how easy it is to get started with SocketPush.

```jsx
import { useSocketPush, useSpToken } from 'socketpush-web';
import { useEffect } from 'react';

function ChatComponent() {
  const socket = useSocketPush();
  const fcmToken = useSpToken({ vapidKey: 'YOUR_VAPID_KEY' });

  useEffect(() => {
    // Connect to the SocketPush server with a unique user alias
    socket.connect('my_user');

    // Join a room
    socket.join('general', 'my_user');

    // Listen for incoming messages
    socket.onMessage((message, isEncrypted, sender, room) => {
      console.log(`New message from ${sender} in ${room}: ${message}`);
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    // Send a message to the 'general' room
    socket.message('Hello, world!', 'general');
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

### `useSocketPush` Hook

This is the main hook for all your WebSocket communication needs.

#### Connecting and Disconnecting

To start, you need to connect to the SocketPush server. You can also provide an optional app UUID.

```jsx
const socket = useSocketPush();

// Connect to the server
socket.connect('user_alias', 'optional_app_uuid');

// Disconnect from the server
socket.disconnect();
```

#### Managing Rooms

Rooms are a great way to organize your communication channels.

```jsx
// Join a room
socket.join('game-lobby', 'player1');

// Leave a room
socket.leave('game-lobby', 'player1');
```

#### Sending Messages

You can send both plain and encrypted messages.

```jsx
// Send a plain text message
socket.message('Hello!', 'general');

// Send an encrypted message
socket.message('This is a secret!', 'private-chat', true, 'user1');
```

#### Custom Events

For more complex interactions, you can use custom events.

```jsx
// Trigger a custom event
socket.trigger('player-move', 'game-room', 'player1', { x: 10, y: 5 });

// Listen for a custom event
socket.onEvent('player-move', (data, sender, room) => {
  console.log(`${sender} moved to ${data.x},${data.y} in ${room}`);
});
```

### `useSpToken` Hook

This hook manages the Firebase Cloud Messaging (FCM) token for push notifications.

```jsx
const fcmToken = useSpToken({
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
import { useOnForeground } from 'socketpush-web';

useOnForeground((payload) => {
  console.log('Received foreground notification:', payload);
  // You can show a custom in-app notification here
  showToast(payload.notification.title);
});
```

### Sending Notifications

To send a push notification, you can use the `sendSPNotification` function.

```ts
import { sendSPNotification } from 'socketpush-web';

async function sendNotification(token) {
  try {
    await sendSPNotification(token, {
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

If you need more control over token management, you can use the `getSPToken` function.

```ts
import { getSPToken } from 'socketpush-web';
import firebase from 'firebase/app';
import 'firebase/messaging';

async function setupPushNotifications() {
  try {
    const token = await getSPToken(
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

### `useSocketPush`

| Method | Description |
| --- | --- |
| `connect(alias, uuid)` | Connects to the WebSocket server. |
| `disconnect()` | Disconnects from the WebSocket server. |
| `join(room, alias)` | Joins a room. |
| `leave(room, alias)` | Leaves a room. |
| `message(msg, room, encrypt, receiver)` | Sends a message. |
| `trigger(event, room, sender, data)` | Triggers a custom event. |
| `onMessage(callback)` | Listens for incoming messages. |
| `onEvent(event, callback)` | Listens for custom events. |
| `onOnlineUsers(callback)` | Listens for a list of online users. |
| `onOnlineStatus(callback)` | Listens for changes in online status. |
| `offMessage(callback)` | Removes a message listener. |
| `offEvent(event, callback)` | Removes an event listener. |
| `offOnlineUsers(callback)` | Removes the online users listener. |
| `offOnlineStatus(callback)` | Removes the online status listener. |

### `useSpToken`

| Prop | Description |
| --- | --- |
| `vapidKey` | Your Firebase VAPID key. |
| `maxRetries` | The maximum number of times to retry token generation. |
| `onError` | A callback function to handle errors. |

### `useOnForeground`

| Argument | Description |
| --- | --- |
| `callback` | A function to be called when a notification is received in the foreground. |

### `sendSPNotification`

| Argument | Description |
| --- | --- |
| `token` | The FCM token of the recipient. |
| `options` | The notification options (title, body, icon, etc.). |

### `getSPToken`

| Argument | Description |
| --- | --- |
| `vapidKey` | Your Firebase VAPID key. |
| `maxRetries` | The maximum number of times to retry token generation. |
| `messaging` | An optional custom Firebase messaging instance. |

## Full Example

Here is a more complete example that demonstrates how to use all the features of SocketPush together.

```jsx
import { useSocketPush, useSpToken, useOnForeground } from 'socketpush-web';
import { useEffect, useState } from 'react';

function ComprehensiveChat() {
  const socket = useSocketPush();
  const fcmToken = useSpToken({ vapidKey: 'YOUR_VAPID_KEY' });
  const [onlineUsers, setOnlineUsers] = useState([]);

  useOnForeground((payload) => {
    console.log('Foreground notification:', payload);
    alert(`New notification: ${payload.notification.title}`);
  });

  useEffect(() => {
    socket.connect('chat_user');
    socket.join('support', 'chat_user');

    const handleOnlineUsers = (users) => {
      console.log('Online users:', users);
      setOnlineUsers(users);
    };

    const handleStatusChange = (user, isOnline) => {
      console.log(`${user} is now ${isOnline ? 'online' : 'offline'}`);
    };

    const handleNewMessage = (message, isEncrypted, sender, room) => {
      console.log(`New message from ${sender} in ${room}: ${message}`);
    };

    const handleTypingIndicator = (data, sender, room) => {
      if (sender !== 'chat_user') {
        console.log(`${sender} is typing in ${room}...`);
      }
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
    socket.trigger('typing', 'support', 'chat_user', { isTyping: true });
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