"use server";

import webpush from "web-push";

import { createClient } from "@/lib/supabase/server";

type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: number | string | null;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
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

export async function savePushSubscription(input: PushSubscriptionPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "Unauthorized" };

  if (
    !input?.endpoint ||
    !input?.keys?.p256dh ||
    !input?.keys?.auth
  ) {
    return { ok: false as const, error: "Invalid push subscription" };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      expiration_time: input.expirationTime,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { ok: false as const, error: error.message };

  return { ok: true as const };
}

export async function sendChargeCompletedPush(sessionId: string) {
  const vapid = getVapidConfig();
  if (!vapid) return { ok: false as const, error: "Missing VAPID configuration" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth,expiration_time")
    .eq("user_id", user.id);

  if (error) return { ok: false as const, error: error.message };
  if (!rows?.length) return { ok: true as const, sent: 0 };

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const payload = JSON.stringify({
    title: "Charge complete",
    body: "Battery reached target level.",
    url: `/charging/${sessionId}`,
    tag: `charge-complete:${sessionId}`,
  });

  let sent = 0;
  for (const row of rows as PushRow[]) {
    try {
      await webpush.sendNotification(toWebPushSubscription(row), payload);
      sent += 1;
    } catch (err) {
      const statusCode =
        typeof err === "object" &&
        err !== null &&
        "statusCode" in err &&
        typeof (err as { statusCode?: unknown }).statusCode === "number"
          ? (err as { statusCode: number }).statusCode
          : null;

      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", row.endpoint);
      }
    }
  }

  return { ok: true as const, sent };
}
