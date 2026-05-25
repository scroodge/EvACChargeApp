import Link from "next/link";
import { notFound } from "next/navigation";

import { VehicleFixtureModeSwitch } from "@/app/dev/vehicle-telemetry-fixtures/VehicleFixtureModeSwitch";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  BydmateLiveSnapshotRow,
  BydmateTelemetryPointRow,
} from "@/types/database";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const DEFAULT_VEHICLE_ID = "way";
const SAMPLE_LIMIT = 420;

type SampleRow = {
  id: string;
  vehicle_id: string;
  user_id: string;
  device_time: string;
  received_at: string;
  telemetry: BydmateTelemetryPointRow["telemetry"];
  diplus?: BydmateTelemetryPointRow["diplus"];
  diplus_min_cell_voltage_v?: number | null;
  diplus_max_cell_voltage_v?: number | null;
  diplus_cell_delta_v?: number | null;
};

export default async function DevVehiclePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const vehicleId = readParam(params.vehicle_id) ?? DEFAULT_VEHICLE_ID;
  const supabase = createServiceClient();

  const { data: liveRows, error: liveError } = await supabase
    .from("bydmate_live_snapshots")
    .select("id, vehicle_id, user_id, source, schema_version, device_time, received_at, telemetry, diplus, location, raw_payload, updated_at, diplus_min_cell_voltage_v, diplus_max_cell_voltage_v, diplus_cell_delta_v")
    .eq("vehicle_id", vehicleId)
    .order("received_at", { ascending: false })
    .limit(1);

  const { data: sampleRows, error: samplesError } = await supabase
    .from("bydmate_telemetry_samples")
    .select("id, vehicle_id, user_id, device_time, received_at, telemetry, diplus, diplus_min_cell_voltage_v, diplus_max_cell_voltage_v, diplus_cell_delta_v")
    .eq("vehicle_id", vehicleId)
    .order("device_time", { ascending: false })
    .limit(SAMPLE_LIMIT);

  const snapshot = ((liveRows ?? []) as BydmateLiveSnapshotRow[])[0] ?? null;
  const points = ((sampleRows ?? []) as SampleRow[])
    .map(sampleToPoint)
    .sort((a, b) => Date.parse(a.device_time) - Date.parse(b.device_time));

  return (
    <main className="safe-bottom mx-auto flex max-w-6xl flex-col gap-5 px-4 pb-8 pt-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
            Dev / Vehicle
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-normal">
            BYDMate vehicle page
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Real Supabase data for <span className="font-mono text-foreground">{vehicleId}</span>.
            Trip delta chart is drawn from 100% SOC to 0% SOC.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dev/history?vehicle_id=${vehicleId}`}>Dev history</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dev/bydmate-diplus?vehicle_id=${vehicleId}`}>Di+ debug</Link>
          </Button>
        </div>
      </header>

      {(liveError || samplesError) ? (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {liveError ? <p>Live query: {liveError.message}</p> : null}
          {samplesError ? <p>Samples query: {samplesError.message}</p> : null}
        </section>
      ) : null}

      {!snapshot ? (
        <section className="rounded-2xl border border-border bg-white/[0.03] p-5 text-sm text-muted-foreground">
          No live snapshot found for <span className="font-mono">{vehicleId}</span>.
        </section>
      ) : (
        <VehicleFixtureModeSwitch snapshot={snapshot} points={points} />
      )}
    </main>
  );
}

function sampleToPoint(sample: SampleRow): BydmateTelemetryPointRow {
  return {
    id: sample.id,
    vehicle_id: sample.vehicle_id,
    user_id: sample.user_id,
    source: "BYDMate",
    schema_version: 1,
    device_time: sample.device_time,
    received_at: sample.received_at,
    telemetry: sample.telemetry ?? {},
    diplus: sample.diplus ?? {},
    location: {},
    raw_payload: null,
    diplus_min_cell_voltage_v: sample.diplus_min_cell_voltage_v,
    diplus_max_cell_voltage_v: sample.diplus_max_cell_voltage_v,
    diplus_cell_delta_v: sample.diplus_cell_delta_v,
  };
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value?.trim() || null;
}
