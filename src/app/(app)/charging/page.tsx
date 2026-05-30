import type { Metadata } from "next";

import { ChargingHubView } from "@/components/charging/charging-hub-view";
import { ChargingDevToolbar } from "@/components/dev/charging-dev-toolbar";

export const metadata: Metadata = {
  title: "Charging bay",
};

export default function ChargingIndexPage() {
  return (
    <>
      <ChargingDevToolbar />
      <ChargingHubView />
    </>
  );
}
