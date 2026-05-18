-- Which BYD Yuan Up generations a knowledge article applies to.
alter table public.knowledge_articles
  add column if not exists model_generations text[] not null default array['gen1_2024', 'gen2_2025']::text[];

alter table public.knowledge_articles
  drop constraint if exists knowledge_articles_model_generations_check;

alter table public.knowledge_articles
  add constraint knowledge_articles_model_generations_check check (
    cardinality(model_generations) > 0
    and model_generations <@ array['gen1_2024', 'gen2_2025']::text[]
  );

comment on column public.knowledge_articles.model_generations is
  'BYD Yuan Up generations this article targets; both values means universal content.';
