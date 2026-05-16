"use client";

import {
  BatteryCharging,
  Calculator,
  CarFront,
  HelpCircle,
  Search,
  Settings,
  ShoppingBag,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import { chargingGuides } from "@/data/telegram/charging-guides";
import { searchTelegramKnowledge } from "@/lib/telegram/search";
import type { TelegramTab } from "@/components/telegram/BottomTabs";
import { SearchBox } from "@/components/telegram/SearchBox";

type KnowledgeHomeProps = {
  isTelegram: boolean;
  onNavigate: (tab: TelegramTab) => void;
};

const quickCards = [
  { label: "Charging", tab: "guides", icon: BatteryCharging },
  { label: "Ownership", tab: "guides", icon: CarFront },
  { label: "Maintenance", tab: "guides", icon: Wrench },
  { label: "Accessories", tab: "more", icon: ShoppingBag },
  { label: "Calculators", tab: "tools", icon: Calculator },
  { label: "FAQ", tab: "faq", icon: HelpCircle },
] satisfies Array<{
  label: string;
  tab: TelegramTab;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}>;

export function KnowledgeHome({ isTelegram, onNavigate }: KnowledgeHomeProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchTelegramKnowledge(query, 6), [query]);
  const popularArticles = chargingGuides.slice(0, 4);

  return (
    <section className="space-y-5" aria-labelledby="knowledge-home-title">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--voltflow-cyan)]">
              VoltFlow
            </p>
            <h1 id="knowledge-home-title" className="mt-1 font-heading text-3xl font-bold leading-tight">
              BYD YUAN UP Knowledge Base
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[var(--voltflow-cyan)]">
            {isTelegram ? "Telegram Mini App" : "Web Mode"}
          </span>
        </div>
        <p className="text-base leading-7 text-muted-foreground">
          Charging, maintenance, accessories and real owner experience
        </p>
      </div>

      <SearchBox value={query} onChange={setQuery} />

      {query.trim() ? (
        <div className="space-y-2">
          {results.length ? (
            results.map((result) => (
              <article key={`${result.type}-${result.id}`} className="voltflow-card p-4">
                <div className="flex gap-3">
                  <Search className="mt-1 size-4 shrink-0 text-[var(--voltflow-green)]" aria-hidden />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--voltflow-cyan)]">
                      {result.type} · {result.category}
                    </p>
                    <h2 className="mt-1 font-heading text-base font-bold">
                      {result.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {result.summary}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="voltflow-card p-4 text-sm text-muted-foreground">
              No local result yet. Try another term.
            </div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {quickCards.map(({ label, tab, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(tab)}
            className="voltflow-card flex min-h-24 flex-col items-start justify-between p-4 text-left transition hover:border-[var(--voltflow-cyan)]/60"
          >
            <Icon className="size-6 text-[var(--voltflow-green)]" aria-hidden />
            <span className="font-heading text-base font-bold">{label}</span>
          </button>
        ))}
      </div>

      <section className="space-y-3" aria-labelledby="popular-title">
        <div className="flex items-center gap-2">
          <Settings className="size-4 text-[var(--voltflow-cyan)]" aria-hidden />
          <h2 id="popular-title" className="font-heading text-xl font-bold">
            Popular articles
          </h2>
        </div>
        {popularArticles.map((article) => (
          <article key={article.id} className="voltflow-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--voltflow-green)]">
              {article.category}
            </p>
            <h3 className="mt-1 font-heading text-base font-bold">{article.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {article.summary}
            </p>
          </article>
        ))}
      </section>

      <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
        Phase 1 knowledge base is manually curated. Community import and AI search
        will be added later.
      </div>
    </section>
  );
}
