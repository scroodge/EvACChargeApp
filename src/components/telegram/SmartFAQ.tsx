"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryFilter } from "@/components/telegram/CategoryFilter";
import { SearchBox } from "@/components/telegram/SearchBox";
import { faqCategories } from "@/data/telegram/categories";
import { faqItems } from "@/data/telegram/faq";
import { cn } from "@/lib/utils";

type FaqCategory = (typeof faqCategories)[number];
type FaqFilter = "All" | FaqCategory;

export function SmartFAQ() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqFilter>("All");
  const [openQuestion, setOpenQuestion] = useState(faqItems[0]?.question ?? "");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return faqItems.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.tags.join(" ").toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <section className="space-y-4" aria-labelledby="telegram-faq-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--voltflow-cyan)]">
          Smart FAQ
        </p>
        <h2 id="telegram-faq-title" className="mt-1 font-heading text-2xl font-bold">
          Answers for everyday charging
        </h2>
      </div>

      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Search FAQ by topic, answer, or tag"
      />

      <CategoryFilter
        categories={faqCategories}
        activeCategory={category}
        onChange={setCategory}
      />

      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isOpen = openQuestion === item.question;

          return (
            <article key={item.question} className="voltflow-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenQuestion(isOpen ? "" : item.question)}
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
                aria-expanded={isOpen}
              >
                <span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--voltflow-green)]">
                    {item.category}
                  </span>
                  <span className="mt-1 block font-heading text-base font-bold leading-snug">
                    {item.question}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "mt-1 size-5 shrink-0 text-muted-foreground transition",
                    isOpen && "rotate-180 text-[var(--voltflow-cyan)]",
                  )}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div className="border-t border-border/80 px-4 pb-4 pt-3 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                  {item.relatedIds?.length ? (
                    <p className="mt-3 text-xs font-semibold text-[var(--voltflow-cyan)]">
                      Related: {item.relatedIds.join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className="voltflow-card p-4 text-sm leading-6 text-muted-foreground">
          No matching FAQ yet. Try a shorter search or another category.
        </div>
      ) : null}
    </section>
  );
}
