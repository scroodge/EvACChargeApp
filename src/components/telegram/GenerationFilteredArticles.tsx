"use client";

import { useMemo } from "react";

import { ArticleCard } from "@/components/telegram/ArticleCard";
import { useTelegramGeneration } from "@/hooks/use-telegram-generation";
import { filterArticlesByGeneration } from "@/lib/telegram/generation";
import type { KnowledgeArticle } from "@/types/telegram";

type GenerationFilteredArticlesProps = {
  articles: KnowledgeArticle[];
  title?: string;
  emptyMessage?: string;
};

export function GenerationFilteredArticles({
  articles,
  title = "Статьи",
  emptyMessage = "Для выбранного поколения статей в этом разделе пока нет.",
}: GenerationFilteredArticlesProps) {
  const [generation] = useTelegramGeneration();
  const filtered = useMemo(
    () => filterArticlesByGeneration(articles, generation),
    [articles, generation],
  );

  if (!filtered.length) {
    return (
      <section className="space-y-3" aria-label={title}>
        <h2 className="font-heading text-xl font-bold">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="font-heading text-xl font-bold">{title}</h2>
      {filtered.map((article, index) => (
        <ArticleCard key={article.id} article={article} priorityImage={index === 0} />
      ))}
    </section>
  );
}
