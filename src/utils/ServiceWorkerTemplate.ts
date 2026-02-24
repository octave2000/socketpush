export const sw = `

try {
  importScripts(
    "https://websocket.hubfly.app/hubsync-service-worker.js"
  );
} catch (e) {
  importScripts(
    "https://websocket.hubfly.app/socketpush-service-worker.js"
  );
}


`;
