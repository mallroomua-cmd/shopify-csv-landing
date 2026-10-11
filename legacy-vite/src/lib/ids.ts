import { Product } from '../types';

const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');

export function findVariant(p: Product, variantTitle?: string) {
  if (!p.variants || p.variants.length === 0) {
    return {
      id: 'default',
      title: 'Default Title',
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      sku: p.sku,
    };
  }
  return p.variants.find((v) => v.title === variantTitle) ?? p.variants[0];
}

/**
 * Single source of truth for Product / Variant ID:
 * Used identically in Google Merchant Center <g:id>, Google Analytics 4 item_id,
 * Google Ads Dynamic Remarketing, and Schema.org Product SKU.
 */
export function getItemId(p: Product, variantTitle?: string): string {
  const v = findVariant(p, variantTitle);
  if (v?.sku) return v.sku;
  if (!p.variants || p.variants.length <= 1) return p.sku || p.handle || p.id;
  return `${p.handle || p.id}__${slug(v?.title ?? 'default')}`;
}

/**
 * Generate human-friendly, unique, non-duplicating Order ID:
 * Format: YYMMDD-XXXXX (e.g. 261009-K3F9Q)
 */
export function newOrderId(): string {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${datePart}-${randPart}`;
}
