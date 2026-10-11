import assert from 'node:assert';
import { parsePrice, parseShopifyCsv } from '../src/lib/shopify-parser.ts';
import { SAMPLE_SHOPIFY_CSV } from '../src/lib/sample-data.ts';

async function runTests() {
  console.log('Testing parsePrice...');
  assert.strictEqual(parsePrice('1299.50'), 1299.5);
  assert.strictEqual(parsePrice('1299,50'), 1299.5);
  assert.strictEqual(parsePrice('1 899 грн'), 1899);
  assert.strictEqual(parsePrice('2.499,00'), 2499);
  assert.strictEqual(parsePrice(''), 0);
  assert.strictEqual(parsePrice(undefined), 0);

  console.log('Testing parseShopifyCsv with SAMPLE_SHOPIFY_CSV...');
  const products = await parseShopifyCsv(SAMPLE_SHOPIFY_CSV);
  assert.ok(products.length > 0, 'Products should not be empty');
  console.log(`Parsed ${products.length} products from sample CSV`);

  const first = products[0];
  assert.ok(first.id, 'Product should have an id');
  assert.ok(first.title, 'Product should have a title');
  assert.ok(first.price > 0, 'Product should have price > 0');
  assert.ok(Array.isArray(first.variants), 'Product should have variants array');
  assert.ok(first.images.length > 0, 'Product should have images');

  // Verify draft products are skipped
  const csvWithDraft = `Handle,Title,Price,Status\nactive-prod,Active Prod,100,active\ndraft-prod,Draft Prod,200,draft`;
  const draftParsed = await parseShopifyCsv(csvWithDraft);
  assert.strictEqual(draftParsed.length, 1);
  assert.strictEqual(draftParsed[0].handle, 'active-prod');

  console.log('✓ All CSV parser tests passed successfully!');
}

runTests().catch((err) => {
  console.error('CSV test failure:', err);
  process.exit(1);
});
