import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbedding(input: string): Promise<number[]> {
  const text = input.trim();

  if (!text) {
    throw new Error("Cannot create embedding for empty text.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = response.data[0]?.embedding;

  if (!embedding || embedding.length !== 1536) {
    throw new Error("Invalid embedding returned from OpenAI.");
  }

  return embedding;
}

export function buildKnowledgeEmbeddingText(item: {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}) {
  return [
    `Название: ${item.title}`,
    `Категория: ${item.category ?? "faq"}`,
    item.tags?.length ? `Теги: ${item.tags.join(", ")}` : null,
    `Содержание: ${item.content}`,
  ]
    .filter(Boolean)
    .join("\n");
}
