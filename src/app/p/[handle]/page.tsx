import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductBuy } from '@/components/product-buy';
import { getProduct, getProducts } from '@/lib/catalog';
import { site } from '@/lib/config';
import { canOptimize, sanitizeHtml, slugify, stripHtml } from '@/lib/format';
import { breadcrumbJsonLd, ldJson, productJsonLd } from '@/lib/seo';

export async function generateStaticParams() {
  const products = await getProducts();
  return products.length ? products.slice(0, 200).map((p) => ({ handle: p.handle })) : [{ handle: '_' }];
}

export async function generateMetadata({ params }: PageProps<'/p/[handle]'>): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) return { title: 'Товар не знайдено', robots: { index: false } };
  const description = stripHtml(p.bodyHtml).slice(0, 160) || `${p.title} — купити в ${site.name}`;
  return {
    title: p.title,
    description,
    alternates: { canonical: `/p/${p.handle}` },
    openGraph: { title: p.title, description, images: p.featuredImage ? [p.featuredImage] : undefined },
  };
}

async function ProductView({ params }: Pick<PageProps<'/p/[handle]'>, 'params'>) {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) notFound();
  const catSlug = slugify(p.productType);
  const crumbs = breadcrumbJsonLd([
    { name: 'Каталог', url: `${site.url}/catalog` },
    ...(p.productType ? [{ name: p.productType, url: `${site.url}/catalog/${catSlug}` }] : []),
    { name: p.title, url: `${site.url}/p/${p.handle}` },
  ]);
  const images = p.images.length ? p.images : p.featuredImage ? [p.featuredImage] : [];

  return (
    <article className="grid gap-10 py-10 md:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(productJsonLd(p)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbs) }} />

      <div className="space-y-3">
        {images.length === 0 && <div className="aspect-[4/5] bg-paper-2" aria-hidden />}
        {images.slice(0, 6).map((src, i) => (
          <div key={src} className="relative aspect-[4/5] bg-paper-2">
            <Image
              src={src}
              alt={i === 0 ? p.title : `${p.title} — фото ${i + 1}`}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority={i === 0}
              unoptimized={!canOptimize(src)}
            />
          </div>
        ))}
      </div>

      <div className="md:sticky md:top-24 md:self-start">
        <nav aria-label="Хлібні крихти" className="text-sm text-muted">
          <Link href="/catalog" className="underline underline-offset-4">Каталог</Link>
          {p.productType && (
            <> / <Link href={`/catalog/${catSlug}`} className="underline underline-offset-4">{p.productType}</Link></>
          )}
        </nav>
        {p.vendor && <p className="eyebrow mt-4">{p.vendor}</p>}
        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{p.title}</h1>

        <ProductBuy product={p} />

        {p.bodyHtml && (
          <section className="prose-mr mt-10 border-t border-line pt-8 text-[15px]" aria-label="Опис">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.bodyHtml) }} />
          </section>
        )}
        <ul className="mt-8 space-y-1 border-t border-line pt-6 text-sm text-muted">
          <li>Доставка Новою Поштою 1–3 дні · <Link href="/dostavka-i-oplata" className="underline">умови</Link></li>
          <li>Повернення — <Link href="/povernennya" className="underline">згідно з правилами</Link></li>
        </ul>
      </div>
    </article>
  );
}

export default function ProductPage(props: PageProps<'/p/[handle]'>) {
  return (
    <Suspense fallback={<p className="py-16 text-muted">Завантаження…</p>}>
      <ProductView params={props.params} />
    </Suspense>
  );
}
