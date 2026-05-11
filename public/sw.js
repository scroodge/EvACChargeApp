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

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload && payload.title ? payload.title : "Charge complete";
  const body = payload && payload.body ? payload.body : "Battery reached target level.";
  const tag = payload && payload.tag ? payload.tag : "charge-complete";
  const url = payload && payload.url ? payload.url : "/dashboard";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
      renotify: true,
    }),
  );
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
