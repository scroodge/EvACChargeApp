"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";

import type { AdminFormState } from "@/actions/knowledge-admin";
import { JsonSectionsEditor } from "@/components/admin/knowledge/JsonSectionsEditor";
import { TagsInput } from "@/components/admin/knowledge/TagsInput";
import { stateKey, stateList, stateString } from "@/components/admin/knowledge/form-state";
import type { KnowledgeArticle, KnowledgeCategory } from "@/types/knowledge";

type ArticleFormProps = {
  article?: KnowledgeArticle;
  categories: KnowledgeCategory[];
  articles: KnowledgeArticle[];
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;
};

export function ArticleForm({ article, categories, articles, action }: ArticleFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [title, setTitle] = useState(stateString(state, "title", article?.title ?? ""));
  const [slug, setSlug] = useState(stateString(state, "slug", article?.slug ?? ""));
  const [slugTouched, setSlugTouched] = useState(Boolean(article?.slug));
  const images = state.values
    ? stateList(state, "existing_image_url").map((url, index) => ({
        url,
        alt: stateList(state, "existing_image_alt")[index] ?? "",
      }))
    : article?.images ?? [];

  return (
    <form key={stateKey(state)} action={formAction} className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <Panel>
          <FieldError message={state.message} />
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
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Краткое описание</span>
            <textarea name="summary" defaultValue={stateString(state, "summary", article?.summary ?? "")} className={textareaClass} />
          </label>
          <JsonSectionsEditor
            defaultValue={
              state.values
                ? stateList(state, "content_heading").map((heading, index) => ({
                    heading,
                    body: stateList(state, "content_body")[index] ?? "",
                  }))
                : article?.content
            }
            error={state.errors?.content}
          />
          <div className="space-y-3">
            <label className="space-y-1.5 text-sm font-semibold">
              <span>Фото статьи</span>
              <input
                name="image_files"
                type="file"
                accept="image/*"
                multiple
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-primary-foreground"
              />
              <span className="text-xs font-normal text-muted-foreground">
                Можно загрузить несколько фото. Первое фото будет обложкой карточки и первым слайдом галереи.
              </span>
            </label>
            {images.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {images.map((image, index) => (
                  <div key={`${image.url}-${index}`} className="rounded-lg border border-border bg-white/[0.03] p-2">
                    <Image
                      src={image.url}
                      alt={image.alt || article?.title || "Фото статьи"}
                      width={320}
                      height={180}
                      unoptimized
                      className="aspect-[16/9] w-full rounded-lg object-cover"
                    />
                    <input type="hidden" name="existing_image_url" value={image.url} />
                    <input
                      name="existing_image_alt"
                      defaultValue={image.alt}
                      className="mt-2 min-h-9 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none"
                      placeholder="Описание фото"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Советы</span>
            <textarea name="tips" defaultValue={stateString(state, "tips", article?.tips.join("\n") ?? "")} className={textareaClass} />
            <span className="text-xs font-normal text-muted-foreground">Один совет на строку.</span>
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Предупреждения</span>
            <textarea name="warnings" defaultValue={stateString(state, "warnings", article?.warnings.join("\n") ?? "")} className={textareaClass} />
            <span className="text-xs font-normal text-muted-foreground">Одно предупреждение на строку.</span>
          </label>
        </Panel>
      </div>

      <aside className="space-y-4">
        <Panel>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Статус</span>
            <select name="status" defaultValue={stateString(state, "status", article?.status ?? "draft")} className={inputClass}>
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
              <option value="archived">Архив</option>
            </select>
            <FieldError message={state.errors?.status} />
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Раздел</span>
            <select name="category_id" defaultValue={stateString(state, "category_id", article?.category_id ?? "")} className={inputClass}>
              <option value="">Выберите раздел</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.title}</option>
              ))}
            </select>
            <FieldError message={state.errors?.category_id} />
          </label>
          <TagsInput name="tags" label="Теги" defaultValue={stateString(state, "tags", article?.tags.join(", ") ?? "")} />
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Источник</span>
            <input name="source_label" defaultValue={stateString(state, "source_label", article?.source_label ?? "")} className={inputClass} />
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Порядок сортировки</span>
            <input name="sort_order" type="number" defaultValue={stateString(state, "sort_order", String(article?.sort_order ?? 0))} className={inputClass} />
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            <span>Связанные статьи</span>
            <select
              name="related_article_ids"
              multiple
              defaultValue={stateList(state, "related_article_ids", article?.related_article_ids ?? [])}
              className="min-h-40 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {articles
                .filter((item) => item.id !== article?.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button disabled={pending} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {pending ? "Сохранение..." : "Сохранить"}
            </button>
            <Link href="/admin/knowledge/articles" className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold">
              Отмена
            </Link>
          </div>
        </Panel>
      </aside>
    </form>
  );
}

export const inputClass =
  "min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40";
export const textareaClass =
  "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

export function Panel({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4 rounded-lg border border-border bg-card p-4">{children}</section>;
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-semibold text-destructive">{message}</p> : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
