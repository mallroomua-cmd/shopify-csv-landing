import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  UploadCloud,
  Loader2,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { Product } from '../types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  testSupabaseConnection,
  bulkSyncProductsToSupabase,
  fetchProductsFromSupabase,
} from '../lib/supabase';

interface SupabaseSettingsCardProps {
  products: Product[];
  onProductsUpdated?: (newProducts: Product[]) => void;
  storeId?: string;
}

export const SupabaseSettingsCard: React.FC<SupabaseSettingsCardProps> = ({
  products,
  onProductsUpdated,
  storeId = 'mallroom',
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<string | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    setUrl(config.url);
    setAnonKey(config.anonKey);

    if (isSupabaseConfigured()) {
      void runTest(false);
    }
  }, []);

  const runTest = async (showFeedback = true) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (showFeedback && res.success) {
        setSyncStatus(`Зʼєднання встановлено! У хмарі товарів: ${res.count ?? 0}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    await runTest(true);
  };

  const handleBulkUpload = async () => {
    if (!isSupabaseConfigured()) {
      alert('Спочатку збережіть валідні Supabase URL та Anon Key');
      return;
    }

    if (
      !confirm(
        `Завантажити всі ${products.length} товарів магазину в базу Supabase для store_id="${storeId}"?`
      )
    ) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await bulkSyncProductsToSupabase(products, storeId);
      setSyncStatus(`Успішно синхронізовано ${res.success} товарів у Supabase!`);
      await runTest(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatus(`Помилка синхронізації: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!isSupabaseConfigured()) {
      alert('Спочатку налаштуйте Supabase');
      return;
    }

    setIsPulling(true);
    setPullStatus(null);
    try {
      const cloudProducts = await fetchProductsFromSupabase(storeId);
      if (cloudProducts.length === 0) {
        setPullStatus('У базі Supabase для цього магазину ще немає товарів. Натисніть "Синхронізувати каталог у хмару".');
      } else {
        if (onProductsUpdated) {
          onProductsUpdated(cloudProducts);
        }
        setPullStatus(`Успішно завантажено ${cloudProducts.length} товарів з Supabase! Вітрина оновлена.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPullStatus(`Помилка завантаження: ${msg}`);
    } finally {
      setIsPulling(false);
    }
  };

  const copySqlCode = () => {
    const sqlCode = `-- SQL для створення таблиць та сховища в Supabase
create table if not exists public.products (
  id text primary key,
  store_id text not null default '${storeId}',
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

create index if not exists idx_products_store_id on public.products(store_id);
create index if not exists idx_products_handle on public.products(handle);

create table if not exists public.orders (
  id text primary key,
  store_id text not null default '${storeId}',
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

alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Public read products" on public.products for select using (true);
create policy "Anon all products" on public.products for all using (true) with check (true);
create policy "Anon insert orders" on public.orders for insert with check (true);
create policy "Anon read/manage orders" on public.orders for all using (true) with check (true);

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do update set public = true;
create policy "Public access to product images" on storage.objects for select using ( bucket_id = 'product-images' );
create policy "Allow upload to product images" on storage.objects for insert with check ( bucket_id = 'product-images' );
create policy "Allow update product images" on storage.objects for update with check ( bucket_id = 'product-images' );
create policy "Allow delete product images" on storage.objects for delete using ( bucket_id = 'product-images' );
`;

    void navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* HEADER & STATUS BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Хмара Supabase & Фотосховище
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                  store_id: {storeId}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Централізована PostgreSQL база даних, фото-бакет та миттєва синхронізація товарів
              </p>
            </div>
          </div>
        </div>

        <div>
          {configured && testResult?.success ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Підключено (Активна хмара)</span>
            </div>
          ) : configured ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Перевірка зʼєднання...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Локальний режим (Offline IndexedDB)</span>
            </div>
          )}
        </div>
      </div>

      {/* QUICK INSTRUCTIONS BANNER */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Як налаштувати за 2 хвилини:
          </span>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
          >
            Відкрити supabase.com <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
          <li>
            Увійдіть у Supabase, створіть безкоштовний проект (наприклад, <strong>mallroom-store</strong>).
          </li>
          <li>
            Відкрийте вкладку <strong>SQL Editor</strong> зліва, вставте готовий скрипт (кнопка нижче) та натисніть <strong>Run</strong>.
          </li>
          <li>
            Скопіюйте з <strong>Project Settings → API</strong> значення <strong>Project URL</strong> та <strong>anon key</strong> і збережіть у форму нижче.
          </li>
        </ol>

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copySqlCode}
            className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSql ? 'SQL скопійовано!' : 'Скопіювати готовий SQL для Supabase'}
          </button>
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            {showSql ? 'Сховати SQL' : 'Показати SQL-код'}
          </button>
        </div>

        {showSql && (
          <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60">
            <pre>{`-- Виконайте в Supabase SQL Editor:
create table if not exists public.products (
  id text primary key,
  store_id text not null default '${storeId}',
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

create table if not exists public.orders (
  id text primary key,
  store_id text not null default '${storeId}',
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
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
create policy "Public read products" on public.products for select using (true);
create policy "Anon all products" on public.products for all using (true) with check (true);
create policy "Anon insert orders" on public.orders for insert with check (true);
create policy "Anon read/manage orders" on public.orders for all using (true) with check (true);

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do update set public = true;
create policy "Public access to product images" on storage.objects for select using ( bucket_id = 'product-images' );
create policy "Allow upload to product images" on storage.objects for insert with check ( bucket_id = 'product-images' );
create policy "Allow update product images" on storage.objects for update with check ( bucket_id = 'product-images' );
create policy "Allow delete product images" on storage.objects for delete using ( bucket_id = 'product-images' );`}</pre>
          </div>
        )}
      </div>

      {/* CREDENTIALS FORM */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-800">Supabase Project URL *</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzabcdefg.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-800">Supabase Anon Key *</label>
            <input
              type="text"
              required
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isTesting}
              className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Зберегти та перевірити зʼєднання
            </button>

            <button
              type="button"
              onClick={() => runTest(true)}
              disabled={isTesting || !configured}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Перевірити зʼєднання
            </button>
          </div>

          {testResult && (
            <div
              className={`p-2.5 px-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </form>

      {/* CLOUD OPERATIONS SECTION */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-700" />
          Операції синхронізації каталогу
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* BULK UPLOAD TO CLOUD */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div>
              <h4 className="font-bold text-slate-900 text-xs">
                Синхронізувати поточний каталог в Supabase
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Вивантажує всі {products.length} товарів з вашого локального каталогу прямо в хмару
              </p>
            </div>
            <button
              type="button"
              onClick={handleBulkUpload}
              disabled={isSyncing || !configured}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Вивантаження {products.length} товарів...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Вивантажити {products.length} товарів у хмару
                </>
              )}
            </button>
            {syncStatus && (
              <p className="text-[11px] text-emerald-700 font-semibold text-center">{syncStatus}</p>
            )}
          </div>

          {/* PULL FROM CLOUD */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div>
              <h4 className="font-bold text-slate-900 text-xs">
                Оновити каталог з Supabase
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Завантажує найсвіжіші товари з хмарної бази даних на вітрину
              </p>
            </div>
            <button
              type="button"
              onClick={handlePullFromCloud}
              disabled={isPulling || !configured}
              className="w-full py-2.5 px-4 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isPulling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Отримання товарів з хмари...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Підтягнути товари з хмари
                </>
              )}
            </button>
            {pullStatus && (
              <p className="text-[11px] text-slate-700 font-semibold text-center">{pullStatus}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
