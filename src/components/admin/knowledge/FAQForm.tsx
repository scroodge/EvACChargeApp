"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AdminFormState } from "@/actions/knowledge-admin";
import { FieldError, inputClass, Panel, textareaClass } from "@/components/admin/knowledge/ArticleForm";
import { TagsInput } from "@/components/admin/knowledge/TagsInput";
import { stateKey, stateList, stateString } from "@/components/admin/knowledge/form-state";
import { carGenerations } from "@/lib/car-generations";
import { telegramGenerationLabels } from "@/lib/telegram/generation";
import type { FAQItem, KnowledgeCategory } from "@/types/knowledge";

export function FAQForm({
  item,
  categories,
  action,
}: {
  item?: FAQItem;
  categories: KnowledgeCategory[];
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const selectedGenerations = state.values
    ? stateList(state, "model_generations")
    : item?.model_generations ?? carGenerations;

  return (
    <form key={stateKey(state)} action={formAction} className="max-w-3xl">
      <Panel>
        <FieldError message={state.message} />
        <label className="space-y-1.5 text-sm font-semibold">
          <span>Вопрос</span>
          <input name="question" defaultValue={stateString(state, "question", item?.question ?? "")} className={inputClass} />
          <FieldError message={state.errors?.question} />
        </label>
        <label className="space-y-1.5 text-sm font-semibold">
          <span>Ответ</span>
          <textarea name="answer" defaultValue={stateString(state, "answer", item?.answer ?? "")} className={textareaClass} />
          <FieldError message={state.errors?.answer} />
        </label>
        <label className="space-y-1.5 text-sm font-semibold">
          <span>Раздел</span>
          <select name="category_id" defaultValue={stateString(state, "category_id", item?.category_id ?? "")} className={inputClass}>
            <option value="">Выберите раздел</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.title}</option>
            ))}
          </select>
          <FieldError message={state.errors?.category_id} />
        </label>
        <TagsInput name="tags" label="Теги" defaultValue={stateString(state, "tags", item?.tags.join(", ") ?? "")} />
        <fieldset className="space-y-2 text-sm font-semibold">
          <legend>Поколения Yuan Up</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {carGenerations.map((generation) => (
              <label key={generation} className="flex items-center gap-2 font-normal">
                <input
                  type="checkbox"
                  name="model_generations"
                  value={generation}
                  defaultChecked={selectedGenerations.includes(generation)}
                  className="size-4 accent-primary"
                />
                <span>{telegramGenerationLabels[generation]}</span>
              </label>
            ))}
          </div>
          <FieldError message={state.errors?.model_generations} />
        </fieldset>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Статус</span>
            <select name="status" defaultValue={stateString(state, "status", item?.status ?? "draft")} className={inputClass}>
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
              <option value="archived">Архив</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Порядок сортировки</span>
            <input name="sort_order" type="number" defaultValue={stateString(state, "sort_order", String(item?.sort_order ?? 0))} className={inputClass} />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={pending} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {pending ? "Сохранение..." : "Сохранить"}
          </button>
          <Link href="/admin/knowledge/faq" className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold">
            Отмена
          </Link>
        </div>
      </Panel>
    </form>
  );
}
