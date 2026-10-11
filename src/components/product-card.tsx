import Image from 'next/image';
import Link from 'next/link';
import { canOptimize, formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

export function ProductCard({ product: p, priority = false }: { product: Product; priority?: boolean }) {
  const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
  return (
    <Link href={`/p/${p.handle}`} className="group block focus-visible:outline-offset-4">
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-2">
        {p.featuredImage ? (
          <Image
            src={p.featuredImage}
            alt={p.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
            priority={priority}
            unoptimized={!canOptimize(p.featuredImage)}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl text-muted" aria-hidden>M</div>
        )}
        {!p.available && <span className="absolute left-2 top-2 bg-paper px-2 py-1 text-xs">Немає в наявності</span>}
        {onSale && p.available && <span className="absolute left-2 top-2 bg-accent px-2 py-1 text-xs text-white">Знижка</span>}
      </div>
      <div className="mt-3 space-y-1">
        {p.vendor && <p className="eyebrow">{p.vendor}</p>}
        <h3 className="line-clamp-2 text-sm leading-snug">{p.title}</h3>
        <p className="text-sm font-semibold">
          {formatPrice(p.price)}
          {onSale && <s className="ml-2 font-normal text-muted">{formatPrice(p.compareAtPrice!)}</s>}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-muted">Каталог оновлюється. Нові товари з’являться найближчим часом.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}><ProductCard product={p} priority={i < 4} /></li>
      ))}
    </ul>
  );
}
