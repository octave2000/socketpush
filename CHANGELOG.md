# socketpush-web

## 0.8.0

### Minor Changes

- change of urls in package

## 0.7.4

### Patch Changes

- updating serviceworker url

## 0.7.3

### Patch Changes

- change the url

## 0.7.2

### Patch Changes

- removed emit with ack

## 0.7.1

### Patch Changes

- # useSocketPush Hook – v0.7.1

  A lightweight, React-first WebSocket connection manager built around Socket.IO, offering safe connection handling, clean event management, and a developer-friendly API.

  ## Features

  ### Reactive Connection Management

  - Tracks socket connection state with `connectionState` (`"disconnected" | "connecting" | "connected" | "error"`).
  - Automatically attaches and cleans up connection listeners on mount/unmount.
  - Provides `connect()` and `disconnect()` functions with proper state transitions and error handling.

  ### Safe Command Execution

  All outbound functions ensure the socket is connected before proceeding:

  - `trigger()`
  - `join()`
  - `leave()`
  - `message()`
  - `roomEmit()`

  Prevents race conditions and silent failures by throwing if connection isn't ready.

  ### Real-Time Event Subscriptions

  Easily subscribe to events with the following methods:

  - `onMessage(callback)`
  - `onDelivery(callback)`
  - `onOnlineUsers(callback)`
  - `onOnlineStatus(callback)`
  - `onFetchUsers(callback)`
  - `onEvent(eventName, callback)` – supports custom event listeners

  Built-in cleanup ensures previous listeners are removed before new ones are registered.

  ### Strong Typing & Performance

  - All methods are fully typed with parameter inference from backend wrappers.
  - Uses `useCallback` to memoize handlers and avoid unnecessary renders.
  - Maintains all internal callbacks using `useRef` to preserve stability across renders.

## 0.7.0

### Minor Changes

- # useSocketPush Hook – v1.0.0

  A lightweight, React-first WebSocket connection manager built around Socket.IO, offering safe connection handling, clean event management, and a developer-friendly API.

  ## Features

  ### Reactive Connection Management

  - Tracks socket connection state with `connectionState` (`"disconnected" | "connecting" | "connected" | "error"`).
  - Automatically attaches and cleans up connection listeners on mount/unmount.
  - Provides `connect()` and `disconnect()` functions with proper state transitions and error handling.

  ### Safe Command Execution

  All outbound functions ensure the socket is connected before proceeding:

  - `trigger()`
  - `join()`
  - `leave()`
  - `message()`
  - `roomEmit()`

  Prevents race conditions and silent failures by throwing if connection isn't ready.

  ### Real-Time Event Subscriptions

  Easily subscribe to events with the following methods:

  - `onMessage(callback)`
  - `onDelivery(callback)`
  - `onOnlineUsers(callback)`
  - `onOnlineStatus(callback)`
  - `onFetchUsers(callback)`
  - `onEvent(eventName, callback)` – supports custom event listeners

  Built-in cleanup ensures previous listeners are removed before new ones are registered.

  ### Strong Typing & Performance

  - All methods are fully typed with parameter inference from backend wrappers.
  - Uses `useCallback` to memoize handlers and avoid unnecessary renders.
  - Maintains all internal callbacks using `useRef` to preserve stability across renders.

## 0.6.0

### Minor Changes

- Enhanced developer experience with improved real-time communication capabilities. This release introduces new features for seamless integration with React hooks and extends web notification support, making it easier to build interactive applications.

## 0.5.0

### Minor Changes

- added scheduling wrappers

## 0.4.3

### Patch Changes

- fix onlineusers

## 0.4.2

### Patch Changes

- fixed getting onlineUsers

## 0.4.1

### Patch Changes

- added event types

## 0.4.0

### Minor Changes

- stable expiremental version

## 0.3.1

### Patch Changes

- solved childprocess fix

## 0.3.0

### Minor Changes

- added triggerRoomEvents

## 0.2.6

### Patch Changes

- changed event handling

## 0.2.5

### Patch Changes

- added sender in message wrapper

## 0.2.4

### Patch Changes

- add how to use in readme

## 0.2.3

### Patch Changes

- added readme

## 0.2.2

### Patch Changes

- added read me

## 0.2.1

### Patch Changes

- export socket hook

## 0.2.0

### Minor Changes

- added websocket functionalities

## 0.1.4

### Patch Changes

- added new url
- new stuff

## 0.1.3

### Patch Changes

- f896ea1: mad onforeground hook

## 0.1.2

### Patch Changes

- added an executable file and made react hook for get token

## 0.1.1

### Patch Changes

- updated postinstall command

## 0.1.0

### Minor Changes

- 7c46e90: added core functionalities

## 0.0.3

### Patch Changes

- added npmignore file

## 0.0.2

### Patch Changes

- 99ca1c0: initial point
