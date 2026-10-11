'use cache';

import { cacheLife, cacheTag } from 'next/cache';
import { publicClient } from './supabase';
import { rowToProduct } from './product-map';
import { slugify } from './format';
import type { Product, ProductRow } from './types';

// Все данные каталога кешируются и сбрасываются тегом 'products' (см. /api/revalidate).

export async function getProducts(): Promise<Product[]> {
  cacheTag('products');
  cacheLife('hours');
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) {
    console.error('getProducts', error.message);
    return [];
  }
  return (data as ProductRow[]).map(rowToProduct);
}

export async function getProduct(handle: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.handle === handle) ?? null;
}

export interface Category {
  slug: string;
  title: string;
  count: number;
}

export async function getCategories(): Promise<Category[]> {
  const map = new Map<string, Category>();
  for (const p of await getProducts()) {
    if (!p.productType) continue;
    const slug = slugify(p.productType);
    if (!slug) continue;
    const c = map.get(slug) ?? { slug, title: p.productType, count: 0 };
    c.count++;
    map.set(slug, c);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function getCategoryProducts(slug: string) {
  const products = await getProducts();
  const list = products.filter((p) => slugify(p.productType) === slug);
  return { title: list[0]?.productType ?? null, products: list };
}
