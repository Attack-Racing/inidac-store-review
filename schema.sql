-- イニDAC 店舗レビュー Supabase schema
-- Supabase SQL Editorで実行してください。実行後、RLSポリシーを必ず確認してください。

create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  country text not null check (char_length(country) between 1 and 80),
  region text not null default '' check (char_length(region) <= 80),
  address text not null check (char_length(address) between 1 and 240),
  maps_url text,
  cabinet_count integer check (cabinet_count is null or cabinet_count between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  maintenance integer not null check (maintenance between 1 and 4),
  overall integer not null check (overall between 1 and 4),
  driver_rank integer check (driver_rank is null or driver_rank between 1 and 5),
  connection integer check (connection is null or connection between 1 and 5),
  comment text not null check (char_length(comment) between 5 and 1500),
  visited_at date,
  author_name text check (author_name is null or char_length(author_name) <= 40),
  created_at timestamptz not null default now()
);

create index if not exists stores_country_region_idx on public.stores(country, region);
create index if not exists stores_name_idx on public.stores using btree(name);
create index if not exists reviews_store_id_idx on public.reviews(store_id);
create index if not exists reviews_created_at_idx on public.reviews(created_at desc);

alter table public.stores enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Anyone can read stores" on public.stores;
create policy "Anyone can read stores" on public.stores for select using (true);
drop policy if exists "Authenticated users can add stores" on public.stores;
create policy "Authenticated users can add stores" on public.stores for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "Creators can update their stores" on public.stores;
create policy "Creators can update their stores" on public.stores for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews" on public.reviews for select using (true);
drop policy if exists "Authenticated users can add reviews" on public.reviews;
create policy "Authenticated users can add reviews" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Authors can update own reviews" on public.reviews;
create policy "Authors can update own reviews" on public.reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Authors can delete own reviews" on public.reviews;
create policy "Authors can delete own reviews" on public.reviews for delete to authenticated using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.stores, public.reviews to anon, authenticated;
grant insert on public.stores, public.reviews to authenticated;
grant update, delete on public.stores, public.reviews to authenticated;


-- Existing installations: allow blank region for non-Japanese countries.
alter table public.stores alter column region set default '';
alter table public.stores alter column region drop not null;
alter table public.stores drop constraint if exists stores_region_check;
alter table public.stores add constraint stores_region_check check (region is null or char_length(region) <= 80);

-- Single public-site content record. Only the configured admin may write it.
create table if not exists public.site_content (
  id integer primary key check (id = 1),
  content jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content" on public.site_content for select using (true);
drop policy if exists "Admin can insert site content" on public.site_content;
create policy "Admin can insert site content" on public.site_content for insert to authenticated with check (lower(coalesce(auth.jwt()->>'email','')) = 'grgt1462@gmail.com' and auth.uid() = updated_by);
drop policy if exists "Admin can update site content" on public.site_content;
create policy "Admin can update site content" on public.site_content for update to authenticated using (lower(coalesce(auth.jwt()->>'email','')) = 'grgt1462@gmail.com') with check (lower(coalesce(auth.jwt()->>'email','')) = 'grgt1462@gmail.com' and auth.uid() = updated_by);
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
