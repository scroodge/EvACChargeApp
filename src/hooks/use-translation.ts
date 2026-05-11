"use client";

import { useCallback, useSyncExternalStore } from "react";

import { defaultLocale, translate, type TranslationKey } from "@/lib/i18n";
import { useAppPreferences } from "@/stores/use-app-preferences";

export function useTranslation() {
  const locale = useAppPreferences((s) => s.locale);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const effectiveLocale = mounted ? locale : defaultLocale;

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) =>
      translate(effectiveLocale, key, values),
    [effectiveLocale],
  );

  return { locale: effectiveLocale, t };
}
