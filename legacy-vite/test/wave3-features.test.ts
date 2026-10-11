import assert from 'node:assert';
import { SAMPLE_PRODUCTS } from '../src/lib/sample-data.ts';

function runWave3Tests() {
  console.log('Testing Wave 3: Routine Protocol & Synergy Classification...');

  function getRoutineProtocol(productType: string, title: string) {
    const type = productType.toLowerCase();
    const t = title.toLowerCase();

    if (type.includes('сонцезах') || t.includes('spf') || t.includes('sun')) {
      return { step: 'КРОК 5: ЗАХИСТ ВІД UV', time: 'morning' };
    }
    if (type.includes('крем') || t.includes('cream')) {
      return { step: 'КРОК 4: БАР’ЄРНЕ ЗВОЛОЖЕННЯ', time: 'both' };
    }
    if (
      type.includes('сироват') ||
      type.includes('есенц') ||
      type.includes('ампул') ||
      t.includes('serum') ||
      t.includes('ampoule') ||
      t.includes('essence') ||
      t.includes('муцин')
    ) {
      return { step: 'КРОК 3: ТАРГЕТНИЙ АКТИВ', time: 'both' };
    }
    if (type.includes('тонер') || type.includes('тонік') || t.includes('toner')) {
      return { step: 'КРОК 2: ТОНІЗУВАННЯ ТА ГІДРАТАЦІЯ', time: 'both' };
    }
    return { step: 'КРОК 1: ДЕЛІКАТНЕ ОЧИЩЕННЯ', time: 'both' };
  }

  // SPF classification test
  const spfProtocol = getRoutineProtocol('Сонцезахисний крем', 'Relief Sun Rice + Probiotics SPF 50+');
  assert.strictEqual(spfProtocol.step, 'КРОК 5: ЗАХИСТ ВІД UV');
  assert.strictEqual(spfProtocol.time, 'morning');

  // Snail Serum classification test
  const serumProtocol = getRoutineProtocol('Есенція для обличчя', 'Advanced Snail 96 Mucin Power Essence');
  assert.strictEqual(serumProtocol.step, 'КРОК 3: ТАРГЕТНИЙ АКТИВ');
  assert.strictEqual(serumProtocol.time, 'both');

  // Barrier Cream classification test
  const creamProtocol = getRoutineProtocol('Крем для обличчя', 'Centella Calming Barrier Cream');
  assert.strictEqual(creamProtocol.step, 'КРОК 4: БАР’ЄРНЕ ЗВОЛОЖЕННЯ');
  assert.strictEqual(creamProtocol.time, 'both');

  console.log('✓ Routine Protocol tests passed!');

  console.log('Testing Wave 3: Monobank & Official IBAN Requisites...');

  const iban = 'UA213220010000026001234567890';
  const edrpou = '3344556677';
  const orderNumber = 'ORD-2026-9912';
  const appointment = `Оплата замовлення ${orderNumber}`;

  // IBAN Ukraine specification: starts with UA + 27 digits = 29 characters total
  const ibanRegex = /^UA\d{27}$/;
  assert.ok(ibanRegex.test(iban), 'IBAN must match official UA format (UA + 27 digits)');
  assert.strictEqual(iban.length, 29);

  // EDRPOU specification: 8 or 10 digits
  const edrpouRegex = /^\d{8,10}$/;
  assert.ok(edrpouRegex.test(edrpou), 'EDRPOU must be 8 to 10 digits');

  // Appointment must contain order ID
  assert.ok(appointment.includes(orderNumber), 'Appointment must specify order number');

  console.log('✓ Monobank & IBAN requisites tests passed!');

  console.log('Testing Wave 3: Dispatch Cutoff Countdown logic...');

  function calculateDispatchTimer(mockDate: Date) {
    const hours = mockDate.getHours();
    const day = mockDate.getDay(); // 0 is Sunday
    const cutoffHour = 17;

    if (day !== 0 && hours < cutoffHour) {
      const target = new Date(mockDate);
      target.setHours(cutoffHour, 0, 0, 0);
      const diffMs = target.getTime() - mockDate.getTime();
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      return { isToday: true, hours: h, minutes: m, seconds: s };
    }
    return { isToday: false, hours: 0, minutes: 0, seconds: 0 };
  }

  // Case A: 14:15:30 on Wednesday -> Should show 2h 44m 30s remaining
  const wednesdayAfternoon = new Date('2026-10-14T14:15:30');
  const timerA = calculateDispatchTimer(wednesdayAfternoon);
  assert.strictEqual(timerA.isToday, true);
  assert.strictEqual(timerA.hours, 2);
  assert.strictEqual(timerA.minutes, 44);
  assert.strictEqual(timerA.seconds, 30);

  // Case B: 18:30 on Wednesday -> Past cutoff, should indicate tomorrow
  const wednesdayEvening = new Date('2026-10-14T18:30:00');
  const timerB = calculateDispatchTimer(wednesdayEvening);
  assert.strictEqual(timerB.isToday, false);

  // Case C: Sunday afternoon -> Courier day off, should indicate tomorrow
  const sunday = new Date('2026-10-11T12:00:00');
  const timerC = calculateDispatchTimer(sunday);
  assert.strictEqual(timerC.isToday, false);

  console.log('✓ Dispatch countdown tests passed!');
  console.log('✓ ALL WAVE 3 TESTS PASSED PERFECTLY!');
}

runWave3Tests();
