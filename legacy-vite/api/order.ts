import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_HITS = 10;

// Strict HTML escape to prevent breaking Telegram's parse_mode: 'HTML'
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX_HITS;
}

async function postWithRetry(url: string, body: unknown, tries = 3) {
  let lastError: any;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) return r;
      lastError = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastError = e;
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(2, i)));
  }
  throw lastError;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.length && origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Забагато запитів, спробуйте пізніше' });
  }

  const o = req.body;
  if (!o || typeof o !== 'object') {
    return res.status(400).json({ error: 'Некоректний запит' });
  }

  // Honeypot & Time-Trap check: bot filled hidden "website" or submitted in under 1 second
  if (o.website) {
    return res.status(200).json({ success: true, orderId: o.orderId }); // Silently drop bot
  }
  if (typeof o.elapsedMs === 'number' && o.elapsedMs < 1000) {
    return res.status(200).json({ success: true, orderId: o.orderId }); // Silently drop instant bot
  }

  let cleanDigits = String(o.phone || '').replace(/\D/g, '');
  if (cleanDigits.length < 9 || !o.orderId) {
    return res.status(400).json({ error: 'Некоректний номер телефону або ID замовлення' });
  }

  // Normalize phone for international tel: click-to-call link
  let normalizedDial = cleanDigits;
  if (cleanDigits.startsWith('0') && cleanDigits.length === 10) {
    normalizedDial = '38' + cleanDigits;
  } else if (!cleanDigits.startsWith('380') && cleanDigits.length === 9) {
    normalizedDial = '380' + cleanDigits;
  }

  const items = (Array.isArray(o.items) ? o.items : [])
    .slice(0, 30)
    .map((i: any, idx: number) => {
      const qty = Math.min(Math.max(parseInt(i.quantity, 10) || 1, 1), 99);
      const title = esc(clip(i.product?.title || 'Товар', 100));
      const variant = i.selectedVariant ? ` (${esc(clip(i.selectedVariant, 50))})` : '';
      const price = Number(i.product?.price || 0);
      return `${idx + 1}. <b>${title}</b>${variant}\n   • ${qty} шт. × ${price} ₴ = ${(price * qty).toLocaleString('uk-UA')} ₴`;
    })
    .join('\n\n');

  const deliveryName =
    o.deliveryMethod === 'nova_poshta'
      ? '📦 Нова Пошта'
      : o.deliveryMethod === 'ukrposhta'
      ? '📫 Укрпошта'
      : '🚚 Кур’єр';

  const paymentName =
    o.paymentMethod === 'cash_on_delivery'
      ? '💵 Накладений платіж'
      : '💳 Оплата карткою';

  const promoInfo = o.promoCode
    ? `🎟 <b>Промокод:</b> <code>${esc(clip(o.promoCode, 20))}</code> (-${Number(o.discountAmount || 0).toLocaleString('uk-UA')} ₴)\n`
    : '';

  const ttnInfo = o.ttn
    ? `📮 <b>ТТН:</b> <code>${esc(clip(o.ttn, 30))}</code>\n`
    : '';

  const text =
    `🔥 <b>НОВЕ ЗАМОВЛЕННЯ #${esc(o.orderId)}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Клієнт:</b> ${esc(clip(o.name, 80)) || 'Клієнт'}\n` +
    `📞 <b>Телефон:</b> <a href="tel:+${normalizedDial}">${esc(clip(o.phone || `+${normalizedDial}`, 30))}</a>\n` +
    `📍 <b>Місто:</b> ${esc(clip(o.city, 80))}\n` +
    `🏢 <b>Відділення:</b> ${esc(clip(o.warehouse, 120)) || 'Уточнюється'}\n` +
    `🚚 <b>Доставка:</b> ${deliveryName}\n` +
    `💳 <b>Оплата:</b> ${paymentName}\n` +
    promoInfo +
    ttnInfo +
    (o.notes ? `💬 <b>Коментар:</b> <i>${esc(clip(o.notes, 300))}</i>\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🛍 <b>ТОВАРИ:</b>\n\n${items}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 <b>РАЗОМ: ${Number(o.total || 0).toLocaleString('uk-UA')} ₴</b>\n` +
    `⏰ <i>${new Date().toLocaleString('uk-UA')}</i>`;

  const botToken = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (botToken && chatId) {
    try {
      await postWithRetry(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    } catch (tgError) {
      console.error('Telegram notification error:', tgError);
      return res.status(502).json({ error: 'Помилка відправки в Telegram' });
    }
  }

  // Google Sheets Webhook with retry
  if (process.env.SHEETS_WEBHOOK_URL) {
    postWithRetry(process.env.SHEETS_WEBHOOK_URL, o, 2).catch((e) =>
      console.warn('Sheets webhook failed:', e)
    );
  }

  return res.status(200).json({ success: true, orderId: o.orderId });
}
