import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product } from '../types';

export const STORE_ID = 'mallroom';

const STORAGE_KEY_URL = 'mallroom_supabase_url';
const STORAGE_KEY_KEY = 'mallroom_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

  const localUrl = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null)?.trim() || '';
  const localKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null)?.trim() || '';

  return {
    url: envUrl || localUrl,
    anonKey: envKey || localKey,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }
  if (cleanKey) {
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
  cachedClient = null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export interface DbProductRow {
  id: string;
  store_id: string;
  handle: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[] | string;
  price: number;
  compare_at_price: number | null;
  images: string[] | string;
  featured_image: string;
  available: boolean;
  sku: string;
  barcode: string;
  variants: Product['variants'];
  created_at?: string;
  updated_at?: string;
}

function parseJsonArray<T>(val: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [val as unknown as T];
    }
  }
  return fallback;
}

export function rowToProduct(row: DbProductRow): Product {
  const tags = parseJsonArray<string>(row.tags);
  const images = parseJsonArray<string>(row.images);
  const variants = parseJsonArray<Product['variants'][number]>(row.variants, [
    {
      id: `var-${row.handle || row.id}-0`,
      title: 'Default Title',
      price: Number(row.price) || 0,
      compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
      sku: row.sku || '',
    },
  ]);

  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    bodyHtml: row.body_html || '',
    vendor: row.vendor || 'MALLROOM',
    productType: row.product_type || 'Косметика',
    tags,
    price: Number(row.price) || 0,
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    images: images.length > 0 ? images : row.featured_image ? [row.featured_image] : [],
    featuredImage: row.featured_image || (images.length > 0 ? images[0] : ''),
    available: row.available ?? true,
    sku: row.sku || '',
    barcode: row.barcode || '',
    variants,
  };
}

export function productToRow(product: Product, storeId: string = STORE_ID): DbProductRow {
  return {
    id: product.id,
    store_id: storeId,
    handle: product.handle,
    title: product.title,
    body_html: product.bodyHtml || '',
    vendor: product.vendor || 'MALLROOM',
    product_type: product.productType || '',
    tags: product.tags || [],
    price: Number(product.price) || 0,
    compare_at_price: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    images: product.images || [],
    featured_image: product.featuredImage || (product.images?.[0] ?? ''),
    available: product.available ?? true,
    sku: product.sku || '',
    barcode: product.barcode || '',
    variants: product.variants || [],
    updated_at: new Date().toISOString(),
  };
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; count?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase URL або Anon Key не вказані' };
  }

  try {
    const { data, count, error } = await client
      .from('products')
      .select('id', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      return { success: false, message: `Помилка запиту: ${error.message} (код: ${error.code})` };
    }

    return {
      success: true,
      message: 'Зʼєднання успішне! Таблиця "products" знайдена та доступна.',
      count: count ?? data?.length ?? 0,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Мережева помилка: ${errorMsg}` };
  }
}

export async function fetchProductsFromSupabase(storeId: string = STORE_ID): Promise<Product[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[Supabase] Помилка завантаження товарів для store_id="${storeId}":`, error);
    throw error;
  }

  return (data as DbProductRow[]).map(rowToProduct);
}

export async function saveProductToSupabase(product: Product, storeId: string = STORE_ID): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const row = productToRow(product, storeId);
  const { error } = await client.from('products').upsert(row, { onConflict: 'id' });

  if (error) {
    console.error(`[Supabase] Помилка збереження товару "${product.id}":`, error);
    throw error;
  }
}

export async function deleteProductFromSupabase(productId: string, storeId: string = STORE_ID): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', storeId);

  if (error) {
    console.error(`[Supabase] Помилка видалення товару "${productId}":`, error);
    throw error;
  }
}

export async function bulkSyncProductsToSupabase(
  products: Product[],
  storeId: string = STORE_ID
): Promise<{ success: number; failed: number }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');

  let successCount = 0;
  let failedCount = 0;

  const CHUNK_SIZE = 40;
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const rows = chunk.map((p) => productToRow(p, storeId));

    const { error } = await client.from('products').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error(`[Supabase] Помилка пакетного завантаження товарів:`, error);
      failedCount += chunk.length;
    } else {
      successCount += chunk.length;
    }
  }

  return { success: successCount, failed: failedCount };
}

/**
 * Uploads an image File directly to Supabase Storage bucket 'product-images'
 * and returns the permanent public URL.
 */
export async function uploadProductImage(file: File, folder = STORE_ID): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase не налаштовано. Вкажіть Supabase URL та Anon Key');
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${folder}/${Date.now()}_${cleanBaseName}.${fileExt}`;

  const { error: uploadError } = await client.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '31536000',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (uploadError) {
    console.error('[Supabase Storage] Помилка завантаження фото:', uploadError);
    throw new Error(`Помилка завантаження в Supabase Storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = client.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
