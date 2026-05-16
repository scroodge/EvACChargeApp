import { accessories } from "@/data/telegram/accessories";
import { chargingGuides } from "@/data/telegram/charging-guides";
import { faqItems } from "@/data/telegram/faq";
import { maintenanceArticles } from "@/data/telegram/maintenance";
import { ownershipExperienceArticles } from "@/data/telegram/ownership-experience";

export type SearchResultType =
  | "faq"
  | "charging"
  | "ownership"
  | "maintenance"
  | "accessory";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  summary: string;
  category: string;
};

type SearchIndexItem = SearchResult & {
  haystack: string;
};

const articleIndex: SearchIndexItem[] = [
  ...chargingGuides.map((article) => ({
    id: article.id,
    type: "charging" as const,
    title: article.title,
    summary: article.summary,
    category: article.category,
    haystack: [
      article.title,
      article.summary,
      article.category,
      article.tags.join(" "),
      article.sections.map((section) => `${section.heading} ${section.body}`).join(" "),
      article.tips?.join(" "),
      article.warnings?.join(" "),
    ].join(" "),
  })),
  ...ownershipExperienceArticles.map((article) => ({
    id: article.id,
    type: "ownership" as const,
    title: article.title,
    summary: article.summary,
    category: article.category,
    haystack: [
      article.title,
      article.summary,
      article.category,
      article.tags.join(" "),
      article.sections.map((section) => `${section.heading} ${section.body}`).join(" "),
      article.tips?.join(" "),
      article.warnings?.join(" "),
    ].join(" "),
  })),
  ...maintenanceArticles.map((article) => ({
    id: article.id,
    type: "maintenance" as const,
    title: article.title,
    summary: article.summary,
    category: article.category,
    haystack: [
      article.title,
      article.summary,
      article.category,
      article.tags.join(" "),
      article.sections.map((section) => `${section.heading} ${section.body}`).join(" "),
      article.tips?.join(" "),
      article.warnings?.join(" "),
    ].join(" "),
  })),
];

const faqIndex: SearchIndexItem[] = faqItems.map((item) => ({
  id: item.id,
  type: "faq",
  title: item.question,
  summary: item.answer,
  category: item.category,
  haystack: [item.question, item.answer, item.category, item.tags.join(" ")].join(" "),
}));

const accessoryIndex: SearchIndexItem[] = accessories.map((item) => ({
  id: item.id,
  type: "accessory",
  title: item.title,
  summary: item.whyUseful,
  category: item.category,
  haystack: [
    item.title,
    item.category,
    item.useCase,
    item.whyUseful,
    item.whatToCheckBeforeBuying.join(" "),
    item.riskNotes?.join(" "),
    item.searchKeywords.join(" "),
    item.priority,
  ].join(" "),
}));

const index = [...articleIndex, ...faqIndex, ...accessoryIndex];

export function searchTelegramKnowledge(query: string, limit = 8): SearchResult[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return [];

  return index
    .map((item) => {
      const text = item.haystack.toLowerCase();
      const score = terms.reduce((total, term) => {
        if (item.title.toLowerCase().includes(term)) return total + 4;
        if (item.category.toLowerCase().includes(term)) return total + 2;
        if (text.includes(term)) return total + 1;
        return total;
      }, 0);

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map(({ item }) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      summary: item.summary,
      category: item.category,
    }));
}
