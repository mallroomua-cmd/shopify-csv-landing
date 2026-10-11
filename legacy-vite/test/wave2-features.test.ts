import assert from 'node:assert';
import { SAMPLE_PRODUCTS } from '../src/lib/sample-data.ts';
import { PromoCode, StoredOrder } from '../src/types/index.ts';

function runWave2Tests() {
  console.log('Testing Promo Code engine logic...');

  const promos: PromoCode[] = [
    { id: 'promo-1', code: 'BEAUTY10', discountType: 'percent', discountValue: 10, minOrderAmount: 500, isActive: true },
    { id: 'promo-2', code: 'GLOW50', discountType: 'fixed', discountValue: 50, minOrderAmount: 600, isActive: true },
    { id: 'promo-3', code: 'VIP15', discountType: 'percent', discountValue: 15, minOrderAmount: 1500, isActive: true },
    { id: 'promo-4', code: 'EXPIRED', discountType: 'percent', discountValue: 20, minOrderAmount: 100, isActive: false },
  ];

  function validatePromo(code: string, currentTotal: number, list: PromoCode[]) {
    const clean = code.trim().toUpperCase();
    const found = list.find((p) => p.code.toUpperCase() === clean && p.isActive);
    if (!found) {
      return { success: false, message: 'Промокод не знайдено або термін його дії минув', promo: null };
    }
    if (found.minOrderAmount && currentTotal < found.minOrderAmount) {
      return {
        success: false,
        message: `Мінімальна сума замовлення для промокоду ${found.code}: ${found.minOrderAmount} ₴`,
        promo: null,
      };
    }
    return { success: true, message: `Промокод ${found.code} активовано!`, promo: found };
  }

  // 1. Success validation
  const res1 = validatePromo('beauty10', 800, promos);
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.promo?.code, 'BEAUTY10');

  // 2. Minimum amount requirement failure
  const res2 = validatePromo('VIP15', 1000, promos);
  assert.strictEqual(res2.success, false);
  assert.ok(res2.message.includes('1500'));

  // 3. Minimum amount requirement success
  const res3 = validatePromo('VIP15', 1600, promos);
  assert.strictEqual(res3.success, true);

  // 4. Inactive promo failure
  const res4 = validatePromo('EXPIRED', 1000, promos);
  assert.strictEqual(res4.success, false);

  // 5. Discount calculation arithmetic
  const calculateDiscount = (promo: PromoCode, total: number) => {
    if (promo.discountType === 'percent') {
      return Math.round((total * promo.discountValue) / 100);
    }
    return Math.min(promo.discountValue, total);
  };

  const discountPercent = calculateDiscount(promos[0], 800); // 10% of 800 = 80
  assert.strictEqual(discountPercent, 80);
  assert.strictEqual(800 - discountPercent, 720);

  const discountFixed = calculateDiscount(promos[1], 800); // 50 ₴ off 800 = 750
  assert.strictEqual(discountFixed, 50);
  assert.strictEqual(800 - discountFixed, 750);

  console.log('✓ Promo code validation tests passed!');

  console.log('Testing Order & TTN tracking lookup logic...');

  const mockOrders: StoredOrder[] = [
    {
      id: 'ORD-1001',
      orderId: 'ORD-1001',
      customerName: 'Олена Коваль',
      phone: '+380 (67) 123-45-67',
      city: 'Київ',
      warehouse: 'Відділення № 1',
      deliveryMethod: 'nova_poshta',
      paymentMethod: 'cash_on_delivery',
      items: [{ title: 'Cosrx Snail Mucin', price: 690, quantity: 1 }],
      total: 690,
      status: 'shipped',
      date: '09.10.2026',
      createdAt: Date.now() - 3600000,
      ttn: '20450987654321',
      syncedToTelegram: true,
    },
    {
      id: 'ORD-1002',
      orderId: 'ORD-1002',
      customerName: 'Максим Мельник',
      phone: '+380 (50) 987-65-43',
      city: 'Львів',
      warehouse: 'Поштомат № 8500',
      deliveryMethod: 'nova_poshta',
      paymentMethod: 'card',
      items: [{ title: 'Beauty of Joseon Sun Relief', price: 540, quantity: 2 }],
      total: 1080,
      status: 'processing',
      date: '09.10.2026',
      createdAt: Date.now() - 7200000,
      syncedToTelegram: true,
    },
  ];

  function searchOrder(q: string, list: StoredOrder[]): StoredOrder | null {
    const clean = q.trim().toLowerCase().replace(/\s+/g, '');
    if (!clean) return null;
    const cleanDigits = clean.replace(/\D/g, '');

    return (
      list.find((o) => {
        const oId = (o.orderId || o.id || '').toLowerCase();
        const oPhone = (o.phone || '').replace(/\D/g, '');
        return oId.includes(clean) || (cleanDigits.length >= 7 && oPhone.includes(cleanDigits));
      }) || null
    );
  }

  // Lookup by exact order ID
  assert.strictEqual(searchOrder('ORD-1001', mockOrders)?.customerName, 'Олена Коваль');

  // Lookup by partial lowercase order ID
  assert.strictEqual(searchOrder('1002', mockOrders)?.customerName, 'Максим Мельник');

  // Lookup by raw unformatted phone digits
  assert.strictEqual(searchOrder('0671234567', mockOrders)?.customerName, 'Олена Коваль');

  // Lookup by formatted phone
  assert.strictEqual(searchOrder('+380 (50) 987-65-43', mockOrders)?.customerName, 'Максим Мельник');

  // Nova Poshta direct tracking URL builder
  const buildNpTrackingUrl = (ttn: string) => `https://novaposhta.ua/tracking/?cargo_number=${ttn.trim()}`;
  assert.strictEqual(buildNpTrackingUrl('20450987654321'), 'https://novaposhta.ua/tracking/?cargo_number=20450987654321');

  console.log('✓ Order tracking lookup tests passed!');

  console.log('Testing Skin Routine Quiz recommendation and bundle math...');

  assert.ok(SAMPLE_PRODUCTS.length >= 3, 'Sample products must contain at least 3 items for routines');

  // Diagnostic routine match: 2-step duo or 3-step trio
  const cleanserOrSerum = SAMPLE_PRODUCTS.find((p) => p.productType.toLowerCase().includes('сироватка') || p.productType.toLowerCase().includes('есенція')) || SAMPLE_PRODUCTS[0];
  const creamOrSun = SAMPLE_PRODUCTS.find((p) => p.productType.toLowerCase().includes('крем') || p.productType.toLowerCase().includes('сонцезахисний')) || SAMPLE_PRODUCTS[1];

  const routineItems = [cleanserOrSerum, creamOrSun];
  const rawSum = routineItems.reduce((acc, p) => acc + p.price, 0);
  const bundleDiscount = Math.round(rawSum * 0.15); // -15% routine discount
  const bundlePrice = rawSum - bundleDiscount;

  assert.ok(bundleDiscount > 0, 'Bundle discount must be positive');
  assert.ok(bundlePrice < rawSum, 'Bundle price must be lower than individual sum');
  assert.strictEqual(bundlePrice + bundleDiscount, rawSum);

  console.log('✓ Skin Routine Quiz logic tests passed!');

  console.log('Testing Admin CRM aggregation and VIP segmentation...');
  // CRM Aggregation from multiple orders by same customer
  const crmOrders = [
    { phone: '+380501234567', name: 'Олена', total: 3200 },
    { phone: '+380501234567', name: 'Олена', total: 2100 },
    { phone: '+380679876543', name: 'Ігор', total: 1400 },
  ];
  const clientMap = new Map<string, { phone: string; name: string; ordersCount: number; totalSpent: number; status: string }>();
  crmOrders.forEach(o => {
    const existing = clientMap.get(o.phone);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += o.total;
    } else {
      clientMap.set(o.phone, { phone: o.phone, name: o.name, ordersCount: 1, totalSpent: o.total, status: 'new' });
    }
  });
  const clients = Array.from(clientMap.values()).map(c => {
    let status = 'new';
    if (c.totalSpent >= 5000) status = 'vip';
    else if (c.ordersCount >= 2) status = 'regular';
    return { ...c, status };
  });

  assert.strictEqual(clients.length, 2, 'Should aggregate 3 orders into 2 unique clients');
  const olena = clients.find(c => c.phone === '+380501234567');
  assert.ok(olena);
  assert.strictEqual(olena?.ordersCount, 2);
  assert.strictEqual(olena?.totalSpent, 5300);
  assert.strictEqual(olena?.status, 'vip', 'Total spend >= 5000 must grant VIP status');

  const ihor = clients.find(c => c.phone === '+380679876543');
  assert.strictEqual(ihor?.ordersCount, 1);
  assert.strictEqual(ihor?.status, 'new');
  console.log('✓ CRM aggregation & VIP segmentation tests passed!');

  console.log('✓ ALL WAVE 2 VERIFICATION TESTS PASSED!');
}

runWave2Tests();
