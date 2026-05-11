"use client";

import { useEffect, useState } from "react";

/**
 * Monotonic wall-clock for components that need `Date.now()` outside the render phase.
 */
export function useTickingClock(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    if (!active) return;
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
