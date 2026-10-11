import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, PackageX, ChevronDown } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

const PAGE_SIZE = 12;

export interface SkinConcern {
  id: string;
  label: string;
  keywords: string[];
}

export const SKIN_CONCERNS: SkinConcern[] = [
  { id: 'all', label: 'УСІ ПОТРЕБИ', keywords: [] },
  { id: 'acne', label: '🔴 ПРОТИ АКНЕ & ПОР', keywords: ['акне', 'bha', 'чайне дерево', 'пори', 'саліцил', 'себум'] },
  { id: 'hydration', label: '💧 ЗВОЛОЖЕННЯ & БАР’ЄР', keywords: ['зволоження', 'гіалурон', 'муцин', 'бар’єр', 'суха', 'зневодн'] },
  { id: 'spf', label: '☀️ SPF ЗАХИСТ 50+', keywords: ['spf', 'сонцезах', 'уф', 'uv'] },
  { id: 'calming', label: '🌿 ЧУТЛИВІСТЬ & ЦЕНТЕЛЛА', keywords: ['центел', 'заспокоєння', 'чутлив', 'cica', 'пантенол'] },
  { id: 'brightening', label: '✨ СЯЙВО & ОСВІТЛЕННЯ', keywords: ['сяйво', 'ніацинамід', 'вітамін с', 'освітлення', 'пробіотик'] },
  { id: 'antiage', label: '⏳ ВІДНОВЛЕННЯ & ANTI-AGE', keywords: ['регенерат', 'антивік', 'пружність', 'колаген', 'пептид'] },
];

export const ProductGrid: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
  } = useStore();
  const [search, setSearch] = useState('');
  const [selectedConcern, setSelectedConcern] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'discount'>('popular');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Single O(N) pass to calculate category counts
  const { categories, categoryCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    const catList: string[] = [];

    for (const p of products) {
      const type = p.productType || 'Інше';
      if (!counts.has(type)) {
        counts.set(type, 0);
        catList.push(type);
      }
      counts.set(type, counts.get(type)! + 1);
    }

    return { categories: catList, categoryCounts: counts };
  }, [products]);

  // Filter and sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.vendor.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Filter by Brand (e.g. from brand slider or menu)
    if (selectedBrand && selectedBrand !== 'all') {
      const bLower = selectedBrand.toLowerCase().trim();
      result = result.filter(
        (p) => (p.vendor || '').toLowerCase().trim().includes(bLower) || bLower.includes((p.vendor || '').toLowerCase().trim())
      );
    }

    // Filter by Category (from menu or category buttons)
    if (selectedCategory && selectedCategory !== 'all') {
      const cLower = selectedCategory.toLowerCase().trim();
      result = result.filter((p) => {
        const typeLower = (p.productType || 'Інше').toLowerCase();
        const titleLower = p.title.toLowerCase();
        const tagMatch = p.tags.some((t) => t.toLowerCase().includes(cLower));
        return typeLower.includes(cLower) || cLower.includes(typeLower) || tagMatch || titleLower.includes(cLower);
      });
    }

    if (selectedConcern !== 'all') {
      const concernObj = SKIN_CONCERNS.find((c) => c.id === selectedConcern);
      if (concernObj) {
        result = result.filter((p) => {
          const text = `${p.title} ${(p.tags || []).join(' ')} ${p.productType || ''}`.toLowerCase();
          return concernObj.keywords.some((kw) => text.includes(kw));
        });
      }
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'discount') {
      result.sort((a, b) => {
        const discA = a.compareAtPrice ? a.compareAtPrice - a.price : 0;
        const discB = b.compareAtPrice ? b.compareAtPrice - b.price : 0;
        return discB - discA;
      });
    }

    return result;
  }, [products, search, selectedCategory, selectedBrand, selectedConcern, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  return (
    <section id="catalog-section" className="py-12 sm:py-16 bg-white hairline-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 hairline-b gap-4">
          <div>
            <div className="font-mono text-xs text-dune-ochre uppercase tracking-widest mb-1">
              // CATALOG & ARCHIVE
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-display text-black uppercase tracking-tight">
              Каталог товарів
            </h2>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider mt-1">
              ДОСТУПНО ДО ВІДПРАВКИ: {filteredProducts.length} ЗАСОБІВ
            </p>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
            <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setVisibleCount(PAGE_SIZE);
              }}
              className="bg-white hairline-all text-black text-xs font-mono font-medium uppercase px-3 py-2 outline-none focus:border-black cursor-pointer"
            >
              <option value="popular">За популярністю</option>
              <option value="price_asc">Ціна: від низької</option>
              <option value="price_desc">Ціна: від високої</option>
              <option value="discount">За розміром знижки</option>
            </select>
          </div>
        </div>

        {/* Search and Category Filter Chips */}
        <div className="space-y-4 mb-8">
          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="ПОШУК: COSRX, SPF, МУЦИН, КРЕМ, СИРОВАТКА, ЦЕНТЕЛЛА..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="w-full min-h-[44px] pl-10 pr-10 py-2 bg-white hairline-all font-mono text-xs uppercase text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-neutral-400 hover:text-black w-5 h-5 flex items-center justify-center transition-colors"
                title="Очистити пошук"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Monospace Tabs (Stiletto horizontal look) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setVisibleCount(PAGE_SIZE);
              }}
              className={`min-h-[38px] px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all active:scale-[0.98] ${
                selectedCategory === 'all'
                  ? 'bg-black text-white hairline-all'
                  : 'bg-white text-neutral-600 hover:text-black hairline-all'
              }`}
            >
              ALL // ВСІ ({products.length})
            </button>
            {categories.map((cat) => {
              const count = categoryCounts.get(cat) ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`min-h-[38px] px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all active:scale-[0.98] ${
                    selectedCategory === cat
                      ? 'bg-black text-white hairline-all'
                      : 'bg-white text-neutral-600 hover:text-black hairline-all'
                  }`}
                >
                  {cat.toUpperCase()} // ({count})
                </button>
              );
            })}
          </div>

          {/* Skincare Concern Filter Pills */}
          <div className="space-y-1.5 pt-1 hairline-t">
            {/* Active filter badges */}
            {(selectedBrand !== 'all' || (selectedCategory !== 'all' && !categories.includes(selectedCategory))) && (
              <div className="flex flex-wrap items-center gap-2 py-1">
                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">АКТИВНИЙ ФІЛЬТР:</span>
                {selectedBrand !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white font-mono text-xs font-bold uppercase">
                    БРЕНД: {selectedBrand}
                    <button
                      onClick={() => setSelectedBrand('all')}
                      className="text-dune-ochre hover:text-white ml-1 font-mono font-bold"
                      title="Скинути фільтр за брендом"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white font-mono text-xs font-bold uppercase">
                    КАТЕГОРІЯ: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-dune-ochre hover:text-white ml-1 font-mono font-bold"
                      title="Скинути фільтр за категорією"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            )}

            <div className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest flex items-center justify-between">
              <span>// ПІДБІР ЗА ПОТРЕБОЮ ШКІРИ:</span>
              {(selectedConcern !== 'all' || selectedCategory !== 'all' || selectedBrand !== 'all' || search) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setSelectedConcern('all');
                    setSearch('');
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="text-dune-ochre hover:underline uppercase text-[10px] font-bold"
                >
                  ✕ СКИНУТИ ВСІ ФІЛЬТРИ
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              {SKIN_CONCERNS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedConcern(c.id);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`min-h-[32px] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all active:scale-[0.98] ${
                    selectedConcern === c.id
                      ? 'bg-black text-white hairline-all shadow-sm'
                      : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 hairline-all'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid: Strict 2 columns on mobile, 4 on desktop (Stiletto signature) */}
        {displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white hover:bg-neutral-100 text-black font-mono font-bold text-xs uppercase tracking-widest hairline-all transition-all active:scale-95"
                >
                  <span>ЗАВАНТАЖИТИ ЩЕ (+{filteredProducts.length - visibleCount})</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white hairline-all p-8 max-w-md mx-auto">
            <PackageX className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="font-display font-bold text-black text-base uppercase mb-1">
              Нічого не знайдено
            </h3>
            <p className="font-mono text-xs text-neutral-500 uppercase mb-4">
              Спробуйте змінити фільтри або очистити пошуковий рядок
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setVisibleCount(PAGE_SIZE);
              }}
              className="px-4 py-2 bg-black text-white font-mono text-xs uppercase font-bold hover:bg-neutral-800 transition-colors"
            >
              Скинути фільтри
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
