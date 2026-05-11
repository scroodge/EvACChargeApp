import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

type AppPreferencesState = {
  selectedCarId: string | null;
  defaultPricePerKwh: number;
  locale: Locale;
  setSelectedCarId: (id: string | null) => void;
  setDefaultPricePerKwh: (n: number) => void;
  setLocale: (locale: Locale) => void;
};

export const useAppPreferences = create(
  persist<AppPreferencesState>(
    (set) => ({
      selectedCarId: null,
      defaultPricePerKwh: 0.12,
      locale: defaultLocale,
      setSelectedCarId: (selectedCarId) => set({ selectedCarId }),
      setDefaultPricePerKwh: (defaultPricePerKwh) =>
        set({ defaultPricePerKwh }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "ev-charge-preferences",
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppPreferencesState> | undefined;
        return {
          ...current,
          ...saved,
          locale:
            saved?.locale && isLocale(saved.locale)
              ? saved.locale
              : current.locale,
        };
      },
      /* zustand typings expect the full store; we only persist primitives. */
      partialize: (s) => ({
        selectedCarId: s.selectedCarId,
        defaultPricePerKwh: s.defaultPricePerKwh,
        locale: s.locale,
      }) as unknown as AppPreferencesState,
    },
  ),
);
