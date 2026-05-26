"use client";

import { format } from "date-fns";
import { be, ru } from "date-fns/locale";

import Link from "next/link";

import { BrandBadge } from "@/components/brand/BrandBadge";
import { LogoFull } from "@/components/brand/LogoFull";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { deriveChargingState, formatDuration, type ChargingParams } from "@/lib/charging-math";
import { formatCurrencyAmount } from "@/lib/i18n";
import { useTickingClock } from "@/hooks/use-ticking-clock";
import { useSessionsQuery } from "@/hooks/use-sessions-query";
import { useTranslation } from "@/hooks/use-translation";
import { useAppPreferences } from "@/stores/use-app-preferences";
import type { ChargingSessionRow } from "@/types/database";

export function HistoryView() {
  const { data, isLoading } = useSessionsQuery();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="safe-bottom flex flex-col gap-4 px-4 pb-6 pt-5">
        <header className="flex items-center justify-between gap-4">
          <LogoFull />
          <BrandBadge className="hidden min-[380px]:inline-flex">Session log</BrandBadge>
        </header>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-[1.75rem]" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <EmptyState />
    );
  }

  const finishedFirst = [...data].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  return (
    <div className="safe-bottom flex flex-col gap-4 px-4 pb-4 pt-4">
      <header className="flex items-center justify-between gap-4">
        <LogoFull />
        <BrandBadge className="hidden min-[380px]:inline-flex">Session log</BrandBadge>
      </header>

      <section className="voltflow-card p-4">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.28em]">
          {t("history.eyebrow")}
        </p>
        <h1 className="mt-1.5 font-heading text-2xl font-bold tracking-normal">{t("history.title")}</h1>
        <p className="text-muted-foreground mt-1.5 max-w-xl text-sm leading-5">
          {t("history.subtitle")}
        </p>
      </section>

      <div className="flex flex-col gap-3">
        {finishedFirst.map((session) => (
          <HistoryCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}

function HistoryCard({ session }: { session: ChargingSessionRow }) {
  const nowMs = useTickingClock(session.status === "charging");
  const { locale, t } = useTranslation();
  const currency = useAppPreferences((s) => s.currency);
  const started = session.started_at ? new Date(session.started_at) : null;
  const ended = session.stopped_at ? new Date(session.stopped_at) : null;

  const params: ChargingParams = {
    startPercent: session.start_percent,
    targetPercent: session.target_percent,
    batteryCapacityKwh: session.battery_capacity_kwh,
    chargerPowerKw: session.charger_power_kw,
    efficiencyPercent: session.efficiency_percent,
    pricePerKwh: session.price_per_kwh,
  };

  const derived =
    session.status === "charging" && session.started_at
      ? deriveChargingState(params, Date.parse(session.started_at), nowMs)
      : null;

  const pct =
    derived?.currentPercent.toFixed(1) ?? session.current_percent.toFixed(1);
  const elapsed =
    derived && session.status === "charging"
      ? formatDuration(derived.elapsedSeconds)
      : ended && started
        ? formatDuration((ended.getTime() - started.getTime()) / 1000)
        : "—";

  const statusTone =
    session.status === "completed"
      ? "text-teal-200"
      : session.status === "stopped"
        ? "text-yellow-300"
      : session.status === "charging"
        ? "text-primary"
      : "text-muted-foreground";
  const dateLocale = locale === "be" ? be : locale === "ru" ? ru : undefined;
  const statusLabel =
    session.status === "completed"
      ? t("history.status.completed")
      : session.status === "stopped"
        ? t("history.status.stopped")
        : session.status === "charging"
          ? t("history.status.charging")
          : session.status;

  return (
    <Card className="voltflow-card border-border bg-transparent">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.32em]">
              {started
                ? format(started, "EEEE · HH:mm · MMM d", {
                    locale: dateLocale,
                  })
                : t("history.queued")}
            </p>
            <p className="mt-3 font-heading text-3xl font-bold tracking-tight tabular-nums">
              {pct}
              %
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border border-border bg-white/[0.04] px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] ${statusTone}`}
          >
            {statusLabel}
          </span>
        </div>
        <dl className="divide-y divide-border rounded-2xl border border-border bg-white/[0.02] px-4 text-base">
          <Row label={t("history.target") as string} value={`${session.target_percent}%`} />
          <Row
            label={t("history.energy") as string}
            value={`${(derived?.chargedEnergyKwh ?? session.charged_energy_kwh).toFixed(
              2,
            )} kWh`}
          />
          <Row
            label={t("history.cost") as string}
            value={
              session.price_per_kwh > 0
                ? formatCurrencyAmount(
                    currency,
                    derived?.estimatedCost ?? session.estimated_cost,
                    locale,
                  )
                : "—"
            }
          />
          <Row label={t("history.duration") as string} value={elapsed} />
        </dl>

        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button asChild size="lg" className="h-12 rounded-full font-heading font-semibold">
            <Link href={`/history/${session.id}`}>{t("history.detail")}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full border-border bg-white/[0.03] font-heading font-semibold"
          >
            <Link href="/dashboard">{t("history.startAnother")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-heading text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="safe-bottom flex flex-1 flex-col gap-5 px-4 pb-6 pt-5">
      <header className="flex items-center justify-between gap-4">
        <LogoFull />
        <BrandBadge className="hidden min-[380px]:inline-flex">Session log</BrandBadge>
      </header>
      <section className="voltflow-card flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.28em]">
          {t("history.emptyEyebrow")}
        </p>
        <h1 className="text-balance font-heading text-3xl font-bold tracking-normal">
          {t("history.emptyTitle")}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-sm leading-6">
          {t("history.emptyBody")}
        </p>
        <Button
          asChild
          size="lg"
          className="h-12 rounded-full bg-[linear-gradient(90deg,#00E676_0%,#00D1FF_100%)] px-8 font-heading font-semibold text-[#06110B]"
        >
          <Link href="/dashboard">{t("history.headCockpit")}</Link>
        </Button>
      </section>
    </div>
  );
}
