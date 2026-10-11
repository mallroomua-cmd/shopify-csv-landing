import { OrderDetails } from '../types';

/**
 * Strict HTML escape for Telegram's parse_mode: 'HTML'.
 * Prevents 400 Bad Request error when order notes, customer names, or product titles
 * contain reserved characters like '&', '<', '>', '"', or '\''.
 */
export const escTelegramHtml = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

export const clipText = (s: unknown, maxLen: number): string =>
  String(s ?? '').slice(0, maxLen);

/**
 * Formats the customer order details into safe HTML text for Telegram
 */
export function buildTelegramOrderMessage(order: OrderDetails): string {
  const itemsList = order.items
    .map((item, idx) => {
      const title = escTelegramHtml(clipText(item.product.title, 120));
      const variant = item.selectedVariant ? ` (${escTelegramHtml(clipText(item.selectedVariant, 60))})` : '';
      const qty = item.quantity;
      const price = item.product.price;
      const subtotal = (price * qty).toLocaleString('uk-UA');
      return `${idx + 1}. <b>${title}</b>${variant}\n   • Кількість: ${qty} шт.\n   • Ціна: ${price.toLocaleString('uk-UA')} ₴ (${subtotal} ₴)`;
    })
    .join('\n\n');

  const deliveryName =
    order.deliveryMethod === 'nova_poshta'
      ? '📦 Нова Пошта'
      : order.deliveryMethod === 'ukrposhta'
      ? '📫 Укрпошта'
      : '🚚 Кур’єр';

  const paymentName =
    order.paymentMethod === 'cash_on_delivery'
      ? '💵 Накладений платіж (при отриманні)'
      : '💳 Оплата карткою';

  const promoInfo = order.promoCode
    ? `🎟 <b>Промокод:</b> <code>${escTelegramHtml(order.promoCode)}</code> (-${(order.discountAmount || 0).toLocaleString('uk-UA')} ₴)\n`
    : '';

  const ttnInfo = order.ttn
    ? `📮 <b>ТТН:</b> <code>${escTelegramHtml(order.ttn)}</code>\n`
    : '';

  const orderNum = order.orderId ? ` #${escTelegramHtml(order.orderId)}` : '';

  return (
    `🔥 <b>НОВЕ ЗАМОВЛЕННЯ З САЙТУ${orderNum}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Клієнт:</b> ${escTelegramHtml(clipText(order.name, 100)) || 'Клієнт'}\n` +
    `📞 <b>Телефон:</b> <a href="tel:${escTelegramHtml(order.phone)}">${escTelegramHtml(order.phone)}</a>\n` +
    `📍 <b>Місто:</b> ${escTelegramHtml(clipText(order.city, 80))}\n` +
    `🏢 <b>Відділення/адреса:</b> ${escTelegramHtml(clipText(order.warehouse, 150)) || 'Уточнюється'}\n` +
    `🚚 <b>Служба доставки:</b> ${deliveryName}\n` +
    `💳 <b>Спосіб оплати:</b> ${paymentName}\n` +
    promoInfo +
    ttnInfo +
    `${order.notes ? `💬 <b>Коментар:</b> <i>${escTelegramHtml(clipText(order.notes, 500))}</i>\n` : ''}` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🛍 <b>СПИСОК ТОВАРІВ:</b>\n\n${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 <b>РАЗОМ ДО СПЛАТИ:</b> <b>${order.total.toLocaleString('uk-UA')} ₴</b>\n` +
    `⏰ <i>Час замовлення: ${new Date().toLocaleString('uk-UA')}</i>`
  );
}

/**
 * Sends order notification directly to Telegram manager bot/channel
 */
export async function sendTelegramOrderNotification(
  order: OrderDetails,
  botToken: string,
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  if (!botToken.trim() || !chatId.trim()) {
    return { success: false, error: 'Telegram Bot Token або Chat ID не налаштовані' };
  }

  const message = buildTelegramOrderMessage(order);

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || 'Помилка Telegram API' };
    }
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Мережева помилка при зверненні до Telegram';
    return { success: false, error: errorMsg };
  }
}
