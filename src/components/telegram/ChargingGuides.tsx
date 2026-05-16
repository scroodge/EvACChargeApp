"use client";

import { useMemo, useState } from "react";

import { ArticleCard } from "@/components/telegram/ArticleCard";
import { SearchBox } from "@/components/telegram/SearchBox";
import { chargingGuides } from "@/data/telegram/charging-guides";

export function ChargingGuides() {
  const [query, setQuery] = useState("");

  const articles = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return chargingGuides;

    return chargingGuides.filter((article) =>
      [
        article.title,
        article.summary,
        article.tags.join(" "),
        article.sections.map((section) => `${section.heading} ${section.body}`).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [query]);

  return (
    <section className="space-y-4" aria-labelledby="charging-guides-title">
      <SectionHeader
        eyebrow="Charging Guides"
        title="Everything about charging BYD YUAN UP"
        description="Home charging, public charging, battery habits, safety, cables, and troubleshooting."
        id="charging-guides-title"
      />
      <SearchBox value={query} onChange={setQuery} placeholder="Search charging guides" />
      <div className="space-y-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--voltflow-cyan)]">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-1 font-heading text-2xl font-bold">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export { SectionHeader };
