import { BatteryCharging, CarFront, Route, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { BrandBadge } from "@/components/brand/BrandBadge";
import { LogoFull } from "@/components/brand/LogoFull";
import { BatteryRing } from "@/components/charging/BatteryRing";
import { ChargingActionButton } from "@/components/charging/ChargingActionButton";
import { ChargingStatsGrid, type ChargingStat } from "@/components/charging/ChargingStatsGrid";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const stats: ChargingStat[] = [
  { label: "Charged kWh", value: "12.40", accent: "green" },
  { label: "Remaining", value: "1h 18m", accent: "cyan" },
  { label: "Power", value: "6.8 kW", accent: "blue" },
  { label: "Cost", value: "4.96 BYN" },
];

const summaryCards = [
  {
    href: "/dev/vehicle",
    icon: <Route className="size-5" aria-hidden />,
    label: "Latest trip",
    title: "18.7 km",
    body: "25 May, 08:12 - 08:41",
    meta: "74% -> 68% · 15.9 kWh/100",
  },
  {
    href: "/dev/charging",
    icon: <BatteryCharging className="size-5" aria-hidden />,
    label: "Latest charge",
    title: "42% -> 80%",
    body: "24 May, 23:08 - 02:16",
    meta: "22.1 kWh · 3h 08m",
  },
  {
    href: "/dev/vehicle",
    icon: <CarFront className="size-5" aria-hidden />,
    label: "Live vehicle",
    title: "68% SOC",
    body: "25 May, 09:06",
    meta: "0 km/h · -0.4 kW",
  },
];

export default function DevDashboardPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="safe-bottom mx-auto flex max-w-md flex-col gap-5 px-4 pb-8 pt-5">
      <header className="flex items-center justify-between gap-4">
        <LogoFull />
        <BrandBadge className="hidden min-[380px]:inline-flex">
          Dev preview
        </BrandBadge>
      </header>

      <section className="voltflow-card overflow-hidden p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Vehicle
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-normal">
              BYD Yuan Up
            </h1>
          </div>
          <div className="rounded-full border border-border bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--voltflow-green)]">
            Idle
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-border bg-white/[0.03] p-3">
            <p className="text-muted-foreground">Battery pack</p>
            <p className="mt-1 font-heading text-lg font-bold">45.1 kWh</p>
          </div>
          <div className="rounded-2xl border border-border bg-white/[0.03] p-3">
            <p className="text-muted-foreground">Charger power</p>
            <p className="mt-1 font-heading text-lg font-bold">7 kW</p>
          </div>
        </div>
      </section>

      <section className="voltflow-card p-5 text-center">
        <BatteryRing percent={68} status="Idle" />
        <p className="mx-auto mt-1 max-w-[18rem] text-sm leading-6 text-muted-foreground">
          Energy in motion. Set your target and let VoltFlow track the run.
        </p>
      </section>

      <ChargingStatsGrid stats={stats} />

      <section className="grid gap-3">
        {summaryCards.map((card) => (
          <DashboardSummaryCard key={card.label} {...card} />
        ))}
      </section>

      <div className="space-y-3">
        <ChargingActionButton
          status="idle"
          labels={{
            start: "Start charging",
            stop: "Stop charging",
            syncing: "Syncing",
          }}
        />
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-14 w-full rounded-full border-border bg-white/[0.03] font-heading text-base font-bold"
        >
          <Link href="/settings">
            <SlidersHorizontal className="size-5" aria-hidden />
            Adjust settings
          </Link>
        </Button>
      </div>

      <nav className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
        <Link className="rounded-full border border-border px-3 py-2" href="/dev/charging">
          Charging
        </Link>
        <Link className="rounded-full border border-border px-3 py-2" href="/dev/vehicle">
          Vehicle
        </Link>
        <Link className="rounded-full border border-border px-3 py-2" href="/dev/history">
          History
        </Link>
      </nav>
    </main>
  );
}

function DashboardSummaryCard({
  href,
  icon,
  label,
  title,
  body,
  meta,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-36 content-between rounded-2xl border border-border bg-white/[0.03] p-4 transition hover:border-primary/50 hover:bg-white/[0.05]"
    >
      <span className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-[var(--voltflow-cyan)]">{icon}</span>
      </span>
      <span className="mt-4 block">
        <span className="block font-heading text-xl font-bold tracking-normal text-foreground">
          {title}
        </span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">{body}</span>
      </span>
      <span className="mt-3 block truncate text-xs font-medium text-muted-foreground">
        {meta}
      </span>
    </Link>
  );
}
