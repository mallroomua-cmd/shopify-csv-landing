import { Product } from '../types';

/**
 * Generates official Google Merchant Center / Google Shopping XML (RSS 2.0) feed
 * from loaded Shopify products.
 */
export function generateGoogleMerchantXml(
  products: Product[],
  siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mallroom.com.ua',
  storeName = 'MALLROOM'
): string {
  const escapeXml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const cleanHtml = (html: string) => {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const itemsXml = products
    .map((product) => {
      const title = escapeXml(product.title);
      const description = escapeXml(cleanHtml(product.bodyHtml) || product.title);
      const link = `${siteUrl}#${encodeURIComponent(product.handle)}`;
      const imageLink = escapeXml(product.featuredImage || '');
      const priceFormatted = `${product.price.toFixed(2)} UAH`;
      const brand = escapeXml(product.vendor || storeName);
      const category = escapeXml(product.productType || 'Товари');

      return `    <item>
      <g:id>${escapeXml(product.id || product.handle)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:availability>${product.available ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${priceFormatted}</g:price>
      <g:condition>new</g:condition>
      <g:brand>${brand}</g:brand>
      <g:product_type>${category}</g:product_type>
      ${product.sku ? `<g:mpn>${escapeXml(product.sku)}</g:mpn>` : ''}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(storeName)} — Товарний фід Google Merchant Center</title>
    <link>${siteUrl}</link>
    <description>Офіційний товарний фід інтернет-магазину</description>
${itemsXml}
  </channel>
</rss>`;
}

export function downloadGoogleMerchantXml(products: Product[]) {
  const xmlContent = generateGoogleMerchantXml(products);
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'google_merchant_feed.xml');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
