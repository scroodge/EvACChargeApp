import type { Metadata } from "next";

import { ChargingHubView } from "@/components/charging/charging-hub-view";

export const metadata: Metadata = {
  title: "Charging bay",
};

export default function ChargingIndexPage() {
  return <ChargingHubView />;
}
