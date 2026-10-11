import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-card';
import { getCategories, getCategoryProducts } from '@/lib/catalog';
import { site } from '@/lib/config';
import { breadcrumbJsonLd, ldJson } from '@/lib/seo';

export async function generateStaticParams() {
  const cats = await getCategories();
  // Пустой каталог: один плейсхолдер, чтобы сборка создала App Shell.
  return cats.length ? cats.map((c) => ({ slug: c.slug })) : [{ slug: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/catalog/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const { title } = await getCategoryProducts(slug);
  if (!title) return { title: 'Категорію не знайдено', robots: { index: false } };
  return { title, description: `${title} — купити в MALLROOM з доставкою по Україні.`, alternates: { canonical: `/catalog/${slug}` } };
}

async function Category({ params }: Pick<PageProps<'/catalog/[slug]'>, 'params'>) {
  const { slug } = await params;
  const { title, products } = await getCategoryProducts(slug);
  if (!title) notFound();
  const crumbs = breadcrumbJsonLd([
    { name: 'Головна', url: site.url },
    { name: 'Каталог', url: `${site.url}/catalog` },
    { name: title, url: `${site.url}/catalog/${slug}` },
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbs) }} />
      <nav aria-label="Хлібні крихти" className="text-sm text-muted">
        <Link href="/catalog" className="underline underline-offset-4">Каталог</Link> / {title}
      </nav>
      <h1 className="mb-8 mt-2 font-display text-4xl">{title}</h1>
      <ProductGrid products={products} />
    </>
  );
}

export default function CategoryPage(props: PageProps<'/catalog/[slug]'>) {
  return (
    <div className="py-10">
      <Suspense fallback={<p className="text-muted">Завантаження…</p>}>
        <Category params={props.params} />
      </Suspense>
    </div>
  );
}
