"use client";

import { useActionState, useState } from "react";

import type { AdminFormState } from "@/actions/knowledge-admin";
import { FieldError, inputClass, Panel, textareaClass } from "@/components/admin/knowledge/ArticleForm";
import { stateKey, stateString } from "@/components/admin/knowledge/form-state";
import type { KnowledgeCategory } from "@/types/knowledge";

export function CategoryForm({
  category,
  action,
}: {
  category?: KnowledgeCategory;
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [title, setTitle] = useState(stateString(state, "title", category?.title ?? ""));
  const [slug, setSlug] = useState(stateString(state, "slug", category?.slug ?? ""));
  const [slugTouched, setSlugTouched] = useState(Boolean(category?.slug));

  return (
    <form key={stateKey(state)} action={formAction}>
      <Panel>
        {category ? <input type="hidden" name="id" value={category.id} /> : null}
        <FieldError message={state.message} />
        {state.ok ? <p className="text-sm font-semibold text-emerald-200">{state.message}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Название</span>
            <input
              name="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              className={inputClass}
            />
            <FieldError message={state.errors?.title} />
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Slug</span>
            <input
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className={inputClass}
            />
            <FieldError message={state.errors?.slug} />
          </label>
        </div>
        <label className="space-y-1.5 text-sm font-semibold">
          <span>Description</span>
          <textarea name="description" defaultValue={stateString(state, "description", category?.description ?? "")} className={textareaClass} />
        </label>
        <label className="space-y-1.5 text-sm font-semibold">
          <span>Порядок сортировки</span>
          <input name="sort_order" type="number" defaultValue={stateString(state, "sort_order", String(category?.sort_order ?? 0))} className={inputClass} />
        </label>
        <button disabled={pending} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {pending ? "Сохранение..." : category ? "Обновить раздел" : "Создать раздел"}
        </button>
      </Panel>
    </form>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
