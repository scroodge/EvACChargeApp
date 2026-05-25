"use client";

import { useSyncExternalStore } from "react";

import {
  defaultLocale,
  locales,
  localeLabels,
  localeNames,
  type Locale,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppPreferences } from "@/stores/use-app-preferences";

export function LocaleSwitcher({
  className,
  onLocaleChange,
}: {
  className?: string;
  onLocaleChange?: (locale: Locale, previousLocale: Locale) => void;
}) {
  const locale = useAppPreferences((s) => s.locale);
  const setLocale = useAppPreferences((s) => s.setLocale);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const effectiveLocale = mounted ? locale : defaultLocale;

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1",
        className,
      )}
      aria-label="Language"
    >
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          className={cn(
            "h-9 min-w-11 rounded-full px-3 text-xs font-semibold transition-colors",
            item === effectiveLocale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={localeLabels[item]}
          aria-pressed={item === effectiveLocale}
          onClick={() => {
            if (item === effectiveLocale) return;
            setLocale(item);
            onLocaleChange?.(item, effectiveLocale);
          }}
        >
          {localeNames[item]}
        </button>
      ))}
    </div>
  );
}
