import type { Metadata } from "next";

import { SettingsView } from "@/components/settings/settings-view";
import { isCurrentUserAdmin } from "@/lib/supabase/knowledge";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const isAdmin = await isCurrentUserAdmin();

  return <SettingsView isAdmin={isAdmin} />;
}
