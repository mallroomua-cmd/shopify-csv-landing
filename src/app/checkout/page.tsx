'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { lineToItem, readAttribution, track } from '@/lib/analytics';
import { formatPrice } from '@/lib/format';

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current && lines.length) {
      started.current = true;
      track('begin_checkout', lines.map(lineToItem));
    }
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Кошик порожній.</p>
        <Link href="/catalog" className="btn mt-6">До каталогу</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const payment = String(f.get('payment'));
    track('add_shipping_info', lines.map(lineToItem), { shipping_tier: 'nova_poshta' });
    track('add_payment_info', lines.map(lineToItem), { payment_type: payment });
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.get('name'),
          phone: f.get('phone'),
          email: f.get('email') || '',
          city: f.get('city'),
          warehouse: f.get('warehouse'),
          payment,
          notes: f.get('notes') || '',
          website: f.get('website') || undefined,
          items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
          attribution: readAttribution(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка');
      sessionStorage.setItem(
        'mr_last_order',
        JSON.stringify({ orderId: data.orderId, total: data.total, payment, items: data.items, phone: f.get('phone'), email: f.get('email') }),
      );
      clear();
      router.push('/dyakuyemo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 py-10 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-5" noValidate={false}>
        <h1 className="font-display text-4xl">Оформлення</h1>
        <fieldset className="space-y-4">
          <legend className="eyebrow mb-2">Контакти</legend>
          <div><label htmlFor="name" className="label">Ім’я та прізвище</label><input id="name" name="name" required minLength={2} autoComplete="name" className="field" /></div>
          <div><label htmlFor="phone" className="label">Телефон</label><input id="phone" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="0XX XXX XX XX" className="field" /></div>
          <div><label htmlFor="email" className="label">Email <span className="text-muted">(необов’язково)</span></label><input id="email" name="email" type="email" autoComplete="email" className="field" /></div>
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="eyebrow mb-2">Доставка Новою Поштою</legend>
          <div><label htmlFor="city" className="label">Місто</label><input id="city" name="city" required autoComplete="address-level2" className="field" /></div>
          <div><label htmlFor="warehouse" className="label">Відділення або поштомат</label><input id="warehouse" name="warehouse" required placeholder="Напр.: Відділення №12" className="field" /></div>
        </fieldset>
        <fieldset>
          <legend className="eyebrow mb-2">Оплата</legend>
          <label className="tap gap-3"><input type="radio" name="payment" value="cash_on_delivery" defaultChecked className="size-5 accent-ink" /> При отриманні (накладений платіж)</label>
          <label className="tap gap-3"><input type="radio" name="payment" value="iban" className="size-5 accent-ink" /> Переказ на рахунок ФОП (реквізити після замовлення)</label>
        </fieldset>
        <div><label htmlFor="notes" className="label">Коментар</label><textarea id="notes" name="notes" rows={3} maxLength={500} className="field py-2" /></div>
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        {error && <p role="alert" className="text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="btn w-full">{busy ? 'Надсилаємо…' : `Підтвердити замовлення · ${formatPrice(subtotal)}`}</button>
        <p className="text-xs text-muted">
          Натискаючи кнопку, ви погоджуєтесь з <Link href="/oferta" className="underline">офертою</Link> та <Link href="/privacy" className="underline">політикою конфіденційності</Link>.
        </p>
      </form>

      <aside className="h-fit border border-line p-5" aria-label="Ваше замовлення">
        <p className="eyebrow">Ваше замовлення</p>
        <ul className="mt-3 space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3"><span>{l.title} × {l.quantity}</span><span>{formatPrice(l.price * l.quantity)}</span></li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-line pt-3 font-semibold"><span>Разом</span><span>{formatPrice(subtotal)}</span></p>
      </aside>
    </div>
  );
}
