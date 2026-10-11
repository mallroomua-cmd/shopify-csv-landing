import React from 'react';
import { Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

export const RecentlyViewed: React.FC = () => {
  const { recentlyViewed, products } = useStore();

  const recentProducts = recentlyViewed
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as typeof products;

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-10 bg-[#fafafa] hairline-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 pb-3 hairline-b">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-dune-ochre" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
              // НЕЩОДАВНО ПЕРЕГЛЯНУТІ ТОВАРИ [{recentProducts.length}]
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6">
          {recentProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
