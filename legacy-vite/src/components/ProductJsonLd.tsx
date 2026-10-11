import React from 'react';
import { Product } from '../types';

export const ProductJsonLd: React.FC<{ product: Product }> = ({ product }) => {
  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: (product.bodyHtml || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300) || product.title,
    sku: product.sku || product.handle,
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'Магазин',
    },
    offers: {
      '@type': 'Offer',
      url: typeof window !== 'undefined' ? `${window.location.origin}#${product.handle}` : '',
      priceCurrency: 'UAH',
      price: Math.max(product.price, 0),
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.available && product.price > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Магазин',
      },
    },
  };

  const safeJson = JSON.stringify(schema).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
};
