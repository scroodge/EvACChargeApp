"use client";

import { Calculator } from "lucide-react";

import { ChargingCalculator } from "@/components/telegram/ChargingCalculator";
import { calculators } from "@/data/telegram/calculators";

export function Calculators() {
  return (
    <section className="space-y-4" aria-labelledby="tools-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--voltflow-cyan)]">
          Инструменты
        </p>
        <h2 id="tools-title" className="mt-1 font-heading text-2xl font-bold">
          Калькуляторы для EV
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Сейчас доступен калькулятор времени и стоимости зарядки. Остальные
          инструменты подготовлены для следующих фаз.
        </p>
      </div>

      <ChargingCalculator />

      <div className="space-y-3">
        {calculators
          .filter((item) => item.status === "next-phase")
          .map((item) => (
            <article key={item.id} className="voltflow-card p-4">
              <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-white/[0.04] text-[var(--voltflow-cyan)]">
                  <Calculator className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    В следующей фазе
                  </p>
                  <h3 className="mt-1 font-heading text-base font-bold">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
