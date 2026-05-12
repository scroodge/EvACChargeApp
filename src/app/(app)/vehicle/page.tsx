import type { Metadata } from "next";

import { VehicleLiveView } from "@/components/vehicle/vehicle-live-view";

export const metadata: Metadata = {
  title: "Vehicle",
};

export default function VehiclePage() {
  return <VehicleLiveView />;
}
