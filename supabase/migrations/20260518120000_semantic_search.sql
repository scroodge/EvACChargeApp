create extension if not exists vector with schema extensions;

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  content text not null,
  category text not null default 'faq',

  source_type text not null default 'manual',
  source_url text,
  telegram_message_id text,
  source_id uuid,
  source_slug text,

  tags text[] not null default '{}',

  embedding extensions.vector(1536),

  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_items
  add column if not exists title text,
  add column if not exists content text,
  add column if not exists category text not null default 'faq',
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_url text,
  add column if not exists telegram_message_id text,
  add column if not exists source_id uuid,
  add column if not exists source_slug text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists embedding extensions.vector(1536),
  add column if not exists is_published boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists knowledge_items_embedding_hnsw_idx
on public.knowledge_items
using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists knowledge_items_category_idx
on public.knowledge_items(category);

create index if not exists knowledge_items_is_published_idx
on public.knowledge_items(is_published);

create index if not exists knowledge_items_source_idx
on public.knowledge_items(source_type, source_id);

drop trigger if exists set_knowledge_items_updated_at on public.knowledge_items;
create trigger set_knowledge_items_updated_at
before update on public.knowledge_items
for each row execute function public.set_updated_at();

create or replace function public.match_knowledge_items(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.2,
  match_count int default 8,
  filter_category text default null
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  source_type text,
  source_url text,
  telegram_message_id text,
  tags text[],
  similarity float
)
language sql
stable
as $$
  select
    knowledge_items.id,
    knowledge_items.title,
    knowledge_items.content,
    knowledge_items.category,
    knowledge_items.source_type,
    knowledge_items.source_url,
    knowledge_items.telegram_message_id,
    knowledge_items.tags,
    1 - (knowledge_items.embedding <=> query_embedding) as similarity
  from public.knowledge_items
  where
    knowledge_items.is_published = true
    and knowledge_items.embedding is not null
    and (filter_category is null or knowledge_items.category = filter_category)
    and 1 - (knowledge_items.embedding <=> query_embedding) > match_threshold
  order by knowledge_items.embedding <=> query_embedding asc
  limit least(match_count, 20);
$$;

alter table public.knowledge_items enable row level security;

drop policy if exists "Public can read published knowledge items" on public.knowledge_items;

create policy "Public can read published knowledge items"
on public.knowledge_items
for select
using (is_published = true);

drop policy if exists "Admins can manage knowledge items" on public.knowledge_items;
create policy "Admins can manage knowledge items"
on public.knowledge_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.knowledge_items (
  title, content, category, source_type, source_slug, tags, is_published
)
values
  (
    'Зарядка BYD YUAN UP зимой',
    'В мороз закладывайте больше времени на AC-зарядку, по возможности подключайте автомобиль сразу после поездки, пока батарея теплее. Проверяйте расписание зарядки, мощность станции и состояние кабеля. Для ежедневных поездок заранее планируйте запас, потому что холод увеличивает расход и может снизить скорость зарядки.',
    'charging',
    'seed',
    'winter-charging-byd-yuan-up',
    array['зима', 'зарядка', 'AC', 'батарея'],
    true
  ),
  (
    'Медленная AC-зарядка дома',
    'Если BYD YUAN UP медленно заряжается дома, проверьте ограничение тока в автомобиле или EVSE, качество розетки, температуру кабеля, расписание и мощность линии. Ночная AC-зарядка может быть нормальной, если машина успевает набрать нужный процент к выезду.',
    'charging',
    'seed',
    'slow-home-ac-charging',
    array['медленная зарядка', 'дом', 'EVSE', 'AC'],
    true
  ),
  (
    'Аксессуары для BYD YUAN UP',
    'Полезные аксессуары для BYD YUAN UP: резиновые коврики с точной посадкой, кабель Type 2, органайзер багажника, компрессор и зимняя омывающая жидкость. Коврики не должны мешать педалям, скользить или иметь сильный запах.',
    'accessories',
    'seed',
    'byd-yuan-up-accessories',
    array['аксессуары', 'коврики', 'кабель', 'компрессор'],
    true
  ),
  (
    'Опыт эксплуатации BYD YUAN UP',
    'В первые недели владельцу полезно проверить настройки зарядки, подключение телефона, давление в шинах, расход в своей погоде и удобные зарядные точки. Записывайте вопросы для сервиса и постепенно формируйте привычный сценарий поездок.',
    'ownership',
    'seed',
    'byd-yuan-up-ownership',
    array['опыт владельца', 'первые дни', 'настройки'],
    true
  ),
  (
    'Ремонт и обслуживание BYD YUAN UP',
    'Для обслуживания BYD YUAN UP ориентируйтесь на официальный регламент. Владелец может следить за шинами, тормозами, подвеской, салонным фильтром, охлаждающими жидкостями и 12-вольтовой системой, но сложные работы лучше оставлять сервису.',
    'maintenance',
    'seed',
    'byd-yuan-up-maintenance',
    array['обслуживание', 'ремонт', 'сервис', 'проверки'],
    true
  )
on conflict do nothing;
