-- ========================================================
-- MALLROOM & DUNE E-COMMERCE SUPABASE SCHEMA (IDEMPOTENT)
-- Unified Cloud Database for Products, Orders & Storage
-- ========================================================

-- 1. Create or Migrate PRODUCTS table
create table if not exists public.products (
  id text primary key,
  title text not null
);

-- Ensure all required columns exist (safe for existing tables)
alter table public.products add column if not exists store_id text not null default 'mallroom';
alter table public.products add column if not exists handle text default '';
alter table public.products add column if not exists body_html text default '';
alter table public.products add column if not exists vendor text default '';
alter table public.products add column if not exists product_type text default '';
alter table public.products add column if not exists tags jsonb default '[]'::jsonb;
alter table public.products add column if not exists price numeric default 0;
alter table public.products add column if not exists compare_at_price numeric;
alter table public.products add column if not exists images jsonb default '[]'::jsonb;
alter table public.products add column if not exists featured_image text default '';
alter table public.products add column if not exists available boolean default true;
alter table public.products add column if not exists sku text default '';
alter table public.products add column if not exists barcode text default '';
alter table public.products add column if not exists variants jsonb default '[]'::jsonb;
alter table public.products add column if not exists created_at timestamptz default timezone('utc'::text, now()) not null;
alter table public.products add column if not exists updated_at timestamptz default timezone('utc'::text, now()) not null;

-- Indexes for fast queries and search
create index if not exists idx_products_store_id on public.products(store_id);
create index if not exists idx_products_handle on public.products(handle);
create index if not exists idx_products_available on public.products(available);
create index if not exists idx_products_vendor on public.products(vendor);
create index if not exists idx_products_product_type on public.products(product_type);

-- 2. Create or Migrate ORDERS table
create table if not exists public.orders (
  id text primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.orders add column if not exists store_id text not null default 'mallroom';
alter table public.orders add column if not exists order_id text default '';
alter table public.orders add column if not exists customer_name text default '';
alter table public.orders add column if not exists phone text default '';
alter table public.orders add column if not exists city text default '';
alter table public.orders add column if not exists warehouse text default '';
alter table public.orders add column if not exists delivery_method text default 'nova_poshta';
alter table public.orders add column if not exists payment_method text default 'cash_on_delivery';
alter table public.orders add column if not exists notes text default '';
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;
alter table public.orders add column if not exists total numeric not null default 0;
alter table public.orders add column if not exists status text not null default 'new';
alter table public.orders add column if not exists ttn text default '';
alter table public.orders add column if not exists synced_to_telegram boolean default false;

create index if not exists idx_orders_store_id on public.orders(store_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- 3. Enable Row Level Security (RLS) with Public Anon Access
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Drop existing policies to allow clean recreation
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
