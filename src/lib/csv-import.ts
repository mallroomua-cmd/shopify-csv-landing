import Papa from 'papaparse';
import { slugify } from './format';
import type { Product } from './types';

// Импорт CSV в формате Shopify (Handle, Title, Body (HTML), Vendor, Type, Tags, Option1 Value…, Variant Price,
// Variant Compare At Price, Variant SKU, Variant Barcode, Variant Inventory Qty, Image Src, Status).
// Шаблон: docs/templates/products-import.csv

export function parsePrice(raw?: string): number {
  if (!raw) return 0;
  const s = raw.replace(/[\s ]/g, '').replace(/[^\d.,]/g, '');
  const decComma = s.lastIndexOf(',') > s.lastIndexOf('.');
  return parseFloat(decComma ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')) || 0;
}

export async function readCsvFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1251').decode(buf); // Excel UA
  }
}

export interface ImportResult {
  products: Product[];
  errors: string[];
}

export function parseProductsCsv(csv: string): ImportResult {
  const { data } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.replace(/^﻿/, '').trim(),
  });
  const map = new Map<string, Product>();
  const errors: string[] = [];

  data.forEach((row, i) => {
    const get = (...keys: string[]) => keys.map((k) => row[k]?.trim()).find(Boolean) ?? '';
    if (get('Status').toLowerCase() === 'archived') return;
    const handle = slugify(get('Handle')) || slugify(get('Title'));
    if (!handle) return;
    const image = get('Image Src', 'Image URL');
    let p = map.get(handle);
    if (!p) {
      const title = get('Title');
      if (!title) { errors.push(`Рядок ${i + 2}: немає Title для «${handle}»`); return; }
      p = {
        id: handle,
        handle,
        title,
        bodyHtml: get('Body (HTML)', 'Body', 'Description'),
        vendor: get('Vendor'),
        productType: get('Type', 'Product Category'),
        tags: get('Tags').split(',').map((t) => t.trim()).filter(Boolean),
        price: 0,
        images: [],
        featuredImage: '',
        available: true,
        sku: '',
        barcode: '',
        variants: [],
      };
      map.set(handle, p);
    }
    if (image && !p.images.includes(image)) p.images.push(image);

    const priceRaw = get('Variant Price', 'Price');
    if (!priceRaw) return; // строка только с картинкой
    const price = parsePrice(priceRaw);
    if (price <= 0) { errors.push(`Рядок ${i + 2}: некоректна ціна «${priceRaw}» (${p.title})`); return; }
    const compare = parsePrice(get('Variant Compare At Price', 'Compare At Price'));
    const qtyRaw = get('Variant Inventory Qty');
    const available = qtyRaw === '' ? true : parseInt(qtyRaw, 10) > 0 || get('Variant Inventory Policy').toLowerCase() === 'continue';
    const title = [get('Option1 Value'), get('Option2 Value'), get('Option3 Value')].filter(Boolean).join(' / ') || 'Default Title';
    if (p.variants.some((v) => v.title === title)) return;
    const sku = get('Variant SKU', 'SKU');
    p.variants.push({
      id: sku ? slugify(sku) || `${handle}-${p.variants.length}` : `${handle}-${p.variants.length}`,
      title,
      price,
      compareAtPrice: compare > price ? compare : undefined,
      sku,
      barcode: get('Variant Barcode').replace(/^'/, ''),
      available,
    });
  });

  const products = [...map.values()].filter((p) => {
    if (p.variants.length === 0) { errors.push(`«${p.title}»: немає жодного варіанта з ціною — пропущено`); return false; }
    const first = p.variants[0];
    p.price = Math.min(...p.variants.map((v) => v.price));
    p.compareAtPrice = first.compareAtPrice;
    p.sku = first.sku || '';
    p.barcode = first.barcode || '';
    p.available = p.variants.some((v) => v.available);
    p.featuredImage = p.images[0] || '';
    return true;
  });
  return { products, errors };
}
