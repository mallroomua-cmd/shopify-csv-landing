import Link from 'next/link';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-card';
import { getCategories, getProducts } from '@/lib/catalog';
import { site } from '@/lib/config';

async function Categories() {
  const cats = await getCategories();
  if (cats.length === 0) return null;
  return (
    <nav aria-label="Категорії" className="flex flex-wrap gap-2">
      {cats.slice(0, 10).map((c) => (
        <Link key={c.slug} href={`/catalog/${c.slug}`} className="tap border border-line px-4 text-sm hover:border-ink">
          {c.title}
        </Link>
      ))}
    </nav>
  );
}

async function NewArrivals() {
  const products = await getProducts();
  return <ProductGrid products={products.slice(0, 8)} />;
}

const perks = [
  ['Доставка 1–3 дні', 'Новою Поштою по всій Україні'],
  ['Оплата при отриманні', 'або переказом на рахунок ФОП'],
  ['Повернення', 'згідно із законом про захист прав споживачів'],
];

export default function Home() {
  return (
    <>
      <section className="py-16 text-center sm:py-24">
        <p className="eyebrow">{site.name}</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
          Догляд, який хочеться повторювати щодня
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted">{site.description}</p>
        <Link href="/catalog" className="btn mt-8">Перейти до каталогу</Link>
      </section>

      <Suspense fallback={null}>
        <Categories />
      </Suspense>

      <section className="mt-14" aria-labelledby="new-title">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="new-title" className="font-display text-3xl">Новинки</h2>
          <Link href="/catalog" className="text-sm underline underline-offset-4">Усі товари</Link>
        </div>
        <Suspense fallback={<p className="py-16 text-center text-muted">Завантаження…</p>}>
          <NewArrivals />
        </Suspense>
      </section>

      <section className="mt-20 grid gap-6 border-y border-line py-10 sm:grid-cols-3" aria-label="Переваги">
        {perks.map(([t, d]) => (
          <div key={t}>
            <p className="font-display text-xl">{t}</p>
            <p className="text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
