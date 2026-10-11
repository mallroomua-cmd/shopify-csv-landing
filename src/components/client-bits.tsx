'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './cart-provider';
import { captureAttribution, track, updateConsent, type GaItem } from '@/lib/analytics';

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="tap gap-2 pl-2 font-medium sm:px-3" aria-label={`Кошик, товарів: ${count}`}>
      Кошик
      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-ink px-1.5 text-xs text-paper">{count}</span>
    </Link>
  );
}

/** Отправляет view_item / view_item_list один раз при показе. */
export function TrackView({ event, items }: { event: 'view_item' | 'view_item_list'; items: GaItem[] }) {
  useEffect(() => {
    if (items.length) track(event, items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    captureAttribution();
    let saved: { analytics: 'granted' | 'denied'; ads: 'granted' | 'denied' } | null = null;
    try { saved = JSON.parse(localStorage.getItem('mr_consent') || 'null'); } catch {}
    if (saved) updateConsent(saved.analytics, saved.ads);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- показываем, только если выбора ещё нет
    else setOpen(true);
  }, []);
  if (!open) return null;
  const choose = (v: 'granted' | 'denied') => {
    updateConsent(v, v);
    setOpen(false);
  };
  return (
    <div role="dialog" aria-label="Налаштування cookie" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper p-4 shadow-[0_-8px_24px_rgba(0,0,0,.06)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          Ми використовуємо cookie для аналітики та реклами. <Link href="/privacy" className="underline">Детальніше</Link>
        </p>
        <div className="flex gap-2">
          <button onClick={() => choose('denied')} className="btn-ghost">Лише необхідні</button>
          <button onClick={() => choose('granted')} className="btn">Прийняти</button>
        </div>
      </div>
    </div>
  );
}
