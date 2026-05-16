"use client";

import { BatteryMedium, Clock, Coins, PlugZap, RotateCcw } from "lucide-react";
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
    label: "Емкость батареи",
    suffix: "кВт⋅ч",
    step: "1",
  },
  {
    key: "currentPercent",
    label: "Текущий заряд",
    suffix: "%",
    step: "1",
  },
  {
    key: "targetPercent",
    label: "Целевой заряд",
    suffix: "%",
    step: "1",
  },
  {
    key: "chargingPower",
    label: "Мощность зарядки",
    suffix: "кВт",
    step: "0.1",
  },
  {
    key: "electricityPrice",
    label: "Цена электричества",
    suffix: "/ кВт⋅ч",
    step: "0.01",
  },
  {
    key: "efficiency",
    label: "Эффективность зарядки",
    suffix: "%",
    step: "1",
  },
] satisfies Array<{
  key: keyof ChargingCalculatorInput;
  label: string;
  suffix: string;
  step: string;
}>;

const chargingPowerPresets = [
  { label: "Бытовая розетка", value: 2.2 },
  { label: "Wallbox", value: 7 },
  { label: "Публичная AC", value: 11 },
  { label: "Быстрая DC", value: 50 },
];

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

  function setChargingPower(chargingPower: number) {
    setInput((current) => ({ ...current, chargingPower }));
  }

  return (
    <section className="space-y-4" aria-labelledby="telegram-calculator-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--voltflow-cyan)]">
          Калькулятор
        </p>
        <h2
          id="telegram-calculator-title"
          className="mt-1 font-heading text-2xl font-bold"
        >
          Оценка времени, энергии и стоимости
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Расчет одной зарядной сессии. Значения являются ориентировочными и
          не заменяют официальные характеристики BYD YUAN UP.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {chargingPowerPresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setChargingPower(preset.value)}
            className="min-h-10 rounded-full border border-border bg-white/[0.03] px-4 text-sm font-semibold text-muted-foreground transition hover:border-[var(--voltflow-cyan)] hover:text-foreground focus-visible:ring-3 focus-visible:ring-[var(--voltflow-cyan)]/30"
          >
            {preset.label}: {preset.value} kW
          </button>
        ))}
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
        <div
          className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100"
          role="status"
        >
          {result.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <ResultCard
          icon={BatteryMedium}
          label="Нужно в батарею"
          value={`${result.energyNeeded.toFixed(1)} кВт⋅ч`}
        />
        <ResultCard
          icon={PlugZap}
          label="Из сети"
          value={`${result.gridEnergy.toFixed(1)} кВт⋅ч`}
        />
        <ResultCard
          icon={Clock}
          label="Время"
          value={formatChargingTime(result.timeHours)}
        />
        <ResultCard
          icon={Coins}
          label="Стоимость"
          value={result.cost.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          })}
        />
      </div>

      <div className="rounded-lg border border-[var(--voltflow-green)]/25 bg-[var(--voltflow-green)]/10 p-4 text-sm leading-6 text-emerald-100">
        {result.recommendation}
      </div>

      <div className="voltflow-card p-4 text-sm leading-6 text-muted-foreground">
        <p className="font-semibold text-foreground">Допущения</p>
        <p>Эффективность: {input.efficiency}%</p>
        <p>Мощность зарядки: {input.chargingPower} кВт</p>
        <p>Цена электричества: {input.electricityPrice} за кВт⋅ч</p>
      </div>

      <button
        type="button"
        onClick={() => setInput(defaultChargingCalculatorInput)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-white/[0.04] px-4 text-sm font-semibold text-[var(--voltflow-cyan)] transition hover:bg-white/[0.07] focus-visible:ring-3 focus-visible:ring-[var(--voltflow-cyan)]/30"
      >
        <RotateCcw className="size-4" aria-hidden />
        Сбросить значения
      </button>
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
