'use client';

import type { CartLine } from './types';

type DL = Record<string, unknown>;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const push = (obj: DL) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(obj);
};

export interface GaItem {
  item_id: string;
  item_name: string;
  item_variant?: string;
  item_category?: string;
  item_brand?: string;
  price: number;
  quantity: number;
}

export const lineToItem = (l: CartLine): GaItem => ({
  item_id: l.variantId,
  item_name: l.title,
  item_variant: l.variantTitle !== 'Default Title' ? l.variantTitle : undefined,
  price: l.price,
  quantity: l.quantity,
});

export function track(event: string, items: GaItem[], extra: DL = {}) {
  const value = items.reduce((s, i) => s + i.price * i.quantity, 0);
  push({ event, ecommerce: { currency: 'UAH', value, items, ...extra } });
}

/** purchase отправляется ровно один раз на transaction_id (защита от повторного открытия страницы). */
export function trackPurchase(transactionId: string, items: GaItem[], value: number, userData?: { phone?: string; email?: string }) {
  const key = 'mr_purchases';
  let sent: string[] = [];
  try { sent = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  if (sent.includes(transactionId)) return;
  if (userData) push({ event: 'user_data', user_data: userData }); // Enhanced Conversions: GTM хеширует сам
  push({ event: 'purchase', ecommerce: { transaction_id: transactionId, currency: 'UAH', value, items } });
  try { localStorage.setItem(key, JSON.stringify([...sent, transactionId].slice(-50))); } catch {}
}

// --- Consent Mode v2 -------------------------------------------------------
export type Consent = 'granted' | 'denied';
export function updateConsent(analytics: Consent, ads: Consent) {
  window.gtag?.('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
  try { localStorage.setItem('mr_consent', JSON.stringify({ analytics, ads })); } catch {}
}

// --- Атрибуция: gclid / gbraid / wbraid / UTM на 90 дней --------------------
const ATTR_KEYS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
export function captureAttribution() {
  const q = new URLSearchParams(window.location.search);
  const found = Object.fromEntries(ATTR_KEYS.filter((k) => q.get(k)).map((k) => [k, q.get(k)!.slice(0, 200)]));
  if (Object.keys(found).length === 0) return;
  try { localStorage.setItem('mr_attr', JSON.stringify({ ...found, ts: Date.now() })); } catch {}
}
export function readAttribution(): Record<string, string> {
  try {
    const a = JSON.parse(localStorage.getItem('mr_attr') || '{}');
    if (a.ts && Date.now() - a.ts > 90 * 864e5) return {};
    delete a.ts;
    return a;
  } catch { return {}; }
}
