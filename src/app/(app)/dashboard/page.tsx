import type { Metadata } from "next";

import { DashboardDevToolbar } from "@/components/dev/dashboard-dev-toolbar";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Cockpit",
};

export default function DashboardPage() {
  return (
    <>
      <DashboardDevToolbar />
      <DashboardView />
    </>
  );
}
