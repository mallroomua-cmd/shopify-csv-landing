import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-card';
import { getCategories, getProducts } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Каталог',
  description: 'Усі товари MALLROOM: косметика та догляд з доставкою по Україні.',
  alternates: { canonical: '/catalog' },
};

async function Catalog() {
  const [products, cats] = await Promise.all([getProducts(), getCategories()]);
  return (
    <>
      {cats.length > 0 && (
        <nav aria-label="Категорії" className="mb-8 flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link key={c.slug} href={`/catalog/${c.slug}`} className="tap border border-line px-4 text-sm hover:border-ink">
              {c.title} <span className="ml-1 text-muted">{c.count}</span>
            </Link>
          ))}
        </nav>
      )}
      <ProductGrid products={products} />
    </>
  );
}

export default function CatalogPage() {
  return (
    <div className="py-10">
      <h1 className="mb-8 font-display text-4xl">Каталог</h1>
      <Suspense fallback={<p className="text-muted">Завантаження…</p>}>
        <Catalog />
      </Suspense>
    </div>
  );
}
