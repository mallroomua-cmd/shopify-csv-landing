import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

interface OrderEvent {
  name: string;
  city: string;
  timeAgo: string;
  productKeyword: string;
}

const ORDER_EVENTS: OrderEvent[] = [
  { name: 'Оксана', city: 'Київ', timeAgo: '2 хв тому', productKeyword: 'centella' },
  { name: 'Анастасія', city: 'Львів', timeAgo: '5 хв тому', productKeyword: 'birch' },
  { name: 'Юлія', city: 'Одеса', timeAgo: '7 хв тому', productKeyword: 'joseon' },
  { name: 'Марина', city: 'Дніпро', timeAgo: '11 хв тому', productKeyword: 'snail' },
  { name: 'Катерина', city: 'Харків', timeAgo: '14 хв тому', productKeyword: 'cosrx' },
  { name: 'Тетяна', city: 'Вінниця', timeAgo: '18 хв тому', productKeyword: 'cream' },
];

export const LiveSocialProof: React.FC = () => {
  const { products, setSelectedProduct } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (products.length === 0 || isDismissed) return;

    // Initial delay before first popup appears (4 seconds)
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Interval to cycle through events every 16 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ORDER_EVENTS.length);
        setIsVisible(true);
      }, 800);
    }, 16000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [products.length, isDismissed]);

  if (isDismissed || products.length === 0 || !isVisible) {
    return null;
  }

  const currentEvent = ORDER_EVENTS[currentIndex];
  // Find a matching product or fallback to a featured product
  const matchingProduct: Product | undefined =
    products.find(
      (p) =>
        p.title.toLowerCase().includes(currentEvent.productKeyword) ||
        p.handle.toLowerCase().includes(currentEvent.productKeyword) ||
        p.vendor.toLowerCase().includes(currentEvent.productKeyword)
    ) || products[currentIndex % products.length];

  if (!matchingProduct) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-40 max-w-[340px] sm:max-w-sm transition-all duration-500 ease-out animate-fade-in font-mono">
      <div
        onClick={() => setSelectedProduct(matchingProduct)}
        className="bg-white/95 backdrop-blur-md hairline-all shadow-xl p-3 flex items-center gap-3 cursor-pointer hover:border-black group transition-all"
        role="alert"
        aria-live="polite"
      >
        {/* Product image */}
        <div className="relative w-12 h-12 bg-[#f6f6f6] shrink-0 overflow-hidden hairline-all">
          <img
            src={matchingProduct.featuredImage}
            alt=""
            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
          />
          <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase">
            <span className="font-bold text-black">{currentEvent.name}</span>
            <span>({currentEvent.city})</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-400">{currentEvent.timeAgo}</span>
          </div>

          <p className="text-xs font-sans font-medium text-black truncate uppercase group-hover:text-dune-ochre transition-colors mt-0.5">
            {matchingProduct.title}
          </p>

          <div className="flex items-center gap-1.5 text-[10px] text-dune-ochre font-bold uppercase mt-0.5">
            <CheckCircle2 className="w-3 h-3 text-dune-ochre" />
            <span>ПІДТВЕРДЖЕНЕ ЗАМОВЛЕННЯ</span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-black transition-colors"
          title="Приховати сповіщення"
          aria-label="Приховати сповіщення"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
