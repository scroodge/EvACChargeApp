import Link from "next/link";

import type { SearchResult } from "@/lib/telegram/search";

type SearchResultsProps = {
  query: string;
  results: SearchResult[];
};

const labels = {
  article: "Статьи",
  faq: "Вопросы",
  accessory: "Аксессуары",
} as const;

export function SearchResults({ query, results }: SearchResultsProps) {
  if (!query.trim()) {
    return (
      <div className="voltflow-card p-4 text-sm leading-6 text-muted-foreground">
        Ищите по зарядке, обслуживанию, опыту владельца, аксессуарам и вопросам.
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="voltflow-card p-4 text-sm leading-6 text-muted-foreground">
        Нет результатов для «{query}». Попробуйте более короткий запрос или другой раздел.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(["article", "faq", "accessory"] as const).map((type) => {
        const group = results.filter((result) => result.type === type);
        if (group.length === 0) return null;

        return (
          <section key={type} className="space-y-2" aria-label={labels[type]}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--voltflow-cyan)]">
              {labels[type]}
            </p>
            {group.map((result) => {
              const content = (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--voltflow-green)]">
                    {result.category}
                  </p>
                  <h3 className="mt-1 font-heading text-base font-bold">
                    {result.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {result.summary}
                  </p>
                </>
              );

              return result.href ? (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  className="voltflow-card block p-4 transition hover:border-[var(--voltflow-cyan)]/60 focus-visible:ring-3 focus-visible:ring-[var(--voltflow-cyan)]/30"
                >
                  {content}
                </Link>
              ) : (
                <article key={`${result.type}-${result.id}`} className="voltflow-card p-4">
                  {content}
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
