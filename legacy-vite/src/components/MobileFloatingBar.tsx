import React from 'react';
import { ShoppingBag, Phone, ArrowDown, Sparkles, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobileFloatingBar: React.FC = () => {
  const { cart, setIsCartDrawerOpen, setIsQuizOpen, setIsSearchOpen } = useStore();
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalSum = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const scrollToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 text-white backdrop-blur-lg hairline-t p-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-transform duration-300">
      <div className="flex items-center gap-1.5 max-w-lg mx-auto">
        {/* Support Phone */}
        <a
          href="tel:+380800332211"
          className="w-10 h-10 bg-neutral-900 text-white flex items-center justify-center shrink-0 border border-neutral-700 active:scale-95 transition-all"
          title="Зателефонувати менеджеру"
          aria-label="Зателефонувати менеджеру"
        >
          <Phone className="w-3.5 h-3.5 text-dune-ochre" />
        </a>

        {/* Quick Search */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-10 h-10 bg-neutral-900 text-white flex items-center justify-center shrink-0 border border-neutral-700 active:scale-95 transition-all"
          title="Пошук товарів"
          aria-label="Пошук товарів"
        >
          <Search className="w-3.5 h-3.5 text-neutral-300" />
        </button>

        {/* Skin Quiz Button */}
        <button
          type="button"
          onClick={() => setIsQuizOpen(true)}
          className="w-10 h-10 bg-neutral-900 text-white flex items-center justify-center shrink-0 border border-neutral-700 active:scale-95 transition-all"
          title="Пройти тест шкіри"
          aria-label="Пройти тест шкіри"
        >
          <Sparkles className="w-3.5 h-3.5 text-dune-ochre" />
        </button>

        {/* Action Button */}
        {totalCount > 0 ? (
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex-1 min-h-[44px] py-2 px-4 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider active:scale-[0.98] flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-dune-ochre" />
              <span>BAG [{totalCount}]</span>
            </div>

            <span className="font-bold tabular-nums">
              {totalSum.toLocaleString('uk-UA')} ₴
            </span>
          </button>
        ) : (
          <button
            onClick={scrollToCatalog}
            className="flex-1 min-h-[44px] py-2 px-4 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
          >
            <span>КАТАЛОГ ТОВАРІВ</span>
            <ArrowDown className="w-3.5 h-3.5 text-dune-ochre" />
          </button>
        )}
      </div>
    </div>
  );
};
