import { NextRequest, NextResponse } from "next/server";

import { buildKnowledgeEmbeddingText, createEmbedding } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/knowledge";

type KnowledgeItemForReindex = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[] | null;
};

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const force = body?.force === true;

    let query = supabaseAdmin
      .from("knowledge_items")
      .select("id,title,content,category,tags")
      .eq("is_published", true)
      .order("updated_at", { ascending: true });

    if (!force) {
      query = query.is("embedding", null);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    let count = 0;

    for (const item of (data ?? []) as KnowledgeItemForReindex[]) {
      const embeddingText = buildKnowledgeEmbeddingText({
        title: item.title,
        content: item.content,
        category: item.category,
        tags: item.tags ?? [],
      });
      const embedding = await createEmbedding(embeddingText);
      const { error: updateError } = await supabaseAdmin
        .from("knowledge_items")
        .update({ embedding })
        .eq("id", item.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      count += 1;
    }

    return NextResponse.json({ count, force });
  } catch (error) {
    console.error("Knowledge reindex error:", error);
    return NextResponse.json({ error: "Knowledge reindex failed." }, { status: 500 });
  }
}
