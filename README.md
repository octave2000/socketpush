# SocketPush Web - React Hooks for Real-Time Communication

![SocketPush Logo](https://via.placeholder.com/150x50?text=SocketPush)  
_A lightweight React library for seamless real-time functionality_

## Features

- 💬 WebSocket messaging with rooms and encryption
- 👥 Real-time online user tracking
- � Custom event system for flexible communication
- 🔔 Firebase Cloud Messaging (FCM) integration
- 📱 Foreground/background push notification handling

## Installation

````bash
npm install socketpush-web
# or
yarn add socketpush-web


import { useSocketPush, useSpToken } from 'socketpush-web';

function ChatComponent() {
  const socket = useSocketPush();
  const fcmToken = useSpToken();

  useEffect(() => {
    // Connect with user alias
    socket.connect("my_user");

    // Join default room
    socket.join("general", "my_user");

    // Listen for messages
    socket.onMessage((msg, encrypted, sender, room) => {
      console.log(`${sender} says in ${room}: ${msg}`);
    });
  }, []);

  const sendMessage = () => {
    socket.message("Hello world!", "general");
  };

  return (
    <div>
      <h2>My Chat App</h2>
      <button onClick={sendMessage}>Send Test Message</button>
      <p>FCM Token: {fcmToken || "Generating..."}</p>
    </div>
  );
}


## useSocketPush()

const socket = useSocketPush();

// Connect to server
socket.connect("user_alias", "optional_app_uuid");


##Room management

// Join a room
socket.join("game-lobby", "player1");

// Leave a room
socket.leave("game-lobby", "player1");


##messaging
// Send plain message
socket.message("Hello!", "general");

// Send encrypted message
socket.message("Secret!", "private-chat", true, "user1");

##custom events

// Trigger custom event
socket.trigger("player-move", "game-room", "player1", { x: 10, y: 5 });

// Listen for events
socket.onEvent("player-move", (data, sender, room) => {
  console.log(`${sender} moved to ${data.x},${data.y} in ${room}`);
});

##useSpToken
Handles FCM push token generation and management.

const fcmToken = useSpToken({
  vapidKey: 'BEl62iUYgUiv...', // Your VAPID key
  maxRetries: 3,              // Retry attempts
  onError: (error) => {       // Error handler
    console.error('Token error:', error);
  }
});


##useOnForeground
Handles push notifications when app is in foreground.

useOnForeground((payload) => {
  console.log('Received notification:', payload);
  // Show custom in-app notification
  showToast(payload.notification.title);
});

## Notification Sending

### `sendSPNotification()`
Sends push notifications via FCM.

**Method Signature:**
```ts
async function sendSPNotification(
  token: string,
  options?: NotificationOptions,

)

## Manuel token retrival
import { getSPToken } from 'socketpush-web';

async function setupPush() {
  try {
    const token = await getSPToken(
      process.env.VAPID_KEY,
      3, // retries
      firebase.messaging() // custom instance
    );
    console.log('Obtained token:', token);
  } catch (error) {
    console.error('Failed to get token:', error);
  }
}


## Complete event handling


  const socket = useSocketPush();

  useEffect(() => {
    socket.connect("chat_user");

    const handleOnlineUsers = (users) => {
      console.log('Online users:', users);
    };

    const handleStatusChange = (user, isOnline) => {
      console.log(`${user} is now ${isOnline ? 'online' : 'offline'}`);
    };

    // Setup all listeners
    socket.onOnlineUsers(handleOnlineUsers);
    socket.onOnlineStatus(handleStatusChange);
    socket.onMessage(handleNewMessage);
    socket.onEvent("typing", handleTypingIndicator);

    return () => {
      // Cleanup
      socket.offOnlineUsers(handleOnlineUsers);
      socket.offOnlineStatus(handleStatusChange);
      // ... other cleanup
    };
  }, []);
}

````
