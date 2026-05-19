alter table public.faq_items
  add column if not exists model_generations text[] not null default array['gen1_2024', 'gen2_2025']::text[];

alter table public.faq_items
  drop constraint if exists faq_items_model_generations_check;

alter table public.faq_items
  add constraint faq_items_model_generations_check check (
    cardinality(model_generations) > 0
    and model_generations <@ array['gen1_2024', 'gen2_2025']::text[]
  );

create index if not exists faq_items_model_generations_idx
on public.faq_items using gin(model_generations);

update public.knowledge_items as item
set model_generations = faq.model_generations
from public.faq_items as faq
where item.source_id = faq.id
  and item.source_type = 'faq';
