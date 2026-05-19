import { Edit, Plus } from "lucide-react";
import Link from "next/link";

import { deleteFAQAction } from "@/actions/knowledge-admin";
import { AdminShell } from "@/components/admin/knowledge/AdminShell";
import { DeleteButton } from "@/components/admin/knowledge/DeleteButton";
import { StatusBadge } from "@/components/admin/knowledge/StatusBadge";
import { carGenerations, isCarGeneration } from "@/lib/car-generations";
import { getAdminFAQ, getCategories } from "@/lib/supabase/knowledge";
import { telegramGenerationLabels } from "@/lib/telegram/generation";

type PageProps = {
  searchParams: Promise<{ status?: string; category?: string; generation?: string; q?: string }>;
};

export default async function FAQPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [items, categories] = await Promise.all([getAdminFAQ(), getCategories()]);
  const generationFilter = isCarGeneration(filters.generation) ? filters.generation : null;
  const filtered = items.filter((item) => {
    const q = filters.q?.toLowerCase().trim();
    return (
      (!filters.status || item.status === filters.status) &&
      (!filters.category || item.category_id === filters.category) &&
      (!generationFilter || item.model_generations.includes(generationFilter)) &&
      (!q || [item.question, item.answer].join(" ").toLowerCase().includes(q))
    );
  });

  return (
    <AdminShell title="Вопросы">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterForm categories={categories} filters={filters} />
        <Link href="/admin/knowledge/faq/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
          <Plus className="size-4" aria-hidden />
          Новый вопрос
        </Link>
      </div>
      <div className="space-y-3">
        {filtered.map((item) => (
          <article key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-muted-foreground">{item.category?.title ?? "Без раздела"}</span>
                  {item.model_generations.map((generation) => (
                    <span key={generation} className="text-xs text-muted-foreground">
                      {telegramGenerationLabels[generation]}
                    </span>
                  ))}
                </div>
                <h2 className="mt-2 font-heading text-lg font-bold">{item.question}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/knowledge/faq/${item.id}`} className="grid size-8 place-items-center rounded-lg border border-border" aria-label="Редактировать вопрос">
                  <Edit className="size-4" aria-hidden />
                </Link>
                <DeleteButton id={item.id} label={item.question} action={deleteFAQAction} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

function FilterForm({
  categories,
  filters,
}: {
  categories: Awaited<ReturnType<typeof getCategories>>;
  filters: { status?: string; category?: string; generation?: string; q?: string };
}) {
  return (
    <form className="grid gap-2 md:grid-cols-[10rem_12rem_13rem_16rem_auto]">
      <select name="status" defaultValue={filters.status ?? ""} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm">
        <option value="">Все статусы</option>
        <option value="draft">Черновик</option>
        <option value="published">Опубликовано</option>
        <option value="archived">Архив</option>
      </select>
      <select name="category" defaultValue={filters.category ?? ""} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm">
        <option value="">Все разделы</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.title}</option>
        ))}
      </select>
      <select name="generation" defaultValue={filters.generation ?? ""} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm">
        <option value="">Все поколения</option>
        {carGenerations.map((generation) => (
          <option key={generation} value={generation}>{telegramGenerationLabels[generation]}</option>
        ))}
      </select>
      <input name="q" defaultValue={filters.q ?? ""} placeholder="Поиск" className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" />
      <button className="min-h-10 rounded-lg border border-border px-4 text-sm font-semibold">Фильтр</button>
    </form>
  );
}
