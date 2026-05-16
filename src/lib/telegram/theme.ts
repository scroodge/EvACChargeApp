import type { CSSProperties } from "react";

import type { TelegramThemeParams } from "@/lib/telegram/useTelegramWebApp";

export function getTelegramThemeStyle(themeParams: TelegramThemeParams) {
  return {
    "--tg-bg-color": themeParams.bg_color ?? "#12151C",
    "--tg-text-color": themeParams.text_color ?? "#F8FAFC",
    "--tg-hint-color": themeParams.hint_color ?? "#6B7280",
    "--tg-link-color": themeParams.link_color ?? "#00D1FF",
    "--tg-button-color": themeParams.button_color ?? "#00E676",
    "--tg-button-text-color": themeParams.button_text_color ?? "#06110B",
  } as CSSProperties;
}
