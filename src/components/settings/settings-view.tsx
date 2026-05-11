"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { deleteCar } from "@/actions/cars";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCarsQuery } from "@/hooks/use-cars-query";
import { useAppPreferences } from "@/stores/use-app-preferences";
import type { Car } from "@/types/database";

export function SettingsView() {
  const router = useRouter();
  const { data: cars, isLoading } = useCarsQuery();
  const [email, setEmail] = useState<string | null>(null);
  const defaultPricePerKwh = useAppPreferences((s) => s.defaultPricePerKwh);
  const setDefaultPrice = useAppPreferences((s) => s.setDefaultPricePerKwh);
  const [priceDraft, setPriceDraft] = useState(String(defaultPricePerKwh));
  useEffect(() => {
    let mounted = true;
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (mounted) setEmail(data.user?.email ?? null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPriceDraft(String(defaultPricePerKwh));
  }, [defaultPricePerKwh]);

  const handlePriceSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numeric = Number(priceDraft);
    if (!Number.isFinite(numeric) || numeric < 0) {
      toast.error("Tariff needs to stay positive.");
      return;
    }
    setDefaultPrice(numeric);
    toast.success("Default tariff synced locally");
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out cleanly.");
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em]">
          Settings
        </p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight">
          Drive profile
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
          Local defaults pair with encrypted Supabase auth — realtime sessions always respect your tariff field.
        </p>
      </div>

      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed">
          <div>
            <p className="text-muted-foreground text-sm uppercase tracking-[0.3em]">
              Email · Supabase JWT
            </p>
            {email === null ? (
              <Skeleton className="mt-4 h-[22px] w-2/5 rounded-xl" />
            ) : (
              <p className="mt-4 text-lg">{email ?? "Unavailable"}</p>
            )}
          </div>

          <Button
            className="h-[54px] w-full rounded-full text-base font-semibold"
            variant="outline"
            type="button"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Economics defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <form className="space-y-4" onSubmit={handlePriceSave}>
            <Label htmlFor="pref-price">Electricity tariff (€/kWh)</Label>
            <Input
              id="pref-price"
              type="number"
              step="0.01"
              value={priceDraft}
              inputMode="decimal"
              min={0}
              onChange={(e) => setPriceDraft(e.target.value)}
              className="h-[54px] rounded-2xl text-lg"
              required
            />
            <p className="text-muted-foreground text-sm">
              Saved on-device · used as the initial value on the cockpit dialog.
            </p>
            <Button className="h-[52px] w-full rounded-full text-base font-semibold" type="submit">
              Store default
            </Button>
          </form>
          <Separator className="my-16 bg-white/15" />

          <div className="space-y-8">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.38em] text-muted-foreground">
                  Fleet housekeeping
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Removing a saved EV only touches your garage inventory — histories remain readable.
                </p>
              </div>
              <Button asChild variant="secondary" size="lg" className="h-[54px] rounded-full">
                <Link href="/cars/new">Add EV</Link>
              </Button>
            </div>
            <div className="space-y-5">
              {isLoading &&
                Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-[120px] w-full rounded-3xl" />
                ))}
              {!isLoading &&
                cars?.map((car) => (
                  <CarRow key={car.id} car={car} />
                ))}
              {!isLoading && !(cars ?? []).length ? (
                <p className="text-muted-foreground text-base leading-relaxed">
                  No rides yet · add one anytime.
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <PrivacyNote />
    </div>
  );
}

function CarRow({ car }: { car: Car }) {
  const handleDelete = async () => {
    if (!confirm(`Remove ${car.name}?`)) return;
    const res = await deleteCar(car.id);
    if (!res.ok) {
      toast.error(
        typeof res.error === "string" ? res.error : "Something went sideways",
      );
      return;
    }
    toast.success(`${car.name} removed`);
  };

  return (
    <div className="border-white/[0.08] flex flex-wrap items-start justify-between gap-6 rounded-3xl border bg-white/[0.02] px-6 py-6">
      <div>
        <p className="text-lg font-semibold tracking-tight">{car.name}</p>
        <p className="text-muted-foreground text-base">{car.battery_capacity_kwh} kWh · {car.default_charger_power_kw} kW pedestal</p>
      </div>
      <Button
        variant="ghost"
        size="lg"
        className="rounded-full px-11 text-[15px]"
        type="button"
        onClick={() => void handleDelete()}
      >
        Remove
      </Button>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="text-muted-foreground border-white/[0.08] mx-auto rounded-3xl border bg-white/[0.02] px-8 py-16 text-lg leading-relaxed">
      Pulse never talks to chargers directly — timers are deterministic modeling for trip planning · always confirm hardware states on the pedestal.
      <Separator className="my-14 bg-transparent" />
      <p className="text-muted-foreground/80 text-[13px] uppercase tracking-[0.45em]">
        Telemetry privacy
      </p>
      <ul className="mt-14 list-none space-y-8 text-muted-foreground/90 tracking-tight">
        <li>Rls policies enforced with auth.uid()</li>
        <li>Anon JWT only accesses your rows · service role absent on device</li>
        <li>Realtime publication limited to charging_sessions inserts/updates · no cross-driver leakage</li>
      </ul>
    </div>
  );
}
