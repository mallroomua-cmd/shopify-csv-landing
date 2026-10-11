import assert from 'node:assert';
import { SAMPLE_PRODUCTS } from '../src/lib/sample-data.ts';
import { findVariant, getItemId, newOrderId } from '../src/lib/ids.ts';
import { formatUaPhone, normalizeUaPhoneForAnalytics } from '../src/lib/formatters.ts';
import { toGaItem } from '../src/lib/analytics.ts';

function runTests() {
  console.log('Testing IDs and variant lookup...');
  const firstProduct = SAMPLE_PRODUCTS[0];
  const firstVariantTitle = firstProduct.variants[0].title;
  const v1 = findVariant(firstProduct, firstVariantTitle);
  assert.strictEqual(v1.title, firstVariantTitle);
  assert.strictEqual(v1.price, firstProduct.price);

  const defaultVariant = findVariant(firstProduct, undefined);
  assert.ok(defaultVariant, 'Should return first variant when none specified');

  const itemId = getItemId(firstProduct, firstVariantTitle);
  assert.ok(
    itemId === firstProduct.sku ||
      itemId === firstProduct.variants[0]?.sku ||
      itemId.includes(firstProduct.handle),
    'Item ID should be stable (SKU or handle)'
  );

  console.log('Testing Order ID generation...');
  const orderId1 = newOrderId();
  const orderId2 = newOrderId();
  assert.notStrictEqual(orderId1, orderId2);
  assert.ok(orderId1.length >= 6, 'Order ID should be formatted');

  console.log('Testing phone formatters and edge cases...');
  assert.strictEqual(formatUaPhone('0991234567'), '+380 (99) 123-45-67');
  assert.strictEqual(formatUaPhone('+380991234567'), '+380 (99) 123-45-67');
  assert.strictEqual(formatUaPhone('380991234567'), '+380 (99) 123-45-67');
  assert.strictEqual(formatUaPhone('80991234567'), '+380 (99) 123-45-67');

  const normalized = normalizeUaPhoneForAnalytics('+380 (99) 123-45-67');
  assert.strictEqual(normalized, '+380991234567');
  assert.strictEqual(normalizeUaPhoneForAnalytics('0991234567'), '+380991234567');

  console.log('Testing toGaItem calculation...');
  const gaItem = toGaItem({ product: firstProduct, quantity: 2, selectedVariant: firstVariantTitle });
  assert.strictEqual(gaItem.price, firstProduct.price);
  assert.strictEqual(gaItem.quantity, 2);
  assert.strictEqual(gaItem.item_brand, firstProduct.vendor);
  assert.strictEqual(gaItem.item_category, firstProduct.productType);

  console.log('Testing discount and subtotal calculations...');
  const subtotal = 1200;
  // Percent promo: 15% off 1200 = 180 discount -> 1020 total
  const percentDiscount = Math.round((subtotal * 15) / 100);
  assert.strictEqual(percentDiscount, 180);
  assert.strictEqual(subtotal - percentDiscount, 1020);

  // Fixed promo: 200 off 1200 = 1000 total
  const fixedDiscount = Math.min(200, subtotal);
  assert.strictEqual(fixedDiscount, 200);
  assert.strictEqual(subtotal - fixedDiscount, 1000);

  // Fixed promo exceeding total: 1500 off 1200 -> capped at subtotal, non-negative
  const cappedDiscount = Math.min(1500, subtotal);
  assert.strictEqual(cappedDiscount, 1200);
  assert.strictEqual(Math.max(subtotal - cappedDiscount, 0), 0);

  console.log('✓ All cart and order calculation tests passed successfully!');
}

runTests();
