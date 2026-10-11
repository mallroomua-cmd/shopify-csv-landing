'use client';

import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { parseProductsCsv, readCsvFile } from '@/lib/csv-import';
import { formatPrice, slugify } from '@/lib/format';
import { productToRow, rowToProduct } from '@/lib/product-map';
import { browserClient } from '@/lib/supabase';
import type { Product, ProductRow, Variant } from '@/lib/types';

const db = browserClient();

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!db) return;
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !session) return;
    db.rpc('is_admin').then(({ data }) => setIsAdmin(Boolean(data)));
  }, [session]);

  if (!db) return <p className="py-10">Supabase не налаштовано (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).</p>;
  if (!session) return <Login />;
  if (isAdmin === null) return <p className="py-10">Перевірка доступу…</p>;
  if (!isAdmin) {
    return (
      <div className="py-10">
        <p>Обліковий запис {session.user.email} не має прав адміністратора.</p>
        <button className="btn-ghost mt-4" onClick={() => db.auth.signOut()}>Вийти</button>
      </div>
    );
  }
  return <Dashboard session={session} />;
}

function Login() {
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await db!.auth.signInWithPassword({ email: String(f.get('email')), password: String(f.get('password')) });
    if (error) setError('Невірний email або пароль');
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 py-16">
      <h1 className="font-display text-3xl">Вхід в адмінку</h1>
      <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" required className="field" autoComplete="username" /></div>
      <div><label htmlFor="password" className="label">Пароль</label><input id="password" name="password" type="password" required className="field" autoComplete="current-password" /></div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <button className="btn w-full">Увійти</button>
    </form>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await db!.from('products').select('*').order('created_at', { ascending: false });
    if (error) setMsg(error.message);
    else setProducts((data as ProductRow[]).map(rowToProduct));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- первичная загрузка
  useEffect(() => { load(); }, [load]);

  const revalidate = () =>
    fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });

  async function save(list: Product[]) {
    const { error } = await db!.from('products').upsert(list.map(productToRow), { onConflict: 'id' });
    if (error) { setMsg(`Помилка: ${error.message}`); return false; }
    await revalidate();
    await load();
    setMsg(`Збережено: ${list.length}`);
    return true;
  }

  async function remove(p: Product) {
    if (!confirm(`Видалити «${p.title}»?`)) return;
    const { error } = await db!.from('products').delete().eq('id', p.id);
    if (error) setMsg(error.message);
    else { await revalidate(); await load(); setMsg('Видалено'); }
  }

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="tablist">
          <button role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'btn' : 'btn-ghost'} onClick={() => setTab('products')}>Товари ({products.length})</button>
          <button role="tab" aria-selected={tab === 'orders'} className={tab === 'orders' ? 'btn' : 'btn-ghost'} onClick={() => setTab('orders')}>Замовлення</button>
        </div>
        <button className="text-sm underline" onClick={() => db!.auth.signOut()}>Вийти ({session.user.email})</button>
      </div>
      {msg && <p role="status" className="mt-4 bg-paper-2 p-3 text-sm">{msg}</p>}

      {tab === 'orders' ? <Orders /> : editing ? (
        <ProductForm initial={editing} onCancel={() => setEditing(null)} onSave={async (p) => { if (await save([p])) setEditing(null); }} />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn" onClick={() => setEditing(blankProduct())}>+ Новий товар</button>
            <CsvImport onImport={save} existing={products} />
          </div>
          <table className="mt-6 w-full text-left text-sm">
            <thead><tr className="border-b border-line"><th className="py-2">Товар</th><th>Ціна</th><th>Наявність</th><th /></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-line">
                  <td className="py-2"><a href={`/p/${p.handle}`} target="_blank" className="underline">{p.title}</a><div className="text-xs text-muted">{p.productType} · {p.variants.length} вар.</div></td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.available ? 'так' : 'ні'}</td>
                  <td className="space-x-3 text-right"><button className="underline" onClick={() => setEditing(p)}>Змінити</button><button className="text-danger underline" onClick={() => remove(p)}>Видалити</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

const blankProduct = (): Product => ({
  id: '', handle: '', title: '', bodyHtml: '', vendor: '', productType: '', tags: [], price: 0, images: [], featuredImage: '',
  available: true, sku: '', barcode: '', variants: [{ id: '', title: 'Default Title', price: 0, available: true, sku: '', barcode: '' }],
});

function CsvImport({ onImport, existing }: { onImport: (p: Product[]) => Promise<boolean>; existing: Product[] }) {
  const [preview, setPreview] = useState<ReturnType<typeof parseProductsCsv> | null>(null);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(parseProductsCsv(await readCsvFile(file)));
    e.target.value = '';
  }
  const existingIds = new Set(existing.map((p) => p.id));
  return (
    <>
      <label className="btn-ghost cursor-pointer">Імпорт CSV<input type="file" accept=".csv,text/csv" onChange={pick} className="sr-only" /></label>
      {preview && (
        <div className="w-full border border-line p-4 text-sm">
          <p><b>{preview.products.length}</b> товарів: нових {preview.products.filter((p) => !existingIds.has(p.id)).length}, оновиться {preview.products.filter((p) => existingIds.has(p.id)).length}</p>
          {preview.errors.length > 0 && <ul className="mt-2 max-h-40 list-disc overflow-auto pl-5 text-danger">{preview.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          <div className="mt-3 flex gap-2">
            <button className="btn" disabled={!preview.products.length} onClick={async () => { if (await onImport(preview.products)) setPreview(null); }}>Імпортувати</button>
            <button className="btn-ghost" onClick={() => setPreview(null)}>Скасувати</button>
          </div>
        </div>
      )}
    </>
  );
}

function ProductForm({ initial, onSave, onCancel }: { initial: Product; onSave: (p: Product) => void; onCancel: () => void }) {
  const [p, setP] = useState<Product>(initial);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const setVar = (i: number, patch: Partial<Variant>) => setP((x) => ({ ...x, variants: x.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    setUploading(true);
    const urls: string[] = [];
    for (const f of files) {
      const path = `${slugify(p.handle || p.title) || 'item'}/${Date.now()}-${slugify(f.name.replace(/\.\w+$/, ''))}.${f.name.split('.').pop()}`;
      const { error } = await db!.storage.from('product-images').upload(path, f, { cacheControl: '31536000', contentType: f.type });
      if (!error) urls.push(db!.storage.from('product-images').getPublicUrl(path).data.publicUrl);
    }
    setP((x) => ({ ...x, images: [...x.images, ...urls] }));
    setUploading(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const handle = slugify(p.handle || p.title);
    const variants = p.variants.map((v, i) => ({ ...v, id: v.id || `${handle}-${i}`, price: Number(v.price), compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined }));
    onSave({
      ...p, id: p.id || handle, handle, variants,
      price: Math.min(...variants.map((v) => v.price)),
      compareAtPrice: variants[0].compareAtPrice,
      sku: variants[0].sku || '', barcode: variants[0].barcode || '',
      available: variants.some((v) => v.available), featuredImage: p.images[0] || '',
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 grid max-w-3xl gap-4">
      <div><label className="label" htmlFor="t">Назва</label><input id="t" required className="field" value={p.title} onChange={(e) => set('title', e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className="label" htmlFor="h">URL (slug)</label><input id="h" className="field" value={p.handle} placeholder="авто з назви" onChange={(e) => set('handle', e.target.value)} disabled={Boolean(initial.id)} /></div>
        <div><label className="label" htmlFor="ty">Категорія</label><input id="ty" className="field" value={p.productType} onChange={(e) => set('productType', e.target.value)} /></div>
        <div><label className="label" htmlFor="vd">Бренд</label><input id="vd" className="field" value={p.vendor} onChange={(e) => set('vendor', e.target.value)} /></div>
      </div>
      <div><label className="label" htmlFor="d">Опис (HTML)</label><textarea id="d" rows={6} className="field py-2" value={p.bodyHtml} onChange={(e) => set('bodyHtml', e.target.value)} /></div>

      <fieldset className="border border-line p-3">
        <legend className="label px-1">Варіанти (назва «Default Title» = без варіантів)</legend>
        {p.variants.map((v, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 border-b border-line py-2 sm:grid-cols-6">
            <input aria-label="Назва варіанта" className="field sm:col-span-2" value={v.title} onChange={(e) => setVar(i, { title: e.target.value })} />
            <input aria-label="Ціна" type="number" min={1} step="0.01" required className="field" value={v.price || ''} placeholder="Ціна" onChange={(e) => setVar(i, { price: Number(e.target.value) })} />
            <input aria-label="Стара ціна" type="number" min={0} step="0.01" className="field" value={v.compareAtPrice ?? ''} placeholder="Стара ціна" onChange={(e) => setVar(i, { compareAtPrice: e.target.value ? Number(e.target.value) : undefined })} />
            <input aria-label="Штрихкод EAN" className="field" value={v.barcode ?? ''} placeholder="EAN" onChange={(e) => setVar(i, { barcode: e.target.value })} />
            <label className="tap gap-2 text-sm"><input type="checkbox" checked={v.available} onChange={(e) => setVar(i, { available: e.target.checked })} /> є</label>
          </div>
        ))}
        <button type="button" className="mt-2 text-sm underline" onClick={() => set('variants', [...p.variants, { id: '', title: '', price: p.variants[0]?.price ?? 0, available: true }])}>+ варіант</button>
      </fieldset>

      <fieldset className="border border-line p-3">
        <legend className="label px-1">Фото (перше — головне)</legend>
        <ul className="flex flex-wrap gap-2">
          {p.images.map((src) => (
            <li key={src} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-20 object-cover" />
              <button type="button" aria-label="Прибрати фото" className="absolute right-0 top-0 bg-paper px-1" onClick={() => set('images', p.images.filter((x) => x !== src))}>×</button>
            </li>
          ))}
        </ul>
        <label className="btn-ghost mt-3 cursor-pointer">{uploading ? 'Завантаження…' : 'Додати фото'}<input type="file" accept="image/*" multiple onChange={upload} className="sr-only" /></label>
      </fieldset>

      <div className="flex gap-3"><button className="btn" disabled={uploading}>Зберегти</button><button type="button" className="btn-ghost" onClick={onCancel}>Скасувати</button></div>
    </form>
  );
}

interface OrderRow { id: string; order_id: string; name: string; phone: string; city: string; warehouse: string; total: number; status: string; payment_method: string; created_at: string; items: { title: string; quantity: number }[] }
const STATUSES = ['new', 'confirmed', 'shipped', 'completed', 'cancelled'];

function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const load = useCallback(() => db!.from('orders').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => setOrders((data as OrderRow[]) ?? [])), []);
   
  useEffect(() => { load(); }, [load]);
  return (
    <ul className="mt-6 space-y-3">
      {orders.length === 0 && <li className="text-muted">Замовлень ще немає.</li>}
      {orders.map((o) => (
        <li key={o.id} className="border border-line p-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <b>{o.order_id}</b><span>{new Date(o.created_at).toLocaleString('uk-UA')}</span>
          </div>
          <p>{o.name}, <a href={`tel:${o.phone}`} className="underline">{o.phone}</a> · {o.city}, {o.warehouse}</p>
          <p className="text-muted">{o.items.map((i) => `${i.title} × ${i.quantity}`).join('; ')} · {formatPrice(Number(o.total))} · {o.payment_method === 'iban' ? 'IBAN' : 'накладений'}</p>
          <select aria-label="Статус" className="field mt-2 max-w-48" value={o.status} onChange={async (e) => { await db!.from('orders').update({ status: e.target.value }).eq('id', o.id); load(); }}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}
