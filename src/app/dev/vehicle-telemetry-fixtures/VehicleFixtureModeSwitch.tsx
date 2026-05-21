"use client";

import { useMemo, useState } from "react";

import { VehicleLiveFixtureView } from "@/components/vehicle/vehicle-live-view";
import type { BydmateLiveSnapshotRow, BydmateTelemetryPointRow } from "@/types/database";

const STALE_OFFSET_MS = 4 * 60 * 60 * 1000;

export function VehicleFixtureModeSwitch({
  snapshot,
  points,
}: {
  snapshot: BydmateLiveSnapshotRow;
  points: BydmateTelemetryPointRow[];
}) {
  const [mode, setMode] = useState<"online" | "stale">("online");
  const displayedSnapshot = useMemo(() => {
    if (mode === "online") return snapshot;

    const staleTimestamp = new Date(Date.parse(snapshot.received_at) - STALE_OFFSET_MS).toISOString();
    return {
      ...snapshot,
      received_at: staleTimestamp,
      updated_at: staleTimestamp,
    };
  }, [mode, snapshot]);

  return (
    <div className="grid gap-4">
      <div className="inline-flex w-fit rounded-full border border-border bg-white/[0.03] p-1">
        {(["online", "stale"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={
              "rounded-full px-4 py-2 font-heading text-xs font-semibold uppercase tracking-[0.14em] transition " +
              (mode === item
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground")
            }
            aria-pressed={mode === item}
          >
            {item}
          </button>
        ))}
      </div>
      <VehicleLiveFixtureView snapshot={displayedSnapshot} points={points} />
    </div>
  );
}
