import { AlertTriangle, Lightbulb } from "lucide-react";

import type { AccessoryItem, KnowledgeArticle } from "@/data/telegram/categories";

type ArticleCardProps = {
  article: KnowledgeArticle;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="voltflow-card overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-col gap-2 p-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--voltflow-green)]">
            {article.category}
          </span>
          <span className="font-heading text-lg font-bold leading-snug">
            {article.title}
          </span>
          <span className="text-sm leading-6 text-muted-foreground">
            {article.summary}
          </span>
          <span className="text-xs font-semibold text-[var(--voltflow-cyan)]">
            Tap to read
          </span>
        </summary>

        <div className="space-y-4 border-t border-border/80 p-4">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="font-heading text-base font-bold">{section.heading}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}

          {article.tips?.length ? (
            <div className="space-y-2">
              {article.tips.map((tip) => (
                <div
                  key={tip}
                  className="flex gap-2 rounded-lg border border-[var(--voltflow-cyan)]/25 bg-[var(--voltflow-cyan)]/10 p-3 text-sm leading-6 text-cyan-50"
                >
                  <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          ) : null}

          {article.warnings?.length ? (
            <div className="space-y-2">
              {article.warnings.map((warning) => (
                <div
                  key={warning}
                  className="flex gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </details>
    </article>
  );
}

export function AccessoryCard({ item }: { item: AccessoryItem }) {
  return (
    <article className="voltflow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--voltflow-green)]">
            {item.category}
          </p>
          <h3 className="mt-1 font-heading text-lg font-bold">{item.title}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-white/[0.04] px-3 py-1 text-xs font-bold text-[var(--voltflow-cyan)]">
          {item.priority}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {item.useCase}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{item.whyUseful}</p>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Check before buying
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {item.whatToCheckBeforeBuying.map((check) => (
            <span
              key={check}
              className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground"
            >
              {check}
            </span>
          ))}
        </div>
      </div>
      {item.riskNotes?.length ? (
        <div className="mt-4 space-y-2">
          {item.riskNotes.map((note) => (
            <div
              key={note}
              className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100"
            >
              {note}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
