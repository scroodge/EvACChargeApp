export type KnowledgeArticle = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  sections: {
    heading: string;
    body: string;
  }[];
  tips?: string[];
  warnings?: string[];
  relatedIds?: string[];
};

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  relatedIds?: string[];
};

export type AccessoryPriority = "must-have" | "useful" | "optional";

export type AccessoryItem = {
  id: string;
  title: string;
  category: string;
  useCase: string;
  whyUseful: string;
  whatToCheckBeforeBuying: string[];
  priority: AccessoryPriority;
  riskNotes?: string[];
  searchKeywords: string[];
  externalUrl?: string;
};

export const guideCategories = [
  "Charging",
  "Ownership",
  "Maintenance",
  "Accessories",
] as const;

export const faqCategories = [
  "Charging",
  "Battery",
  "Winter",
  "Maintenance",
  "Accessories",
  "Ownership",
  "Safety",
  "Costs",
  "BYD Yuan Up",
] as const;

export const accessoryCategories = [
  "charging accessories",
  "interior accessories",
  "trunk/storage",
  "protection",
  "winter accessories",
  "cleaning",
  "electronics",
  "emergency kit",
  "child/family accessories",
] as const;
