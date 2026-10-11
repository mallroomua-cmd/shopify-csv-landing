import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/catalog';
import { legalPages, site } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cats] = await Promise.all([getProducts(), getCategories()]);
  return [
    { url: site.url, changeFrequency: 'daily', priority: 1 },
    { url: `${site.url}/catalog`, changeFrequency: 'daily', priority: 0.9 },
    ...cats.map((c) => ({ url: `${site.url}/catalog/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site.url}/p/${p.handle}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...legalPages.map((p) => ({ url: `${site.url}${p.href}`, changeFrequency: 'yearly' as const, priority: 0.3 })),
  ];
}
