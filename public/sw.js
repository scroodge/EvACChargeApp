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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlFromData =
    event.notification && event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) {
            return client.navigate(urlFromData).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlFromData);
      }
      return undefined;
    }),
  );
});
