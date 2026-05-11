"use client";

import { ArrowRight, Gauge, ShieldCheck, Smartphone, Zap } from "lucide-react";
import Link from "next/link";

import { AppIcon } from "@/components/brand/AppIcon";
import { BrandBadge } from "@/components/brand/BrandBadge";
import { LogoFull } from "@/components/brand/LogoFull";
import { BatteryRing } from "@/components/charging/BatteryRing";
import { ChargingStatsGrid } from "@/components/charging/ChargingStatsGrid";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

const highlights = [
  {
    icon: Zap,
    title: "Realtime charge flow",
    body: "Battery percent, kWh, ETA, power and cost stay live from timestamp-based session math.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first PWA",
    body: "Large controls, safe-area navigation and a centered 430px app frame on desktop.",
  },
  {
    icon: ShieldCheck,
    title: "Full control",
    body: "Supabase auth keeps charging sessions scoped to your account while the cockpit stays quick.",
  },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(0,209,255,0.28),transparent_34rem),radial-gradient(circle_at_10%_20%,rgba(0,230,118,0.18),transparent_24rem),linear-gradient(180deg,rgba(18,21,28,0)_0%,#12151C_88%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px voltflow-gradient" />

      <div className="mobile-page relative">
        <section className="relative flex min-h-[calc(100dvh-4rem)] w-full flex-col px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <header className="flex items-center justify-between gap-3">
          <LogoFull />
          <LocaleSwitcher className="shrink-0" />
        </header>

        <div className="mt-10 space-y-5">
          <BrandBadge>Smart charging. Full control.</BrandBadge>
          <h1 className="font-heading text-6xl font-bold leading-[0.95] tracking-normal text-balance">
            VoltFlow
          </h1>
          <p className="voltflow-text-gradient font-heading text-2xl font-bold leading-tight tracking-normal">
            Energy in motion.
          </p>
          <p className="max-w-[21rem] text-lg leading-7 text-muted-foreground">
            Real-time EV charging tracker and calculator for confident starts,
            clean stops, live kWh and cost control.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            size="lg"
            className="h-14 flex-1 rounded-full bg-[linear-gradient(90deg,#00E676_0%,#00D1FF_100%)] font-heading text-base font-bold text-[#06110B] voltflow-glow"
            asChild
          >
            <Link href="/login">
              {t("landing.start")}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-full border-border bg-white/[0.03] px-5"
            asChild
          >
            <Link href="/dashboard" aria-label="Open dashboard">
              <Gauge className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="mt-8 voltflow-card overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Live cockpit
              </p>
              <p className="mt-1 font-heading text-xl font-bold">Model Y</p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--voltflow-green)]">
              Charging
            </span>
          </div>

          <BatteryRing
            percent={68}
            status="Charging"
            charging
            className="my-2 max-w-[230px]"
          />

          <ChargingStatsGrid
            stats={[
              { label: "Charged kWh", value: "24.8", accent: "green" },
              { label: "Remaining", value: "1h 22m", accent: "cyan" },
              { label: "Power", value: "11.0 kW", accent: "blue" },
              { label: "Cost", value: "€7.44" },
            ]}
          />
        </div>
        </section>

      <section
        id="highlights"
        className="relative grid w-full gap-3 px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)]"
      >
        <div className="mb-2 flex items-center gap-3">
          <AppIcon className="size-9 shrink-0" />
          <p className="font-heading text-xl font-bold">Built for charge control</p>
        </div>
        {highlights.map(({ icon: Icon, title, body }) => (
          <article key={title} className="voltflow-card p-4">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-white/[0.04] text-[var(--voltflow-cyan)]">
                <Icon className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>
      </div>
    </main>
  );
}
