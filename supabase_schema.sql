-- ========================================================
-- MALLROOM & DUNE E-COMMERCE SUPABASE SCHEMA
-- Unified Cloud Database for Products, Orders & Storage
-- ========================================================

-- 1. Create PRODUCTS table
create table if not exists public.products (
  id text primary key,
  store_id text not null default 'mallroom', -- 'mallroom' or 'dune'
  handle text not null,
  title text not null,
  body_html text default '',
  vendor text default '',
  product_type text default '',
  tags jsonb default '[]'::jsonb,
  price numeric not null default 0,
  compare_at_price numeric,
  images jsonb default '[]'::jsonb,
  featured_image text default '',
  available boolean default true,
  sku text default '',
  barcode text default '',
  variants jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Indexes for fast queries and search
create index if not exists idx_products_store_id on public.products(store_id);
create index if not exists idx_products_handle on public.products(handle);
create index if not exists idx_products_available on public.products(available);
create index if not exists idx_products_vendor on public.products(vendor);
create index if not exists idx_products_product_type on public.products(product_type);

-- 2. Create ORDERS table (for instant sync of customer orders)
create table if not exists public.orders (
  id text primary key,
  store_id text not null default 'mallroom',
  order_id text not null,
  customer_name text not null,
  phone text not null,
  city text default '',
  warehouse text default '',
  delivery_method text default 'nova_poshta',
  payment_method text default 'cash_on_delivery',
  notes text default '',
  items jsonb default '[]'::jsonb,
  total numeric not null default 0,
  status text not null default 'new',
  ttn text default '',
  synced_to_telegram boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_orders_store_id on public.orders(store_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- 3. Enable Row Level Security (RLS) with Public Anon Access
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public read products" on public.products;
drop policy if exists "Anon all products" on public.products;
drop policy if exists "Anon insert orders" on public.orders;
drop policy if exists "Anon read/manage orders" on public.orders;

-- Policies for products (Anyone can read, anon key can insert/update/delete for the store admin)
create policy "Public read products" on public.products
  for select using (true);

create policy "Anon all products" on public.products
  for all using (true) with check (true);

-- Policies for orders (Customers can create orders, anon admin can read/update)
create policy "Anon insert orders" on public.orders
  for insert with check (true);

create policy "Anon read/manage orders" on public.orders
  for all using (true) with check (true);

-- 4. Create STORAGE BUCKET for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Drop existing storage policies if re-running
drop policy if exists "Public access to product images" on storage.objects;
drop policy if exists "Allow upload to product images" on storage.objects;
drop policy if exists "Allow update product images" on storage.objects;
drop policy if exists "Allow delete product images" on storage.objects;

-- Storage policies for 'product-images' bucket
create policy "Public access to product images"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

create policy "Allow upload to product images"
  on storage.objects for insert
  with check ( bucket_id = 'product-images' );

create policy "Allow update product images"
  on storage.objects for update
  with check ( bucket_id = 'product-images' );

create policy "Allow delete product images"
  on storage.objects for delete
  using ( bucket_id = 'product-images' );
