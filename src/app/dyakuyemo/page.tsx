'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackPurchase } from '@/lib/analytics';
import { seller } from '@/lib/config';
import { formatPrice } from '@/lib/format';

interface LastOrder {
  orderId: string;
  total: number;
  payment: string;
  phone?: string;
  email?: string;
  items: { variantId: string; title: string; variantTitle: string; price: number; quantity: number }[];
}

export default function ThanksPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    let o: LastOrder | null = null;
    try { o = JSON.parse(sessionStorage.getItem('mr_last_order') || 'null'); } catch {}
    if (!o) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- читаем результат заказа из sessionStorage
    setOrder(o);
    trackPurchase(
      o.orderId,
      o.items.map((i) => ({ item_id: i.variantId, item_name: i.title, item_variant: i.variantTitle !== 'Default Title' ? i.variantTitle : undefined, price: i.price, quantity: i.quantity })),
      o.total,
      { phone: o.phone || undefined, email: o.email || undefined },
    );
  }, []);

  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="font-display text-4xl">Дякуємо за замовлення!</h1>
      {order ? (
        <>
          <p className="mt-4">Номер замовлення: <strong>{order.orderId}</strong></p>
          <p className="text-muted">Сума: {formatPrice(order.total)}. Ми зателефонуємо для підтвердження.</p>
          {order.payment === 'iban' && (
            <div className="mt-6 border border-line p-4 text-left text-sm">
              <p className="eyebrow">Реквізити для оплати</p>
              <p className="mt-2">{seller.legalName}</p>
              <p>РНОКПП: {seller.taxId}</p>
              <p>IBAN: {seller.iban || 'надішлемо після підтвердження'}</p>
              <p>Призначення: оплата замовлення {order.orderId}</p>
            </div>
          )}
        </>
      ) : (
        <p className="mt-4 text-muted">Ми зв’яжемося з вами найближчим часом.</p>
      )}
      <Link href="/catalog" className="btn mt-8">Продовжити покупки</Link>
    </div>
  );
}
