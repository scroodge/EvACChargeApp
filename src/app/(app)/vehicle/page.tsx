import type { Metadata } from "next";

import { VehicleLiveView } from "@/components/vehicle/vehicle-live-view";

export const metadata: Metadata = {
  title: "Авто",
};

export default function VehiclePage() {
  return <VehicleLiveView />;
}
