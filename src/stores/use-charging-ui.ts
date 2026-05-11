import { create } from "zustand";

import type { DerivedChargingState } from "@/lib/charging-math";

type ChargingUiState = {
  liveDerived: DerivedChargingState | null;
  tick: () => number;
  setLiveDerived: (d: DerivedChargingState | null) => void;
};

/** High-frequency derived UI (from timestamps); no persistence. */
export const useChargingUi = create<ChargingUiState>((set) => ({
  liveDerived: null,
  tick: 0,
  setLiveDerived: (liveDerived) =>
    set((s) => ({ liveDerived, tick: s.tick + 1 })),
}));
