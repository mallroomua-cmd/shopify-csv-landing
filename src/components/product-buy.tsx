'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './cart-provider';
import { TrackView } from './client-bits';
import { formatPrice } from '@/lib/format';
import { hasRealVariants } from '@/lib/product-map';
import type { Product } from '@/lib/types';

export function ProductBuy({ product: p }: { product: Product }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState((p.variants.find((v) => v.available) ?? p.variants[0]).id);
  const [added, setAdded] = useState(false);
  const v = p.variants.find((x) => x.id === variantId) ?? p.variants[0];
  const onSale = v.compareAtPrice && v.compareAtPrice > v.price;

  const onAdd = () => {
    add({ productId: p.id, variantId: v.id, handle: p.handle, title: p.title, variantTitle: v.title, price: v.price, image: p.featuredImage });
    setAdded(true);
  };

  return (
    <div className="mt-6">
      <TrackView event="view_item" items={[{ item_id: v.id, item_name: p.title, item_category: p.productType, item_brand: p.vendor || undefined, price: v.price, quantity: 1 }]} />
      <p className="text-2xl font-semibold">
        {formatPrice(v.price)}
        {onSale && <s className="ml-3 text-lg font-normal text-muted">{formatPrice(v.compareAtPrice!)}</s>}
      </p>

      {hasRealVariants(p) && (
        <fieldset className="mt-6">
          <legend className="label">Варіант</legend>
          <div className="flex flex-wrap gap-2">
            {p.variants.map((x) => (
              <label key={x.id} className={`tap cursor-pointer border px-4 text-sm has-checked:border-ink has-checked:bg-ink has-checked:text-paper ${x.available ? 'border-line' : 'border-line text-muted line-through'}`}>
                <input type="radio" name="variant" value={x.id} checked={x.id === variantId} onChange={() => { setVariantId(x.id); setAdded(false); }} className="sr-only" disabled={!x.available} />
                {x.title}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className={`mt-4 text-sm ${v.available ? 'text-ink' : 'text-danger'}`}>{v.available ? 'В наявності' : 'Немає в наявності'}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onAdd} disabled={!v.available} className="btn flex-1 sm:flex-none">
          Додати в кошик
        </button>
        {added && <Link href="/cart" className="btn-ghost" aria-live="polite">Перейти в кошик →</Link>}
      </div>
    </div>
  );
}
