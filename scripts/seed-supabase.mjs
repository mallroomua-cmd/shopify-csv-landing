// scripts/seed-supabase.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = 'https://hsjfajiwsfarwkwlttgh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzamZhaml3c2Zhcndrd2x0dGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTA2MDEsImV4cCI6MjA5MDI2NjYwMX0.n5Pw6r9rjl4nexN3CSHUH-B9zJ9yATcxEoRUmLxtwLE';

const supabase = createClient(URL, KEY);

function extractProducts(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Simple extraction: evaluate or extract array
  // Since it's TypeScript with Product type, let's parse via regex or minimal transform
  const startIdx = content.indexOf('export const SAMPLE_PRODUCTS: Product[] = [');
  if (startIdx === -1) return [];
  const arrayCode = content.slice(startIdx + 'export const SAMPLE_PRODUCTS: Product[] = '.length).trim();
  // Find matching closing bracket
  let depth = 0;
  let endIdx = 0;
  for (let i = 0; i < arrayCode.length; i++) {
    if (arrayCode[i] === '[') depth++;
    else if (arrayCode[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  const jsonLike = arrayCode.slice(0, endIdx);
  // Evaluate in sandbox safely
  const fn = new Function(`return ${jsonLike};`);
  return fn();
}

async function main() {
  console.log('--- SEEDING SUPABASE CATALOGS ---');

  // 1. MALLROOM
  const mallroomPath = path.resolve(__dirname, '../src/lib/sample-data.ts');
  const mallroomProducts = extractProducts(mallroomPath);
  console.log(`Extracted ${mallroomProducts.length} MALLROOM products`);

  const mallroomRows = mallroomProducts.map(p => ({
    id: p.id,
    store_id: 'mallroom',
    handle: p.handle || p.id,
    title: p.title,
    body_html: p.bodyHtml || '',
    vendor: p.vendor || '',
    product_type: p.productType || '',
    tags: p.tags || [],
    price: p.price || 0,
    compare_at_price: p.compareAtPrice || null,
    images: p.images || [],
    featured_image: p.featuredImage || (p.images && p.images[0]) || '',
    available: p.available ?? true,
    sku: p.sku || '',
    barcode: p.barcode || '',
    variants: p.variants || [],
    updated_at: new Date().toISOString()
  }));

  const { error: err1 } = await supabase.from('products').upsert(mallroomRows, { onConflict: 'id' });
  if (err1) {
    console.error('Error seeding MALLROOM:', err1);
  } else {
    console.log(`✓ Successfully seeded ${mallroomRows.length} MALLROOM products into Supabase!`);
  }

  // 2. DUNE
  const dunePath = path.resolve(__dirname, '../../dune-clothing-store/src/lib/sample-data.ts');
  if (fs.existsSync(dunePath)) {
    const duneProducts = extractProducts(dunePath);
    console.log(`Extracted ${duneProducts.length} DUNE products`);

    const duneRows = duneProducts.map(p => ({
      id: p.id,
      store_id: 'dune',
      handle: p.handle || p.id,
      title: p.title,
      body_html: p.bodyHtml || '',
      vendor: p.vendor || '',
      product_type: p.productType || '',
      tags: p.tags || [],
      price: p.price || 0,
      compare_at_price: p.compareAtPrice || null,
      images: p.images || [],
      featured_image: p.featuredImage || (p.images && p.images[0]) || '',
      available: p.available ?? true,
      sku: p.sku || '',
      barcode: p.barcode || '',
      variants: p.variants || [],
      updated_at: new Date().toISOString()
    }));

    const { error: err2 } = await supabase.from('products').upsert(duneRows, { onConflict: 'id' });
    if (err2) {
      console.error('Error seeding DUNE:', err2);
    } else {
      console.log(`✓ Successfully seeded ${duneRows.length} DUNE products into Supabase!`);
    }
  }

  console.log('\n--- VERIFYING PRODUCTS IN SUPABASE ---');
  const { data: mallroomCount } = await supabase.from('products').select('id', { count: 'exact' }).eq('store_id', 'mallroom');
  const { data: duneCount } = await supabase.from('products').select('id', { count: 'exact' }).eq('store_id', 'dune');

  console.log(`MALLROOM items in Supabase: ${mallroomCount?.length}`);
  console.log(`DUNE items in Supabase: ${duneCount?.length}`);
}

main().catch(console.error);
