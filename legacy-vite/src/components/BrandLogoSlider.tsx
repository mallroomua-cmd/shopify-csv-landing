import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { KOREAN_BRANDS } from '../lib/brands';
export type { BrandItem } from '../lib/brands';
export { KOREAN_BRANDS };

export const BrandLogoSlider: React.FC = () => {
  const { selectedBrand, filterByBrand, setSelectedBrand } = useStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleBrandClick = (brandName: string) => {
    if (selectedBrand.toLowerCase() === brandName.toLowerCase()) {
      setSelectedBrand('all');
    } else {
      filterByBrand(brandName);
    }
  };

  return (
    <section className="bg-white border-b border-neutral-200 py-6 sm:py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header bar of Brand Slider */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#dec400] animate-ping" />
            <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-black">
              ПОПУЛЯРНІ БРЕНДИ // ОФІЦІЙНИЙ ДИСТРИБ'ЮТОР
            </h3>
            {selectedBrand !== 'all' && (
              <button
                onClick={() => setSelectedBrand('all')}
                className="text-[11px] font-mono font-semibold text-rose-600 hover:underline uppercase ml-2"
              >
                [ Скинути: {selectedBrand} ✕ ]
              </button>
            )}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-neutral-300 hover:border-black hover:bg-black hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Прокрутити вліво"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-neutral-300 hover:border-black hover:bg-black hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Прокрутити вправо"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable / Marquee container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-2 scroll-smooth"
        >
          {KOREAN_BRANDS.map((b) => {
            const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
            return (
              <button
                key={b.id}
                onClick={() => handleBrandClick(b.name)}
                className={`flex-shrink-0 group relative flex flex-col items-center justify-center min-w-[140px] sm:min-w-[170px] h-[80px] sm:h-[95px] px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer text-center ${
                  isSelected
                    ? 'bg-black text-white border-black ring-2 ring-black shadow-md'
                    : 'bg-neutral-50 hover:bg-white text-neutral-800 border-neutral-200 hover:border-black hover:shadow-sm'
                }`}
              >
                {b.badge && (
                  <span
                    className={`absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                      isSelected
                        ? 'bg-[#dec400] text-black'
                        : 'bg-black text-white group-hover:bg-[#dec400] group-hover:text-black'
                    }`}
                  >
                    {b.badge}
                  </span>
                )}

                <span
                  className={`font-display font-black text-sm sm:text-base tracking-tight uppercase transition-colors ${
                    isSelected ? 'text-[#dec400]' : 'group-hover:text-black'
                  }`}
                >
                  {b.name}
                </span>

                <span
                  className={`font-mono text-[10px] tracking-tight mt-1 transition-colors ${
                    isSelected ? 'text-neutral-300' : 'text-neutral-400 group-hover:text-neutral-600'
                  }`}
                >
                  {b.sub}
                </span>
              </button>
            );
          })}

          {/* View All Brands pill */}
          <button
            onClick={() => {
              setSelectedBrand('all');
              document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-shrink-0 flex flex-col items-center justify-center min-w-[120px] h-[80px] sm:h-[95px] px-4 py-3 rounded-lg border border-dashed border-neutral-300 hover:border-black hover:bg-neutral-100 text-neutral-600 hover:text-black transition-all cursor-pointer font-mono text-xs uppercase font-bold"
          >
            <Sparkles className="w-4 h-4 text-[#dec400] mb-1" />
            <span>ВСІ БРЕНДИ →</span>
          </button>
        </div>
      </div>
    </section>
  );
};
