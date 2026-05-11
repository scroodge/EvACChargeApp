import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

type AppPreferencesState = {
  selectedCarId: string | null;
  defaultPricePerKwh: number;
  setSelectedCarId: (id: string | null) => void;
  setDefaultPricePerKwh: (n: number) => void;
};

export const useAppPreferences = create(
  persist<AppPreferencesState>(
    (set) => ({
      selectedCarId: null,
      defaultPricePerKwh: 0.12,
      setSelectedCarId: (selectedCarId) => set({ selectedCarId }),
      setDefaultPricePerKwh: (defaultPricePerKwh) =>
        set({ defaultPricePerKwh }),
    }),
    {
      name: "ev-charge-preferences",
      storage: createJSONStorage(() => localStorage),
      /* zustand typings expect the full store; we only persist primitives. */
      partialize: (s) => ({
        selectedCarId: s.selectedCarId,
        defaultPricePerKwh: s.defaultPricePerKwh,
      }) as unknown as AppPreferencesState,
    },
  ),
);
