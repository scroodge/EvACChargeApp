import { Edit, Plus } from "lucide-react";
import Link from "next/link";

import { deleteSparePartAction } from "@/actions/knowledge-admin";
import { AdminShell } from "@/components/admin/knowledge/AdminShell";
import { DeleteButton } from "@/components/admin/knowledge/DeleteButton";
import { StatusBadge } from "@/components/admin/knowledge/StatusBadge";
import { getAdminSpareParts } from "@/lib/supabase/knowledge";

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function SparePartsPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const items = await getAdminSpareParts();
  const filtered = items.filter((item) => {
    const q = filters.q?.toLowerCase().trim();
    return (
      (!filters.status || item.status === filters.status) &&
      (!q || [item.title, item.description ?? "", item.part_number ?? ""].join(" ").toLowerCase().includes(q))
    );
  });

  return (
    <AdminShell title="Запчасти">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form className="grid gap-2 md:grid-cols-[10rem_16rem_auto]">
          <select name="status" defaultValue={filters.status ?? ""} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Все статусы</option>
            <option value="draft">Черновик</option>
            <option value="published">Опубликовано</option>
            <option value="archived">Архив</option>
          </select>
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Поиск" className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" />
          <button className="min-h-10 rounded-lg border border-border px-4 text-sm font-semibold">Фильтр</button>
        </form>
        <Link href="/admin/knowledge/spare-parts/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
          <Plus className="size-4" aria-hidden />
          Новая запчасть
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((item) => (
          <article key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.part_number ? (
                    <span className="text-xs text-muted-foreground">{item.part_number}</span>
                  ) : null}
                </div>
                <h2 className="mt-2 font-heading text-lg font-bold">{item.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/knowledge/spare-parts/${item.id}`} className="grid size-8 place-items-center rounded-lg border border-border" aria-label="Редактировать запчасть">
                  <Edit className="size-4" aria-hidden />
                </Link>
                <DeleteButton id={item.id} label={item.title} action={deleteSparePartAction} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
