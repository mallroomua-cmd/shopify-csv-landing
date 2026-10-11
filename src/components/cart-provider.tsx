'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine } from '@/lib/types';
import { lineToItem, track } from '@/lib/analytics';

interface CartCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, 'quantity'>, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'mr_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- гидратация из localStorage
      if (Array.isArray(saved)) setLines(saved);
    } catch {}
  }, []);

  const persist = (next: CartLine[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  };

  const add = useCallback((line: Omit<CartLine, 'quantity'>, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.variantId === line.variantId);
      const next = i >= 0 ? prev.map((l, j) => (j === i ? { ...l, quantity: Math.min(99, l.quantity + qty) } : l)) : [...prev, { ...line, quantity: qty }];
      return persist(next);
    });
    track('add_to_cart', [lineToItem({ ...line, quantity: qty })]);
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((prev) => {
      const line = prev.find((l) => l.variantId === variantId);
      if (line && qty <= 0) track('remove_from_cart', [lineToItem(line)]);
      return persist(qty <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(99, qty) } : l)));
    });
  }, []);

  const clear = useCallback(() => setLines(persist([])), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.price * l.quantity, 0),
      add,
      setQty,
      clear,
    }),
    [lines, add, setQty, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart outside CartProvider');
  return c;
}
