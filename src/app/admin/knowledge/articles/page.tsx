import { Edit, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";

import { deleteArticleAction } from "@/actions/knowledge-admin";
import { AdminShell } from "@/components/admin/knowledge/AdminShell";
import { DeleteButton } from "@/components/admin/knowledge/DeleteButton";
import { StatusBadge } from "@/components/admin/knowledge/StatusBadge";
import { getAdminArticles, getCategories } from "@/lib/supabase/knowledge";

type PageProps = {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
};

export default async function ArticlesPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [articles, categories] = await Promise.all([getAdminArticles(), getCategories()]);
  const filtered = articles.filter((article) => {
    const q = filters.q?.toLowerCase().trim();
    return (
      (!filters.status || article.status === filters.status) &&
      (!filters.category || article.category_id === filters.category) &&
      (!q || [article.title, article.slug, article.summary ?? ""].join(" ").toLowerCase().includes(q))
    );
  });

  return (
    <AdminShell title="Статьи" description="Создавайте, редактируйте, публикуйте и архивируйте материалы базы знаний.">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterForm categories={categories} filters={filters} />
        <Link href="/admin/knowledge/articles/new" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground md:w-auto">
          <Plus className="size-4" aria-hidden />
          Новая статья
        </Link>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((article) => (
          <article key={article.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-wrap font-heading text-lg font-bold leading-tight">{article.title}</h2>
                <p className="mt-1 break-all text-xs text-muted-foreground">{article.slug}</p>
              </div>
              <StatusBadge status={article.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Раздел
                </dt>
                <dd className="mt-1 text-foreground">{article.category?.title ?? "Без раздела"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Обновлено
                </dt>
                <dd className="mt-1 text-foreground">{article.updated_at.slice(0, 10)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/admin/knowledge/articles/${article.id}/preview`} className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold" aria-label="Предпросмотр статьи">
                <ExternalLink className="size-4" aria-hidden />
                Предпросмотр
              </Link>
              <Link href={`/admin/knowledge/articles/${article.id}`} className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold" aria-label="Редактировать статью">
                <Edit className="size-4" aria-hidden />
                Править
              </Link>
              <DeleteButton id={article.id} label={article.title} action={deleteArticleAction} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="p-3">Название</th>
              <th className="p-3">Раздел</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Обновлено</th>
              <th className="p-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((article) => (
              <tr key={article.id} className="border-b border-border/70 last:border-0">
                <td className="p-3">
                  <p className="font-semibold">{article.title}</p>
                  <p className="text-xs text-muted-foreground">{article.slug}</p>
                </td>
                <td className="p-3 text-muted-foreground">{article.category?.title ?? "Без раздела"}</td>
                <td className="p-3"><StatusBadge status={article.status} /></td>
                <td className="p-3 text-muted-foreground">{article.updated_at.slice(0, 10)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/knowledge/articles/${article.id}/preview`} className="grid size-8 place-items-center rounded-lg border border-border" aria-label="Предпросмотр статьи">
                        <ExternalLink className="size-4" aria-hidden />
                      </Link>
                    <Link href={`/admin/knowledge/articles/${article.id}`} className="grid size-8 place-items-center rounded-lg border border-border" aria-label="Редактировать статью">
                      <Edit className="size-4" aria-hidden />
                    </Link>
                    <DeleteButton id={article.id} label={article.title} action={deleteArticleAction} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          По этим фильтрам статей не найдено.
        </p>
      ) : null}
    </AdminShell>
  );
}

function FilterForm({
  categories,
  filters,
}: {
  categories: Awaited<ReturnType<typeof getCategories>>;
  filters: { status?: string; category?: string; q?: string };
}) {
  return (
    <form className="grid w-full gap-2 md:w-auto md:grid-cols-[10rem_12rem_16rem_auto]">
      <select name="status" defaultValue={filters.status ?? ""} className="min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
        <option value="">Все статусы</option>
        <option value="draft">Черновик</option>
        <option value="published">Опубликовано</option>
        <option value="archived">Архив</option>
      </select>
      <select name="category" defaultValue={filters.category ?? ""} className="min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
        <option value="">Все разделы</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.title}</option>
        ))}
      </select>
      <input name="q" defaultValue={filters.q ?? ""} placeholder="Поиск" className="min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
      <button className="min-h-10 rounded-lg border border-border px-4 text-sm font-semibold">Фильтр</button>
    </form>
  );
}
