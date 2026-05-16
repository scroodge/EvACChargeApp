/* Minimal service worker — installability, push, and a tiny public Telegram cache. */
const TELEGRAM_CACHE = "voltflow-telegram-v1";
const TELEGRAM_ASSETS = [
  "/telegram",
  "/manifest.webmanifest",
  "/voltflow-icon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(TELEGRAM_CACHE)
      .then((cache) => cache.addAll(TELEGRAM_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isTelegramPage =
    url.origin === self.location.origin && url.pathname.startsWith("/telegram");
  const isPublicAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      TELEGRAM_ASSETS.includes(url.pathname));

  if (!isTelegramPage && !isPublicAsset) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(TELEGRAM_CACHE).then((cache) => {
            cache.put(request, copy).catch(() => undefined);
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (isTelegramPage) {
            return caches
              .match("/telegram")
              .then(
                (fallback) =>
                  fallback ||
                  new Response("VoltFlow Telegram knowledge base is offline.", {
                    status: 503,
                    headers: { "Content-Type": "text/plain; charset=utf-8" },
                  }),
              );
          }
          return new Response("", { status: 504, statusText: "Offline" });
        }),
      ),
  );
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
