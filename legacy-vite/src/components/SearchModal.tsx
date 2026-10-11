import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ShoppingBag, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useModal } from '../hooks/useModal';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, products, setSelectedProduct, addToCart, openQuickOrder } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsSearchOpen(false);
    setQuery('');
  };

  useModal(isSearchOpen, handleClose);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q) ||
        p.productType.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [products, query]);

  const popularTags = ['COSRX', 'SPF', 'Муцин', 'Beauty of Joseon', 'Тонер', 'Сироватка', 'Крем', 'Round Lab'];

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 md:pt-20 font-mono animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white max-w-2xl w-full hairline-all shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 hairline-b flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-black shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ВВЕДІТЬ НАЗВУ, БРЕНД ЧИ КАТЕГОРІЮ (НАПР. COSRX, SPF, МУЦИН)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-xs sm:text-sm font-mono uppercase text-black placeholder:text-neutral-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="w-6 h-6 text-neutral-400 hover:text-black flex items-center justify-center transition-colors"
              title="Очистити"
            >
              ✕
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-black border border-neutral-200 transition-colors shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Popular searches suggestions */}
        {!query.trim() && (
          <div className="p-5 bg-neutral-50 hairline-b">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-2">
              // ПОПУЛЯРНІ ЗАПИТИ:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-2.5 py-1 bg-white hover:bg-black hover:text-white hairline-all text-[11px] uppercase transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results list */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-2">
          {query.trim() && searchResults.length > 0 ? (
            searchResults.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  handleClose();
                }}
                className="group flex items-center gap-3 p-3 bg-white hover:bg-neutral-50 hairline-all cursor-pointer transition-colors"
              >
                <div className="w-14 h-14 bg-[#f6f6f6] shrink-0 overflow-hidden">
                  <img
                    src={product.featuredImage}
                    alt={product.title}
                    className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0 font-sans">
                  <div className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-0.5">
                    {product.vendor} // {product.productType}
                  </div>
                  <h4 className="font-medium text-xs sm:text-sm text-black uppercase line-clamp-1 group-hover:text-dune-ochre transition-colors leading-snug">
                    {product.title}
                  </h4>
                  <div className="font-mono font-bold text-xs text-black mt-1 tabular-nums">
                    {product.price.toLocaleString('uk-UA')} ₴
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="ml-2 text-[10px] text-neutral-400 line-through">
                        {product.compareAtPrice.toLocaleString('uk-UA')} ₴
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      openQuickOrder(product);
                      handleClose();
                    }}
                    className="p-2 bg-white hover:bg-neutral-100 hairline-all text-black text-[10px] font-mono uppercase font-bold"
                    title="Швидке замовлення"
                  >
                    <Zap className="w-3.5 h-3.5 text-dune-ochre fill-current" />
                  </button>
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="p-2 bg-black hover:bg-neutral-800 text-white text-[10px] font-mono uppercase font-bold"
                    title="Додати в кошик"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="text-center py-12 px-4">
              <p className="text-xs uppercase text-neutral-500 mb-2">
                За запитом "{query}" нічого не знайдено
              </p>
              <p className="text-[11px] text-neutral-400 uppercase">
                Спробуйте пошукати за брендом (COSRX, Beauty of Joseon, Round Lab) або засобом (SPF, сироватка)
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-neutral-400 uppercase">
              Введіть пошуковий запит для миттєвого пошуку товарів
            </div>
          )}
        </div>

        {/* Footer */}
        {query.trim() && searchResults.length > 0 && (
          <div className="p-3 hairline-t bg-neutral-50 text-center text-[10px] text-neutral-500 uppercase">
            Знайдено {searchResults.length} засобів за запитом "{query}"
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
