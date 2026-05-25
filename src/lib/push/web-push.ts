import webpush from "web-push";
import { createECDH } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type PushRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: number | string | null;
};

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

export function getVapidConfig() {
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = normalizeVapidSubject(process.env.VAPID_SUBJECT);
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function normalizeVapidSubject(subject: string | undefined) {
  if (!subject) return "mailto:admin@example.com";
  if (/^[a-z][a-z0-9+.-]*:/i.test(subject)) return subject;
  return subject.includes("@") ? `mailto:${subject}` : subject;
}

function base64UrlToBuffer(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from((value + padding).replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function bufferToBase64Url(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function getVapidPublicKey() {
  const configuredPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (configuredPublicKey) return configuredPublicKey;

  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return null;

  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(base64UrlToBuffer(privateKey));
    return bufferToBase64Url(ecdh.getPublicKey());
  } catch {
    return null;
  }
}

function toWebPushSubscription(row: PushRow) {
  return {
    endpoint: row.endpoint,
    expirationTime:
      row.expiration_time == null ? null : Number(row.expiration_time),
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

function webPushStatusCode(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    typeof (err as { statusCode?: unknown }).statusCode === "number"
  )
    ? (err as { statusCode: number }).statusCode
    : null;
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload,
) {
  const vapid = getVapidConfig();
  if (!vapid) return { ok: false as const, error: "Missing VAPID configuration", sent: 0 };

  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth,expiration_time")
    .eq("user_id", userId);

  if (error) return { ok: false as const, error: error.message, sent: 0 };
  if (!rows?.length) return { ok: true as const, sent: 0 };

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  let sent = 0;
  for (const row of rows as PushRow[]) {
    try {
      await webpush.sendNotification(toWebPushSubscription(row), JSON.stringify(payload));
      sent += 1;
    } catch (err) {
      const statusCode = webPushStatusCode(err);
      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", row.endpoint);
      }
    }
  }

  return { ok: true as const, sent };
}
