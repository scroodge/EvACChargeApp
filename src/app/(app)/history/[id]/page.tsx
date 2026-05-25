import type { Metadata } from "next";

import { ChargingSessionScreen } from "@/components/charging/charging-session-screen";

export const metadata: Metadata = {
  title: "Session detail",
};

export default async function HistorySessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChargingSessionScreen sessionId={id} mode="history" />;
}
