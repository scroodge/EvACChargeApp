import type { Metadata } from "next";
import { Suspense } from "react";

import { VehicleLiveView } from "@/components/vehicle/vehicle-live-view";

export const metadata: Metadata = {
  title: "Авто",
};

export default function VehiclePage() {
  return (
    <Suspense fallback={null}>
      <VehicleLiveView />
    </Suspense>
  );
}
