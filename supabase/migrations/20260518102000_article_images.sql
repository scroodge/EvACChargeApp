alter table public.knowledge_articles
add column if not exists images jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_articles_images_array_check'
  ) then
    alter table public.knowledge_articles
    add constraint knowledge_articles_images_array_check
    check (jsonb_typeof(images) = 'array');
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('knowledge-articles', 'knowledge-articles', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read knowledge article images" on storage.objects;
create policy "Public can read knowledge article images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'knowledge-articles');

drop policy if exists "Admins can upload knowledge article images" on storage.objects;
create policy "Admins can upload knowledge article images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'knowledge-articles'
  and public.is_admin()
);

drop policy if exists "Admins can update knowledge article images" on storage.objects;
create policy "Admins can update knowledge article images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'knowledge-articles'
  and public.is_admin()
)
with check (
  bucket_id = 'knowledge-articles'
  and public.is_admin()
);

drop policy if exists "Admins can delete knowledge article images" on storage.objects;
create policy "Admins can delete knowledge article images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'knowledge-articles'
  and public.is_admin()
);
