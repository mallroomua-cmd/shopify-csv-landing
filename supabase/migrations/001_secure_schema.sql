-- MALLROOM — схема и безопасность. Выполнить целиком в Supabase → SQL Editor.
-- Идемпотентно: можно запускать повторно.

-- 1. Таблицы -----------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  store_id text not null default 'mallroom',
  handle text not null,
  title text not null,
  body_html text default '',
  vendor text default '',
  product_type text default '',
  tags jsonb default '[]'::jsonb,
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  images jsonb default '[]'::jsonb,
  featured_image text default '',
  available boolean not null default true,
  sku text default '',
  barcode text default '',
  variants jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists products_handle_key on public.products(handle);

create table if not exists public.orders (
  id text primary key,
  store_id text not null default 'mallroom',
  order_id text not null unique,
  name text not null,
  phone text not null,
  email text default '',
  city text default '',
  warehouse text default '',
  delivery_method text not null default 'nova_poshta',
  payment_method text not null default 'cash_on_delivery',
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  discount_amount numeric(10,2) default 0,
  promo_code text default '',
  notes text default '',
  ttn text default '',
  status text not null default 'new',
  payment_status text not null default 'pending',
  payment_reference text default '',
  attribution jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders add column if not exists email text default '';
alter table public.orders add column if not exists attribution jsonb default '{}'::jsonb;

-- Админы: добавляются вручную (см. конец файла)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.handle_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
  for each row execute function public.handle_updated_at();
drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

-- 2. RLS: снести ВСЕ старые политики (в т.ч. «Anon all …») -------------------
do $$ declare p record; begin
  for p in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('products','orders','admins')
  loop execute format('drop policy %I on public.%I', p.policyname, p.tablename); end loop;
end $$;

alter table public.products enable row level security;
alter table public.orders   enable row level security;
alter table public.admins   enable row level security;

-- Витрина: читать только товары. Писать — только админ.
create policy products_public_read on public.products for select using (true);
create policy products_admin_write on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Заказы: anon НЕ имеет доступа. Создаёт заказы только сервер (service role).
create policy orders_admin_all on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admins_self_read on public.admins for select to authenticated
  using (user_id = auth.uid());

-- 3. Хранилище фото ----------------------------------------------------------
insert into storage.buckets (id, name, public) values ('product-images','product-images', true)
  on conflict (id) do update set public = true;

do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects'
           and policyname ilike '%product%'
  loop execute format('drop policy %I on storage.objects', p.policyname); end loop;
end $$;

create policy product_images_read on storage.objects for select
  using (bucket_id = 'product-images');
create policy product_images_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- 4. Очистка старого каталога (по решению владельца: старые товары и бренды удаляются)
delete from public.products;

-- 5. Назначить себя админом (после регистрации пользователя в Auth → Users):
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'ВАШ_EMAIL' on conflict do nothing;
