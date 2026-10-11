import { site, seller } from './config';
import { stripHtml } from './format';
import type { Product, Variant } from './types';

// Одна точка правды для фида Merchant Center и JSON-LD: цена, наличие, ссылка совпадают.

export const productUrl = (p: Product) => `${site.url}/p/${p.handle}`;

const absImage = (src: string) => (src.startsWith('http') ? src : `${site.url}${src}`);

export function offerFor(p: Product, v: Variant) {
  const onSale = v.compareAtPrice && v.compareAtPrice > v.price;
  return {
    id: v.sku || v.id,
    price: (onSale ? v.compareAtPrice! : v.price).toFixed(2),
    salePrice: onSale ? v.price.toFixed(2) : null,
    finalPrice: v.price.toFixed(2),
    availability: v.available ? 'in_stock' : 'out_of_stock',
    gtin: /^\d{8,14}$/.test(v.barcode || '') ? v.barcode! : null,
  };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function buildGoogleFeed(products: Product[]): string {
  const items = products.flatMap((p) => {
    const desc = stripHtml(p.bodyHtml).slice(0, 4900) || p.title;
    const multi = p.variants.length > 1;
    return p.variants.map((v) => {
      const o = offerFor(p, v);
      const title = multi && v.title !== 'Default Title' ? `${p.title} — ${v.title}` : p.title;
      const tags = [
        `<g:id>${esc(o.id)}</g:id>`,
        `<g:title>${esc(title.slice(0, 150))}</g:title>`,
        `<g:description>${esc(desc)}</g:description>`,
        `<g:link>${esc(productUrl(p))}</g:link>`,
        p.featuredImage && `<g:image_link>${esc(absImage(p.featuredImage))}</g:image_link>`,
        ...p.images.filter((i) => i !== p.featuredImage).slice(0, 10).map((i) => `<g:additional_image_link>${esc(absImage(i))}</g:additional_image_link>`),
        `<g:availability>${o.availability}</g:availability>`,
        `<g:price>${o.price} UAH</g:price>`,
        o.salePrice && `<g:sale_price>${o.salePrice} UAH</g:sale_price>`,
        `<g:condition>new</g:condition>`,
        p.vendor ? `<g:brand>${esc(p.vendor)}</g:brand>` : `<g:brand>${esc(site.name)}</g:brand>`,
        o.gtin ? `<g:gtin>${o.gtin}</g:gtin>` : `<g:identifier_exists>no</g:identifier_exists>`,
        v.sku && `<g:mpn>${esc(v.sku)}</g:mpn>`,
        `<g:google_product_category>469</g:google_product_category>`,
        p.productType && `<g:product_type>${esc(p.productType)}</g:product_type>`,
        multi && `<g:item_group_id>${esc(p.id)}</g:item_group_id>`,
        // shipping задаётся в настройках доставки Merchant Center (тарифы НП оплачує отримувач)
      ].filter(Boolean);
      return `<item>${tags.join('')}</item>`;
    });
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${esc(site.name)}</title><link>${site.url}</link><description>${esc(site.description)}</description>
${items.join('\n')}
</channel></rss>`;
}

export function productJsonLd(p: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: stripHtml(p.bodyHtml).slice(0, 5000) || p.title,
    image: p.images.length ? p.images.map(absImage) : undefined,
    sku: p.variants[0]?.sku || p.id,
    brand: p.vendor ? { '@type': 'Brand', name: p.vendor } : undefined,
    url: productUrl(p),
    offers: p.variants.map((v) => {
      const o = offerFor(p, v);
      return {
        '@type': 'Offer',
        sku: o.id,
        gtin: o.gtin ?? undefined,
        price: o.finalPrice,
        priceCurrency: 'UAH',
        availability: `https://schema.org/${o.availability === 'in_stock' ? 'InStock' : 'OutOfStock'}`,
        itemCondition: 'https://schema.org/NewCondition',
        url: productUrl(p),
        seller: { '@type': 'Organization', name: site.name },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'UA',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 14,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'UA' },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
            transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
          },
        },
      };
    }),
  };
}

export const organizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: site.name,
  url: site.url,
  description: site.description,
  ...(seller.email && { email: seller.email }),
  ...(seller.phone && { telephone: seller.phone }),
});

export const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
});

/** Безопасная сериализация JSON-LD в <script>. */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
