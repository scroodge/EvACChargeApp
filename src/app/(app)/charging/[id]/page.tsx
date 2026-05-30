import type { Metadata } from "next";

import { ChargingSessionScreen } from "@/components/charging/charging-session-screen";
import { ChargingDevToolbar } from "@/components/dev/charging-dev-toolbar";

export const metadata: Metadata = {
  title: "Live session",
};

export default async function ChargingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <ChargingDevToolbar />
      <ChargingSessionScreen sessionId={id} />
    </>
  );
}
