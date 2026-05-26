"use client";

import { savePushSubscription } from "@/actions/push";

export async function ensureNotificationsPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "default") return;
  try {
    await Notification.requestPermission();
  } catch {
    /* non-fatal */
  }
}

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const normalized = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

async function getVapidPublicKey() {
  const configured = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (configured) return configured;

  try {
    const response = await fetch("/api/push/vapid-public-key", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { publicKey?: unknown };
    return typeof payload.publicKey === "string" ? payload.publicKey : null;
  } catch {
    return null;
  }
}

export async function ensurePushSubscription() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return;
  }

  if (Notification.permission !== "granted") return;

  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) return;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  await savePushSubscription({
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  });
}

export async function getPushClientStatus() {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  if (!supported) {
    return {
      supported,
      permission: "unsupported",
      serviceWorker: "unsupported",
      hasSubscription: false,
      endpointHost: null as string | null,
    };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  let endpointHost: string | null = null;
  if (subscription?.endpoint) {
    try {
      endpointHost = new URL(subscription.endpoint).host;
    } catch {
      endpointHost = "unknown";
    }
  }

  return {
    supported,
    permission: Notification.permission,
    serviceWorker: registration?.active?.state ?? registration?.installing?.state ?? "missing",
    hasSubscription: Boolean(subscription),
    endpointHost,
  };
}

export async function showLocalTestNotification() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return { ok: false as const, error: "Push is not supported here" };
  }

  if (Notification.permission !== "granted") {
    return { ok: false as const, error: `Notification permission is ${Notification.permission}` };
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification("VoltFlow local test", {
    body: "Local notification test on this device.",
    tag: `local-test:${Date.now()}`,
    data: { url: "/settings" },
  });

  return { ok: true as const };
}
