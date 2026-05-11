"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { startChargingSession } from "@/actions/sessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { deriveChargingState, formatDuration, type ChargingParams } from "@/lib/charging-math";
import { queryKeys } from "@/lib/query-keys";
import { useCarsQuery } from "@/hooks/use-cars-query";
import { fetchSessions } from "@/hooks/use-sessions-query";
import { useAppPreferences } from "@/stores/use-app-preferences";
import type { ChargingSessionRow } from "@/types/database";
import type { Car } from "@/types/database";

export function DashboardView() {
  const router = useRouter();
  const { data: cars, isLoading } = useCarsQuery();
  const selectedCarId = useAppPreferences((s) => s.selectedCarId);
  const setSelectedCarId = useAppPreferences((s) => s.setSelectedCarId);
  const defaultPrice = useAppPreferences((s) => s.defaultPricePerKwh);

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: fetchSessions,
    refetchInterval: (query) => {
      const list = query.state.data as ChargingSessionRow[] | undefined;
      const has = list?.some((s) => s.status === "charging");
      return has ? 1000 : false;
    },
  });

  const activeSession = useMemo(
    () => sessions?.find((s) => s.status === "charging"),
    [sessions],
  );

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!activeSession) return;
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [activeSession]);

  const selectedCar =
    cars?.find((c) => c.id === selectedCarId) ?? cars?.[0] ?? null;

  useEffect(() => {
    if (!cars?.length) return;
    const exists = cars.some((c) => c.id === selectedCarId);
    if (!exists) setSelectedCarId(cars[0].id);
  }, [cars, selectedCarId, setSelectedCarId]);

  const liveActive = useMemo(() => {
    if (!activeSession?.started_at) return null;
    const params: ChargingParams = {
      startPercent: activeSession.start_percent,
      targetPercent: activeSession.target_percent,
      batteryCapacityKwh: activeSession.battery_capacity_kwh,
      chargerPowerKw: activeSession.charger_power_kw,
      efficiencyPercent: activeSession.efficiency_percent,
      pricePerKwh: activeSession.price_per_kwh,
    };
    return deriveChargingState(
      params,
      Date.parse(activeSession.started_at),
      Date.now(),
    );
  }, [activeSession, tick]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [startPct, setStartPct] = useState("42");
  const [targetPct, setTargetPct] = useState("90");
  const [chargerKw, setChargerKw] = useState("");
  const [price, setPrice] = useState(String(defaultPrice));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPrice(String(defaultPrice));
  }, [defaultPrice]);

  const handleStart = async () => {
    if (!selectedCar) return;
    const start = Number(startPct);
    const target = Number(targetPct);
    if (!(start < target))
      return toast.error("Target must exceed current battery level");
    if (start < 0 || target > 100) return toast.error("Percent must stay 0–100");

    setSubmitting(true);
    const overrides =
      chargerKw.trim() !== "" ? { chargerPowerKw: Number(chargerKw) } : {};
    try {
      const res = await startChargingSession({
        carId: selectedCar.id,
        startPercent: start,
        targetPercent: target,
        pricePerKwh: Number(price) || 0,
        ...overrides,
      });
      if (!res.ok) throw new Error(res.error);
      setDialogOpen(false);
      toast.success("Charging started");
      router.push(`/charging/${res.sessionId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em]">
          EV dashboard
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">
          Charge Pulse
        </h1>
        <p className="text-muted-foreground text-base">
          Big controls, realtime math, synced to Supabase.
        </p>
      </header>

      {!isLoading && cars && cars.length === 0 ? (
        <Card className="border-white/12 bg-card/80 shadow-[0_20px_60px_-30px_rgb(34_211_238/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight">Add your EV</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-base">
            We need a battery size and onboard charger preset to simulate energy and time.
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="h-[52px] w-full rounded-full text-base font-semibold">
              <Link href="/cars/new">Add vehicle</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {cars && cars.length > 0 ? (
        <>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Vehicle
            </Label>
            {isLoading ? (
              <Skeleton className="h-14 w-full rounded-2xl" />
            ) : (
              <Select
                value={selectedCar?.id}
                onValueChange={(value) => setSelectedCarId(value)}
              >
                <SelectTrigger className="h-14 rounded-2xl text-base md:text-lg">
                  <SelectValue placeholder="Choose a car" />
                </SelectTrigger>
                <SelectContent>
                  {cars.map((car) => (
                    <SelectItem key={car.id} value={car.id}>
                      <div className="flex flex-col text-left leading-tight">
                        <span className="font-medium">{car.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {car.battery_capacity_kwh} kWh pack ·{" "}
                          {car.default_charger_power_kw} kW onboard
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <ActivePulseCard
            loading={loadingSessions}
            selectedCar={selectedCar}
            activeSession={activeSession ?? null}
            live={liveActive}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <UtilityLink
              headline="Fleet"
              subtitle="Tune capacity & charger defaults"
              href="/cars/new"
              cta="Add another EV"
            />
            <UtilityLink
              headline="History"
              subtitle="Completed & stopped cycles"
              href="/history"
              cta="View sessions"
            />
          </div>
        </>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+7rem)] z-40 mx-auto mt-auto w-full max-w-lg">
          <Button
            size="lg"
            className="shadow-[0_20px_50px_-20px_rgb(45_212_191/0.95)] hover:brightness-110 mt-6 h-[60px] w-full rounded-full text-lg font-semibold tracking-wide shadow-lg"
            disabled={!selectedCar || Boolean(activeSession)}
            onClick={() =>
              !activeSession && selectedCar && setDialogOpen(true)
            }
          >
            {activeSession ? "Charging..." : "Start charging"}
          </Button>
        </div>
        <DialogContent className="gap-6 rounded-[1.75rem] border-white/15">
          <DialogHeader>
            <DialogTitle className="text-xl">Quick session</DialogTitle>
            <p className="text-muted-foreground text-base">
              Targets are deterministic from timestamps · prices use your tariff.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-pct">Current charge %</Label>
              <Input
                id="start-pct"
                inputMode="decimal"
                pattern="[0-9]*"
                min={0}
                max={99}
                type="number"
                value={startPct}
                onChange={(e) => setStartPct(e.target.value)}
                className="h-[52px] rounded-xl text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-pct">Target charge %</Label>
              <Input
                id="target-pct"
                inputMode="decimal"
                type="number"
                value={targetPct}
                min={Number(startPct) + 1}
                max={100}
                onChange={(e) => setTargetPct(e.target.value)}
                className="h-[52px] rounded-xl text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charger-kw">AC power override (optional)</Label>
              <Input
                id="charger-kw"
                placeholder={`Default · ${selectedCar?.default_charger_power_kw ?? "--"} kW`}
                type="number"
                inputMode="decimal"
                step="0.1"
                value={chargerKw}
                onChange={(e) => setChargerKw(e.target.value)}
                className="h-[52px] rounded-xl text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="energy-price">Electricity price €/kWh</Label>
              <Input
                id="energy-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-[52px] rounded-xl text-lg"
              />
              <p className="text-muted-foreground text-xs">
                Mirrors your utility statement — uses AC energy from the pedestal.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-3 sm:flex-col">
            <Button
              variant="outline"
              className="min-h-[48px] rounded-full border-white/25"
              onClick={() => setDialogOpen(false)}
            >
              Later
            </Button>
            <Button
              className="hover:brightness-110 min-h-[52px] flex-1 rounded-full text-base font-semibold"
              disabled={submitting || !selectedCar}
              onClick={() => void handleStart()}
            >
              {submitting ? "Starting..." : "Start session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivePulseCard({
  loading,
  selectedCar,
  activeSession,
  live,
}: {
  loading: boolean;
  selectedCar: Car | null;
  activeSession: ChargingSessionRow | null;
  live: ReturnType<typeof deriveChargingState> | null;
}) {
  const currentLive =
    live ??
    (activeSession?.started_at
      ? deriveChargingState(
          {
            startPercent: activeSession.start_percent,
            targetPercent: activeSession.target_percent,
            batteryCapacityKwh: activeSession.battery_capacity_kwh,
            chargerPowerKw: activeSession.charger_power_kw,
            efficiencyPercent: activeSession.efficiency_percent,
            pricePerKwh: activeSession.price_per_kwh,
          },
          Date.parse(activeSession.started_at),
          Date.now(),
        )
      : null);

  return (
    <Card className="border-white/[0.1] bg-gradient-to-br from-primary/13 via-transparent to-teal-500/13 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
          Live cockpit
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {loading ? "Hydrating realtime row…" : "Timestamp-based math survives refresh"}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {activeSession ? (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-muted-foreground text-sm uppercase tracking-[0.2em]">
                Battery
              </span>
              <motion.span
                className="text-primary text-8xl leading-none font-semibold drop-shadow-[0_0_40px_oklch(0.73_0.15_173/0.4)] tracking-tighter tabular-nums"
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ repeat: Infinity, duration: 2.4 }}
              >
                {(currentLive?.currentPercent ?? activeSession.current_percent).toFixed(1)}
                %
              </motion.span>
              <p className="text-muted-foreground text-base">
                {currentLive
                  ? `About ${formatDuration(currentLive.remainingSeconds)} remaining`
                  : "Calculating timers…"}
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-[52px] w-full rounded-full text-base font-semibold"
              variant="secondary"
            >
              <Link href={`/charging/${activeSession.id}`}>Open realtime view</Link>
            </Button>
          </>
        ) : (
          <div className="space-y-3 text-muted-foreground text-base leading-relaxed">
            <p>
              {selectedCar
                ? `Ready with ${selectedCar.name}. Pulse math runs off wall timestamps and persists to Supabase.`
                : "Choose a saved vehicle above to simulate time, kWh and cost precisely."}
            </p>
            <div className="bg-card rounded-2xl border border-white/[0.08] px-5 py-4 text-sm text-foreground/80">
              <p className="font-semibold text-foreground tracking-tight">Tip</p>
              <p className="text-muted-foreground mt-2">
                Larger tap targets everywhere — optimised for thumbs on the Plug & Charge walkway.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UtilityLink({
  headline,
  subtitle,
  href,
  cta,
}: {
  headline: string;
  subtitle: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.05]"
    >
      <p className="text-lg font-semibold tracking-tight">{headline}</p>
      <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
      <p className="text-primary mt-4 text-base font-semibold">{cta}</p>
    </Link>
  );
}
