import { Edit, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateArticleStatusAction } from "@/actions/knowledge-admin";
import { StatusBadge } from "@/components/admin/knowledge/StatusBadge";
import { ArticleRenderer } from "@/components/telegram/ArticleRenderer";
import { getAdminArticle, getAdminArticles, toTelegramArticle } from "@/lib/supabase/knowledge";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Предпросмотр статьи",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ArticlePreviewPage({ params }: PageProps) {
  const { id } = await params;
  const [article, articles] = await Promise.all([
    getAdminArticle(id),
    getAdminArticles(),
  ]);

  if (!article) notFound();

  const articleById = new Map(articles.map((item) => [item.id, toTelegramArticle(item)]));
  const previewArticle = toTelegramArticle(article);
  const relatedArticles = (article.related_article_ids ?? [])
    .map((relatedId) => articleById.get(relatedId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const updateStatus = updateArticleStatusAction.bind(null, article.id);

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-8%,rgba(0,209,255,0.24),transparent_26rem),radial-gradient(circle_at_8%_18%,rgba(0,230,118,0.14),transparent_20rem),linear-gradient(180deg,rgba(18,21,28,0)_0%,#12151C_78%)]" />
      <div className="mobile-page relative min-h-dvh px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
        <section className="mb-4 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--voltflow-cyan)]">
                Предпросмотр
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={article.status} />
                <span className="text-xs text-muted-foreground">
                  Видно только администраторам
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={updateStatus} className="flex flex-wrap gap-2">
                <select
                  name="status"
                  defaultValue={article.status}
                  className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                  aria-label="Статус статьи"
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликовано</option>
                  <option value="archived">Архив</option>
                </select>
                <button className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold">
                  Обновить
                </button>
                {article.status === "draft" ? (
                  <button
                    name="status"
                    value="published"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
                  >
                    <Send className="size-4" aria-hidden />
                    Опубликовать
                  </button>
                ) : null}
              </form>
              <Link
                href={`/admin/knowledge/articles/${article.id}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold"
              >
                <Edit className="size-4" aria-hidden />
                Редактировать
              </Link>
            </div>
          </div>
        </section>
        <ArticleRenderer
          article={previewArticle}
          relatedArticles={relatedArticles}
        />
      </div>
    </main>
  );
}
