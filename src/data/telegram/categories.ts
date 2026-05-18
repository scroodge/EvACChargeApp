export type {
  AccessoryItem,
  AccessoryPriority,
  FAQItem,
  KnowledgeArticle,
} from "@/types/telegram";

export const guideCategories = [
  "Зарядка",
  "Эксплуатация",
  "Обслуживание",
] as const;

export const faqCategories = [
  "Зарядка",
  "Батарея",
  "Зима",
  "Обслуживание",
  "Аксессуары",
  "Эксплуатация",
  "Безопасность",
  "Расходы",
  "BYD Yuan Up",
] as const;

export const accessoryCategories = [
  "Аксессуары",
  "Салон",
  "Багажник",
  "Защита",
  "Зима",
  "Уход",
  "Электроника",
  "Безопасность",
  "Семья",
] as const;
