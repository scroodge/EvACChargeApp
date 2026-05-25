import { getVapidPublicKey } from "@/lib/push/web-push";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return Response.json({ error: "Missing VAPID public key" }, { status: 404 });
  }

  return Response.json({ publicKey });
}
