import type { Product, ProductRow } from './types';

const num = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v));

export function rowToProduct(r: ProductRow): Product {
  const price = num(r.price) ?? 0;
  const images = (r.images ?? []).filter(Boolean);
  const variants = (r.variants ?? []).map((v, i) => ({
    id: v.id || `${r.id}-${i}`,
    title: v.title || 'Default Title',
    price: num(v.price) ?? price,
    compareAtPrice: num(v.compareAtPrice),
    sku: v.sku || '',
    barcode: v.barcode || '',
    available: v.available ?? r.available,
  }));
  if (variants.length === 0) {
    variants.push({ id: `${r.id}-0`, title: 'Default Title', price, compareAtPrice: num(r.compare_at_price), sku: r.sku || '', barcode: r.barcode || '', available: r.available });
  }
  return {
    id: r.id,
    handle: r.handle,
    title: r.title,
    bodyHtml: r.body_html || '',
    vendor: r.vendor || '',
    productType: r.product_type || '',
    tags: r.tags ?? [],
    price,
    compareAtPrice: num(r.compare_at_price),
    images,
    featuredImage: r.featured_image || images[0] || '',
    available: r.available,
    sku: r.sku || '',
    barcode: r.barcode || '',
    variants,
    updatedAt: r.updated_at,
  };
}

export function productToRow(p: Product): Omit<ProductRow, 'updated_at'> {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    body_html: p.bodyHtml,
    vendor: p.vendor,
    product_type: p.productType,
    tags: p.tags,
    price: p.price,
    compare_at_price: p.compareAtPrice ?? null,
    images: p.images,
    featured_image: p.featuredImage || p.images[0] || '',
    available: p.variants.some((v) => v.available),
    sku: p.sku,
    barcode: p.barcode,
    variants: p.variants,
  };
}

/** Вариант имеет смысл показывать, только если он не «Default Title». */
export const hasRealVariants = (p: Product) =>
  p.variants.length > 1 || (p.variants[0] && p.variants[0].title !== 'Default Title');
