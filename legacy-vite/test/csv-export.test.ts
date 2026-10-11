import assert from 'node:assert';
import { SAMPLE_PRODUCTS } from '../src/lib/sample-data.ts';
import { exportProductsToShopifyCsv, parseShopifyCsv, validateCsvPreview } from '../src/lib/shopify-parser.ts';

async function runTests() {
  console.log('Testing exportProductsToShopifyCsv...');
  const csv = exportProductsToShopifyCsv(SAMPLE_PRODUCTS);
  assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Ukrainian Excel');
  assert.ok(csv.includes('Handle'), 'CSV must include Handle header');
  assert.ok(csv.includes('Title'), 'CSV must include Title header');
  assert.ok(csv.includes('Variant Price'), 'CSV must include Variant Price header');

  console.log('Testing round-trip: parse exported CSV back into products...');
  const parsedBack = await parseShopifyCsv(csv);
  assert.strictEqual(parsedBack.length, SAMPLE_PRODUCTS.length, 'Should parse back exactly the same number of products');
  assert.strictEqual(parsedBack[0].title, SAMPLE_PRODUCTS[0].title, 'First product title should match');
  assert.strictEqual(parsedBack[0].price, SAMPLE_PRODUCTS[0].price, 'First product price should match');

  console.log('Testing validateCsvPreview...');
  const preview = await validateCsvPreview(csv, 'test.csv', 1024);
  assert.strictEqual(preview.validProducts.length, SAMPLE_PRODUCTS.length);
  assert.strictEqual(preview.invalidPriceCount, 0);
  assert.ok(preview.categories.length > 0);

  console.log('✓ All CSV export and preview tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Failure:', err);
  process.exit(1);
});
