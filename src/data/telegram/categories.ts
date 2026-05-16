export type {
  AccessoryItem,
  AccessoryPriority,
  FAQItem,
  KnowledgeArticle,
} from "@/types/telegram";

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
