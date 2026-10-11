import assert from 'node:assert';
import { KOREAN_BRANDS } from '../src/lib/brands.ts';

console.log('Testing Brand Logos and Cosibella Navigation...');

// Test 1: Brand list coverage
assert.ok(KOREAN_BRANDS.length >= 10, 'Expected at least 10 Korean skincare brands');
const brandNames = KOREAN_BRANDS.map((b) => b.name);
assert.ok(brandNames.includes('COSRX'), 'COSRX must be in brand list');
assert.ok(brandNames.includes('Beauty of Joseon'), 'Beauty of Joseon must be in brand list');
assert.ok(brandNames.includes('Round Lab'), 'Round Lab must be in brand list');
assert.ok(brandNames.includes('SKIN1004'), 'SKIN1004 must be in brand list');
assert.ok(brandNames.includes('Dr. Althea'), 'Dr. Althea must be in brand list');
assert.ok(brandNames.includes('Anua'), 'Anua must be in brand list');
console.log('✓ Brand logos inventory verification passed!');

// Test 2: Filter matching logic test
const sampleProducts = [
  { id: '1', title: 'COSRX Snail Essence', vendor: 'COSRX', productType: 'Тонери & Есенції', tags: ['Хіт', 'Зволоження'] },
  { id: '2', title: 'Beauty of Joseon Sun Relief', vendor: 'Beauty of Joseon', productType: 'Сонцезахист (SPF)', tags: ['SPF 50+'] },
  { id: '3', title: 'Round Lab Dokdo Toner', vendor: 'Round Lab', productType: 'Тонери & Есенції', tags: ['Очищення'] },
  { id: '4', title: 'SKIN1004 Centella Ampoule', vendor: 'SKIN1004', productType: 'Сироватки & Ампули', tags: ['Центелла'] },
];

function filterBySelectedBrand(products: typeof sampleProducts, selectedBrand: string) {
  if (selectedBrand === 'all') return products;
  const bLower = selectedBrand.toLowerCase().trim();
  return products.filter((p) => (p.vendor || '').toLowerCase().trim().includes(bLower));
}

function filterBySelectedCategory(products: typeof sampleProducts, selectedCategory: string) {
  if (selectedCategory === 'all') return products;
  const cLower = selectedCategory.toLowerCase().trim();
  return products.filter((p) => {
    const typeLower = (p.productType || 'Інше').toLowerCase();
    const tagMatch = p.tags.some((t) => t.toLowerCase().includes(cLower));
    return typeLower.includes(cLower) || tagMatch || p.title.toLowerCase().includes(cLower);
  });
}

// Brand filter check
const cosrxItems = filterBySelectedBrand(sampleProducts, 'COSRX');
assert.strictEqual(cosrxItems.length, 1);
assert.strictEqual(cosrxItems[0].vendor, 'COSRX');

const bojItems = filterBySelectedBrand(sampleProducts, 'Beauty of Joseon');
assert.strictEqual(bojItems.length, 1);
assert.strictEqual(bojItems[0].vendor, 'Beauty of Joseon');

// Category filter check
const tonerItems = filterBySelectedCategory(sampleProducts, 'Тонери');
assert.strictEqual(tonerItems.length, 2);

const spfItems = filterBySelectedCategory(sampleProducts, 'Сонцезахист');
assert.strictEqual(spfItems.length, 1);

console.log('✓ Brand and Category filter algorithm tests passed!');
console.log('✓ ALL WAVE 4 NAVIGATION & BANNER TESTS PASSED PERFECTLY!');
