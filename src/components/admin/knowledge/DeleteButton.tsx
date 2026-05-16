"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  id,
  label,
  action,
}: {
  id: string;
  label: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Удалить «${label}»? Это действие нельзя отменить.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-2 text-xs font-semibold text-destructive transition hover:bg-destructive/20"
      >
        <Trash2 className="size-3.5" aria-hidden />
        Удалить
      </button>
    </form>
  );
}
