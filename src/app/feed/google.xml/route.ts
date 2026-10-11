import { getProducts } from '@/lib/catalog';
import { buildGoogleFeed } from '@/lib/seo';

// Фид для Merchant Center: те же данные и цены, что на страницах товаров.
export async function GET() {
  const xml = buildGoogleFeed(await getProducts());
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
