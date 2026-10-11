import assert from 'node:assert';
import { escTelegramHtml, clipText, buildTelegramOrderMessage } from '../src/lib/telegram';
import { OrderDetails } from '../src/types';

console.log('Testing Telegram message builder and HTML security...');

// 1. Test escTelegramHtml
assert.strictEqual(escTelegramHtml('Clean text'), 'Clean text');
assert.strictEqual(escTelegramHtml('Cosmetics & Skin <Glow>'), 'Cosmetics &amp; Skin &lt;Glow&gt;');
assert.strictEqual(escTelegramHtml('"Premium" / \'Organic\''), '&quot;Premium&quot; / &#39;Organic&#39;');
assert.strictEqual(escTelegramHtml(null), '');
assert.strictEqual(escTelegramHtml(undefined), '');

// 2. Test clipText
assert.strictEqual(clipText('Short', 10), 'Short');
assert.strictEqual(clipText('Very long string that exceeds limit', 8), 'Very lon');

// 3. Test buildTelegramOrderMessage with dangerous characters in inputs
const mockOrder: OrderDetails = {
  orderId: 'ORD-999&TEST',
  name: 'Олена <VIP> & Друзі',
  phone: '+380501234567',
  city: 'Київ <Центр>',
  warehouse: 'Відділення №1 & Відділення №2',
  deliveryMethod: 'nova_poshta',
  paymentMethod: 'cash_on_delivery',
  notes: 'Покладіть пробник <Крем> & зателефонуйте "після 18:00"',
  items: [
    {
      product: {
        id: 'p1',
        title: 'Сироватка з ніацинамідом & цинком 10% <Pro>',
        price: 450,
        handle: 'serum',
        bodyHtml: '',
        images: [],
        variants: [],
      },
      quantity: 2,
      selectedVariant: 'Флакон 30ml & Дозатор',
    },
  ],
  total: 900,
};

const renderedMsg = buildTelegramOrderMessage(mockOrder);

// Assert dangerous raw HTML tags are NOT present
assert.ok(!renderedMsg.includes('<VIP>'), 'Should not contain raw unescaped <VIP>');
assert.ok(!renderedMsg.includes('<Glow>'), 'Should not contain raw unescaped <Glow>');
assert.ok(!renderedMsg.includes('<Крем>'), 'Should not contain raw unescaped <Крем>');
assert.ok(!renderedMsg.includes('<Pro>'), 'Should not contain raw unescaped <Pro>');

// Assert entities are properly escaped
assert.ok(renderedMsg.includes('&amp;'), 'Should contain properly escaped &amp;');
assert.ok(renderedMsg.includes('&lt;VIP&gt;'), 'Should contain &lt;VIP&gt;');
assert.ok(renderedMsg.includes('&lt;Крем&gt;'), 'Should contain &lt;Крем&gt;');
assert.ok(renderedMsg.includes('ORD-999&amp;TEST'), 'Order ID should be escaped');
assert.ok(renderedMsg.includes('Флакон 30ml &amp; Дозатор'), 'Variant should be escaped');

// Assert key order metadata exists
assert.ok(renderedMsg.includes('900 ₴'), 'Total price should be displayed');
assert.ok(renderedMsg.includes('📦 Нова Пошта'), 'Delivery method should be displayed');
assert.ok(renderedMsg.includes('+380501234567'), 'Phone link should be present');

// 4. Test promo code and TTN rendering in Telegram
const orderWithPromoAndTtn: OrderDetails = {
  ...mockOrder,
  orderId: 'ORD-777',
  promoCode: 'GLOW15',
  discountAmount: 135,
  ttn: '20450912345678',
  total: 765,
};
const renderedWithPromo = buildTelegramOrderMessage(orderWithPromoAndTtn);
assert.ok(renderedWithPromo.includes('GLOW15'), 'Should contain promo code');
assert.ok(renderedWithPromo.includes('-135 ₴'), 'Should contain discount amount');
assert.ok(renderedWithPromo.includes('20450912345678'), 'Should contain TTN tracking number');
assert.ok(renderedWithPromo.includes('765 ₴'), 'Should contain final discounted total');

console.log('✓ All Telegram HTML security & formatting tests passed successfully!');
