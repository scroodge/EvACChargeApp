insert into public.knowledge_categories (slug, title, description, sort_order)
values (
  'spare-parts',
  'Запчасти',
  'Каталог запчастей с описанием, изображениями ракурсов и ссылками на товары.',
  45
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order;

create table if not exists public.spare_parts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references public.knowledge_categories(id),
  part_number text,
  compatibility text,
  external_links jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  search_keywords text[] default '{}'::text[],
  status text not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spare_parts_status_check check (status in ('draft', 'published', 'archived')),
  constraint spare_parts_external_links_array_check check (jsonb_typeof(external_links) = 'array'),
  constraint spare_parts_images_array_check check (jsonb_typeof(images) = 'array')
);

drop trigger if exists set_spare_parts_updated_at on public.spare_parts;
create trigger set_spare_parts_updated_at
before update on public.spare_parts
for each row execute function public.set_updated_at();

alter table public.spare_parts enable row level security;

drop policy if exists "Everyone can read published spare parts" on public.spare_parts;
create policy "Everyone can read published spare parts"
on public.spare_parts for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can manage spare parts" on public.spare_parts;
create policy "Admins can manage spare parts"
on public.spare_parts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists spare_parts_status_sort_idx on public.spare_parts(status, sort_order, title);
create index if not exists spare_parts_category_idx on public.spare_parts(category_id);

insert into storage.buckets (id, name, public)
values ('knowledge-spare-parts', 'knowledge-spare-parts', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read knowledge spare part images" on storage.objects;
create policy "Public can read knowledge spare part images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'knowledge-spare-parts');

drop policy if exists "Admins can upload knowledge spare part images" on storage.objects;
create policy "Admins can upload knowledge spare part images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'knowledge-spare-parts'
  and public.is_admin()
);

drop policy if exists "Admins can update knowledge spare part images" on storage.objects;
create policy "Admins can update knowledge spare part images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'knowledge-spare-parts'
  and public.is_admin()
)
with check (
  bucket_id = 'knowledge-spare-parts'
  and public.is_admin()
);

drop policy if exists "Admins can delete knowledge spare part images" on storage.objects;
create policy "Admins can delete knowledge spare part images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'knowledge-spare-parts'
  and public.is_admin()
);
