-- Run in Supabase SQL Editor. Existing product rows are preserved.
begin;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists available boolean not null default true;
create table if not exists public.store_admins (user_id uuid primary key references auth.users(id));
alter table public.store_admins enable row level security;
create or replace function public.is_store_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.store_admins where user_id=auth.uid()); $$;
revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to anon, authenticated;
alter table public.products enable row level security;
-- Remove old product policies, including permissive anonymous writes.
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='public' and tablename='products' loop execute format('drop policy %I on public.products',p.policyname); end loop; end $$;
create policy catalog_read on public.products for select to anon,authenticated using(true);
create policy admin_insert on public.products for insert to authenticated with check(public.is_store_admin());
create policy admin_update on public.products for update to authenticated using(public.is_store_admin()) with check(public.is_store_admin());
create policy admin_delete on public.products for delete to authenticated using(public.is_store_admin());
drop policy if exists product_images_insert_guard on storage.objects;
drop policy if exists product_images_update_guard on storage.objects;
drop policy if exists product_images_delete_guard on storage.objects;
drop policy if exists product_images_admin on storage.objects;
-- Restrictive guards override any older permissive storage policies for this bucket.
create policy product_images_insert_guard on storage.objects as restrictive for insert to public with check(bucket_id <> 'product-images' or public.is_store_admin());
create policy product_images_update_guard on storage.objects as restrictive for update to public using(bucket_id <> 'product-images' or public.is_store_admin()) with check(bucket_id <> 'product-images' or public.is_store_admin());
create policy product_images_delete_guard on storage.objects as restrictive for delete to public using(bucket_id <> 'product-images' or public.is_store_admin());
create policy product_images_admin on storage.objects for all to authenticated using(bucket_id='product-images' and public.is_store_admin()) with check(bucket_id='product-images' and public.is_store_admin());
commit;
-- After creating your user in Authentication > Users, insert its User UID:
-- insert into public.store_admins(user_id) values ('YOUR-USER-UUID');
