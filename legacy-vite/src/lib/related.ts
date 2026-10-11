import { Product } from '../types';

export const FREE_SHIPPING_THRESHOLD = 2000; // 2 000 ₴

/**
 * Returns intelligent related/cross-sell items not currently in the cart
 */
export function getRelatedProducts(baseProducts: Product[], allProducts: Product[], count = 3): Product[] {
  if (!allProducts || allProducts.length === 0) return [];
  const inCartIds = new Set(baseProducts.map((p) => p.id));
  const baseTags = new Set(baseProducts.flatMap((p) => p.tags));
  const baseTypes = new Set(baseProducts.map((p) => p.productType));

  const totalCart = baseProducts.reduce((sum, p) => sum + p.price, 0);
  const maxCrossSellPrice = Math.max(totalCart * 0.5, 400);

  return allProducts
    .filter((p) => !inCartIds.has(p.id) && p.available && p.price <= maxCrossSellPrice)
    .map((p) => {
      let score = 0;
      p.tags.forEach((t) => {
        if (baseTags.has(t)) score += 2;
      });
      if (baseTypes.has(p.productType)) score += 1;
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, count)
    .map((x) => x.product);
}

/**
 * Determines whether today's dispatch cutoff has passed (Europe/Kyiv: 16:00, not Sunday)
 */
export function getDispatchStatus(): { text: string; isToday: boolean } {
  const now = new Date();
  // Format in Europe/Kyiv
  const kyivTimeString = now.toLocaleString('en-US', { timeZone: 'Europe/Kyiv' });
  const kyivDate = new Date(kyivTimeString);
  const hours = kyivDate.getHours();
  const day = kyivDate.getDay(); // 0 is Sunday

  if (day !== 0 && hours < 16) {
    return { text: 'Відправка сьогодні до 18:00', isToday: true };
  }
  return { text: 'Відправка завтра о 12:00', isToday: false };
}
