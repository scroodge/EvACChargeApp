"use client";

import { Loader2, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type KnowledgeSearchResult = {
  id: string;
  title: string;
  content: string;
  category: string;
  source_type: string;
  source_url: string | null;
  telegram_message_id: string | null;
  tags: string[];
  similarity: number;
};

const categories = [
  { value: "", label: "Все разделы" },
  { value: "charging", label: "Зарядка" },
  { value: "accessories", label: "Аксессуары" },
  { value: "ownership", label: "Эксплуатация" },
  { value: "maintenance", label: "Обслуживание" },
  { value: "battery", label: "Батарея" },
  { value: "winter", label: "Зима" },
  { value: "faq", label: "FAQ" },
];

export default function KnowledgeSearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSearch = query.trim().length >= 2 && !isLoading;
  const helperText = useMemo(() => {
    if (error) return null;
    if (!hasSearched) return "Введите вопрос или ключевую фразу.";
    if (!results.length && !isLoading) {
      return "Ничего не найдено. Попробуйте переформулировать вопрос.";
    }
    return null;
  }, [error, hasSearched, isLoading, results.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = query.trim();

    if (text.length < 2) {
      setHasSearched(false);
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const response = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          category: category || undefined,
          limit: 8,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Search failed.");
      }

      setResults(Array.isArray(payload.results) ? payload.results : []);
    } catch {
      setError("Не удалось выполнить поиск. Попробуйте позже.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mobile-page min-h-dvh px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
        <header className="mb-5 flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-[var(--voltflow-green)]/35 bg-[var(--voltflow-green)]/10 text-[var(--voltflow-green)]">
            <Sparkles className="size-6" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--voltflow-cyan)]">
              VoltFlow
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold leading-tight">
              Поиск по базе знаний BYD YUAN UP
            </h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="sr-only">Поисковый запрос</span>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              rows={4}
              className="min-h-28 w-full resize-none rounded-lg border border-border bg-white/[0.04] px-4 py-3 text-base leading-6 outline-none transition placeholder:text-muted-foreground focus:border-[var(--voltflow-green)]/70"
              placeholder="Например: как заряжать зимой, какие коврики купить, что делать если медленно заряжается"
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.035] px-3 py-2">
            <SlidersHorizontal className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="sr-only">Раздел</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 flex-1 bg-transparent text-sm font-semibold outline-none"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={!canSearch}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--voltflow-green)] px-4 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <Search className="size-5" aria-hidden />
            )}
            Найти
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        {helperText ? (
          <p className="mt-6 text-sm leading-6 text-muted-foreground">{helperText}</p>
        ) : null}

        <section className="mt-5 space-y-3" aria-label="Результаты поиска">
          {results.map((result) => (
            <article key={result.id} className="voltflow-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--voltflow-cyan)]">
                    {categoryLabel(result.category)}
                  </p>
                  <h2 className="mt-1 text-lg font-bold leading-snug">{result.title}</h2>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--voltflow-green)]/40 bg-[var(--voltflow-green)]/10 px-2.5 py-1 text-xs font-bold text-[var(--voltflow-green)]">
                  {Math.round(result.similarity * 100)}%
                </span>
              </div>

              <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                {result.content}
              </p>

              {result.tags.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function categoryLabel(category: string) {
  return categories.find((item) => item.value === category)?.label ?? category;
}
