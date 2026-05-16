"use client";

import { useMemo, useState } from "react";

import { ArticleCard } from "@/components/telegram/ArticleCard";
import { SearchBox } from "@/components/telegram/SearchBox";
import { SectionHeader } from "@/components/telegram/ChargingGuides";
import { ownershipExperienceArticles } from "@/data/telegram/ownership-experience";

export function OwnershipExperience() {
  const [query, setQuery] = useState("");
  const articles = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return ownershipExperienceArticles;

    return ownershipExperienceArticles.filter((article) =>
      [article.title, article.summary, article.tags.join(" "), article.sections.map((section) => section.body).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [query]);

  return (
    <section className="space-y-4" aria-labelledby="ownership-title">
      <SectionHeader
        eyebrow="Ownership Experience"
        title="Structured real-owner knowledge"
        description="Subjective owner-style notes, habits, comfort impressions, trip planning, and beginner mistakes."
        id="ownership-title"
      />
      <SearchBox value={query} onChange={setQuery} placeholder="Search ownership notes" />
      <div className="space-y-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
