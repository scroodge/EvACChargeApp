"use client";

import { BatteryMedium, Clock, Coins, PlugZap } from "lucide-react";
import { useMemo, useState } from "react";

import {
  calculateCharging,
  defaultChargingCalculatorInput,
  formatChargingTime,
  type ChargingCalculatorInput,
} from "@/lib/telegram/calculator";

const fields = [
  {
    key: "batteryCapacity",
    label: "Battery capacity",
    suffix: "kWh",
    step: "1",
  },
  {
    key: "currentPercent",
    label: "Current battery",
    suffix: "%",
    step: "1",
  },
  {
    key: "targetPercent",
    label: "Target battery",
    suffix: "%",
    step: "1",
  },
  {
    key: "chargingPower",
    label: "Charging power",
    suffix: "kW",
    step: "0.1",
  },
  {
    key: "electricityPrice",
    label: "Electricity price",
    suffix: "/ kWh",
    step: "0.01",
  },
  {
    key: "efficiency",
    label: "Charging efficiency",
    suffix: "%",
    step: "1",
  },
] satisfies Array<{
  key: keyof ChargingCalculatorInput;
  label: string;
  suffix: string;
  step: string;
}>;

export function ChargingCalculator() {
  const [input, setInput] = useState<ChargingCalculatorInput>(
    defaultChargingCalculatorInput,
  );
  const result = useMemo(() => calculateCharging(input), [input]);

  function updateField(key: keyof ChargingCalculatorInput, value: string) {
    setInput((current) => ({
      ...current,
      [key]: Number(value),
    }));
  }

  return (
    <section className="space-y-4" aria-labelledby="telegram-calculator-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--voltflow-cyan)]">
          Calculator
        </p>
        <h2
          id="telegram-calculator-title"
          className="mt-1 font-heading text-2xl font-bold"
        >
          Estimate time, energy, and cost
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="voltflow-card block p-4">
            <span className="text-sm font-semibold text-muted-foreground">
              {field.label}
            </span>
            <span className="mt-2 flex items-center rounded-lg border border-border bg-white/[0.04] px-3 focus-within:border-[var(--voltflow-cyan)] focus-within:ring-3 focus-within:ring-[var(--voltflow-cyan)]/20">
              <input
                type="number"
                inputMode="decimal"
                value={Number.isNaN(input[field.key]) ? "" : input[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                step={field.step}
                className="h-12 min-w-0 flex-1 bg-transparent text-base font-bold text-foreground outline-none"
              />
              <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                {field.suffix}
              </span>
            </span>
          </label>
        ))}
      </div>

      {result.errors.length > 0 ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          {result.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <ResultCard
          icon={BatteryMedium}
          label="Energy needed"
          value={`${result.energyNeeded.toFixed(1)} kWh`}
        />
        <ResultCard
          icon={PlugZap}
          label="Grid energy"
          value={`${result.gridEnergy.toFixed(1)} kWh`}
        />
        <ResultCard
          icon={Clock}
          label="Estimated time"
          value={formatChargingTime(result.timeHours)}
        />
        <ResultCard
          icon={Coins}
          label="Estimated cost"
          value={result.cost.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          })}
        />
      </div>

      <div className="rounded-lg border border-[var(--voltflow-green)]/25 bg-[var(--voltflow-green)]/10 p-4 text-sm leading-6 text-emerald-100">
        {result.recommendation}
      </div>
    </section>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <article className="voltflow-card p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg border border-border bg-white/[0.04] text-[var(--voltflow-green)]">
          <Icon className="size-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-heading text-xl font-bold">{value}</p>
        </div>
      </div>
    </article>
  );
}
