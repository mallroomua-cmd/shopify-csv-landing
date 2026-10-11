import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const NAMES = [
  'Олена', 'Катерина', 'Анна', 'Софія', 'Марія', 'Наталія', 'Юлія',
  'Вікторія', 'Анастасія', 'Дар’я', 'Оксана', 'Ірина', 'Христина'
];

const CITIES = [
  'Києва', 'Львова', 'Одеси', 'Дніпра', 'Харкова', 'Вінниці',
  'Івано-Франківська', 'Тернополя', 'Луцька', 'Полтави', 'Рівного'
];

const TIMES = ['1 хв тому', '2 хв тому', '3 хв тому', '5 хв тому', 'щойно'];

export const SocialProofToast: React.FC = () => {
  const { products, storeSettings, setSelectedProduct } = useStore();
  const [currentOrder, setCurrentOrder] = useState<{
    name: string;
    city: string;
    product: any;
    time: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!storeSettings.socialProofEnabled || dismissed || products.length === 0) return;

    // First trigger after 7 seconds
    const initialTimer = setTimeout(() => {
      triggerNotification();
    }, 7000);

    // Then interval every 28 seconds
    const interval = setInterval(() => {
      triggerNotification();
    }, 28000);

    function triggerNotification() {
      if (dismissed) return;
      const randProd = products[Math.floor(Math.random() * products.length)];
      const randName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randCity = CITIES[Math.floor(Math.random() * CITIES.length)];
      const randTime = TIMES[Math.floor(Math.random() * TIMES.length)];

      setCurrentOrder({
        name: randName,
        city: randCity,
        product: randProd,
        time: randTime,
      });
      setIsVisible(true);

      // Auto-hide after 6 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    }

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [products, storeSettings.socialProofEnabled, dismissed]);

  if (!storeSettings.socialProofEnabled || dismissed || !isVisible || !currentOrder) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setSelectedProduct(currentOrder.product)}
      className="fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-40 max-w-[320px] bg-white hairline-all shadow-2xl p-3 flex items-center gap-3 font-mono cursor-pointer hover:border-black transition-all animate-fade-in group select-none"
    >
      <div className="relative w-12 h-12 bg-[#f6f6f6] shrink-0 overflow-hidden">
        <img
          src={currentOrder.product.featuredImage}
          alt=""
          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
        />
        <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
      </div>

      <div className="flex-1 min-w-0 font-sans">
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono uppercase tracking-wider">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span>{currentOrder.time}</span>
        </div>
        <p className="text-xs text-black font-semibold truncate leading-snug">
          {currentOrder.name} (м. {currentOrder.city})
        </p>
        <p className="text-[11px] text-neutral-600 truncate mt-0.5 group-hover:text-dune-ochre transition-colors">
          Придбано: {currentOrder.product.title}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
          setDismissed(true);
        }}
        aria-label="Закрити сповіщення"
        className="text-neutral-300 hover:text-black p-1 shrink-0 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default SocialProofToast;
