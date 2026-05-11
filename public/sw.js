/* Minimal service worker — enables installability + fast SW activation. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  /* Network-only: session state restored from Supabase + local prefs. */
});
