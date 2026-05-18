import { notFound } from "next/navigation";

import { updateSparePartAction } from "@/actions/knowledge-admin";
import { AdminShell } from "@/components/admin/knowledge/AdminShell";
import { SparePartForm } from "@/components/admin/knowledge/SparePartForm";
import { getAdminSparePart, getCategories } from "@/lib/supabase/knowledge";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSparePartPage({ params }: PageProps) {
  const { id } = await params;
  const [item, categories] = await Promise.all([getAdminSparePart(id), getCategories()]);
  if (!item) notFound();

  return (
    <AdminShell title="Редактировать запчасть">
      <SparePartForm item={item} categories={categories} action={updateSparePartAction.bind(null, id)} />
    </AdminShell>
  );
}
