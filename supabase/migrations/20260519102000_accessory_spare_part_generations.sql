alter table public.accessories
  add column if not exists model_generations text[] not null default array['gen1_2024', 'gen2_2025']::text[];

alter table public.accessories
  drop constraint if exists accessories_model_generations_check;

alter table public.accessories
  add constraint accessories_model_generations_check check (
    cardinality(model_generations) > 0
    and model_generations <@ array['gen1_2024', 'gen2_2025']::text[]
  );

create index if not exists accessories_model_generations_idx
on public.accessories using gin(model_generations);

alter table public.spare_parts
  add column if not exists model_generations text[] not null default array['gen1_2024', 'gen2_2025']::text[];

alter table public.spare_parts
  drop constraint if exists spare_parts_model_generations_check;

alter table public.spare_parts
  add constraint spare_parts_model_generations_check check (
    cardinality(model_generations) > 0
    and model_generations <@ array['gen1_2024', 'gen2_2025']::text[]
  );

create index if not exists spare_parts_model_generations_idx
on public.spare_parts using gin(model_generations);

update public.knowledge_items item
set model_generations = accessory.model_generations
from public.accessories accessory
where
  item.source_type = 'accessory'
  and (
    item.source_id = accessory.id
    or item.id = accessory.id
  );

update public.knowledge_items item
set model_generations = spare_part.model_generations
from public.spare_parts spare_part
where
  item.source_type = 'spare_part'
  and (
    item.source_id = spare_part.id
    or item.id = spare_part.id
  );
