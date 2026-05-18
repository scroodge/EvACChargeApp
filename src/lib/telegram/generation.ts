import {
  carGenerations,
  isCarGeneration,
  type CarGeneration,
} from "@/lib/car-generations";

export const TELEGRAM_GENERATION_STORAGE_KEY = "voltflow.telegram.generation";

export const telegramGenerationLabels: Record<CarGeneration, string> = {
  gen1_2024: "2024 · 1-е поколение",
  gen2_2025: "2025+ · 2-е поколение",
};

export function normalizeModelGenerations(
  value: CarGeneration[] | null | undefined,
): CarGeneration[] {
  if (!value?.length) return [...carGenerations];
  const normalized = value.filter(isCarGeneration);
  return normalized.length ? normalized : [...carGenerations];
}

export function articleMatchesGeneration(
  article: { modelGenerations?: CarGeneration[] | null },
  generation: CarGeneration,
): boolean {
  return normalizeModelGenerations(article.modelGenerations).includes(generation);
}

export function filterArticlesByGeneration<
  T extends { modelGenerations?: CarGeneration[] | null },
>(articles: T[], generation: CarGeneration): T[] {
  return articles.filter((article) => articleMatchesGeneration(article, generation));
}

export function readStoredTelegramGeneration(): CarGeneration | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(TELEGRAM_GENERATION_STORAGE_KEY);
  return isCarGeneration(stored) ? stored : null;
}

export function writeStoredTelegramGeneration(generation: CarGeneration) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TELEGRAM_GENERATION_STORAGE_KEY, generation);
}
