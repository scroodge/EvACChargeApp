import type { Metadata } from "next";

import { TelegramShell } from "@/components/telegram/TelegramShell";

export const metadata: Metadata = {
  title: "Telegram EV Charging Assistant",
  description:
    "VoltFlow Telegram Mini App for EV charging FAQ, education, calculator, and BYD Yuan Up guides.",
};

export default function TelegramPage() {
  return <TelegramShell />;
}
