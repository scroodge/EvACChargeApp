import { createSparePartAction } from "@/actions/knowledge-admin";
import { AdminShell } from "@/components/admin/knowledge/AdminShell";
import { SparePartForm } from "@/components/admin/knowledge/SparePartForm";
import { getCategories } from "@/lib/supabase/knowledge";

export default async function NewSparePartPage() {
  const categories = await getCategories();

  return (
    <AdminShell title="Новая запчасть">
      <SparePartForm categories={categories} action={createSparePartAction} />
    </AdminShell>
  );
}
