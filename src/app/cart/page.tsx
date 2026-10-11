'use client';

import Link from 'next/link';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { lines, subtotal, setQty } = useCart();

  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="font-display text-4xl">Кошик</h1>
      {lines.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted">Кошик порожній.</p>
          <Link href="/catalog" className="btn mt-6">До каталогу</Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {lines.map((l) => (
              <li key={l.variantId} className="flex items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/p/${l.handle}`} className="hover:underline">{l.title}</Link>
                  {l.variantTitle !== 'Default Title' && <p className="text-sm text-muted">{l.variantTitle}</p>}
                  <p className="text-sm">{formatPrice(l.price)}</p>
                </div>
                <div className="flex items-center" role="group" aria-label={`Кількість: ${l.title}`}>
                  <button type="button" className="tap w-11 justify-center border border-line" onClick={() => setQty(l.variantId, l.quantity - 1)} aria-label="Зменшити">−</button>
                  <span className="w-10 text-center" aria-live="polite">{l.quantity}</span>
                  <button type="button" className="tap w-11 justify-center border border-line" onClick={() => setQty(l.variantId, l.quantity + 1)} aria-label="Збільшити">+</button>
                </div>
                <button type="button" className="tap px-2 text-sm text-muted underline" onClick={() => setQty(l.variantId, 0)}>Видалити</button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <p>Разом</p>
            <p className="text-xl font-semibold">{formatPrice(subtotal)}</p>
          </div>
          <p className="mt-1 text-sm text-muted">Доставка — за тарифами Нової Пошти.</p>
          <Link href="/checkout" className="btn mt-6 w-full">Оформити замовлення</Link>
        </>
      )}
    </div>
  );
}
