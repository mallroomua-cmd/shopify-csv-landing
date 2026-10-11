import { NextResponse } from 'next/server';
import { orderInput } from '@/lib/order-schema';
import { rowToProduct } from '@/lib/product-map';
import { serviceClient } from '@/lib/supabase';
import type { ProductRow } from '@/lib/types';

// Простой лимит на инстанс. Для продакшена с трафиком — Upstash/Vercel KV (ROADMAP P1-8).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return NextResponse.json({ error: 'Забагато спроб. Спробуйте за кілька хвилин.' }, { status: 429 });

  const parsed = orderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Некоректні дані' }, { status: 400 });
  }
  const o = parsed.data;
  if (o.website) return NextResponse.json({ ok: true, orderId: 'MR-0' }); // бот

  const db = serviceClient();
  if (!db) return NextResponse.json({ error: 'Магазин тимчасово не приймає замовлення' }, { status: 503 });

  // Цены и наличие — только из БД, клиентским ценам не доверяем.
  const ids = [...new Set(o.items.map((i) => i.productId))];
  const { data, error } = await db.from('products').select('*').in('id', ids);
  if (error) return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  const products = new Map((data as ProductRow[]).map((r) => [r.id, rowToProduct(r)]));

  const items = [];
  for (const it of o.items) {
    const p = products.get(it.productId);
    const v = p?.variants.find((x) => x.id === it.variantId);
    if (!p || !v || !v.available) {
      return NextResponse.json({ error: `Товар більше недоступний: ${p?.title ?? it.productId}`, code: 'unavailable' }, { status: 409 });
    }
    items.push({ productId: p.id, variantId: v.id, sku: v.sku, title: p.title, variantTitle: v.title, price: v.price, quantity: it.quantity });
  }
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const orderId = `MR-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  const { error: insErr } = await db.from('orders').insert({
    id: crypto.randomUUID(),
    order_id: orderId,
    name: o.name,
    phone: o.phone,
    email: o.email,
    city: o.city,
    warehouse: o.warehouse,
    delivery_method: 'nova_poshta',
    payment_method: o.payment,
    items,
    total,
    notes: o.notes,
    attribution: o.attribution,
  });
  if (insErr) {
    console.error('order insert', insErr.message);
    return NextResponse.json({ error: 'Не вдалося зберегти замовлення' }, { status: 500 });
  }

  await notifyTelegram(orderId, o, items, total).catch((e) => console.error('telegram', e));

  return NextResponse.json({ ok: true, orderId, total, items });
}

async function notifyTelegram(orderId: string, o: { name: string; phone: string; city: string; warehouse: string; payment: string; notes: string }, items: { title: string; variantTitle: string; quantity: number; price: number }[], total: number) {
  const token = process.env.TG_BOT_TOKEN;
  const chat = process.env.TG_CHAT_ID;
  if (!token || !chat) return;
  const lines = items.map((i) => `• ${i.title}${i.variantTitle !== 'Default Title' ? ` (${i.variantTitle})` : ''} × ${i.quantity} = ${i.price * i.quantity} ₴`);
  const text = [
    `🛍 Замовлення ${orderId}`,
    `${o.name}, ${o.phone}`,
    `НП: ${o.city}, ${o.warehouse}`,
    `Оплата: ${o.payment === 'iban' ? 'переказ на рахунок' : 'при отриманні'}`,
    ...lines,
    `Разом: ${total} ₴`,
    o.notes && `Коментар: ${o.notes}`,
  ].filter(Boolean).join('\n');
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text }),
  });
}
