import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, PhoneCall, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ContactWidget: React.FC = () => {
  const { storeSettings } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!storeSettings.contactWidgetEnabled) return null;

  const rawTg = storeSettings.telegramUsername || 'mallroom_ua';
  const cleanTg = rawTg.replace('@', '').trim();
  const telegramUrl = `https://t.me/${cleanTg}`;

  const rawViber = storeSettings.viberNumber || '+380800332211';
  const viberCleanDigits = rawViber.replace(/\D/g, '');
  // Universal Viber link (deep link on mobile, web bridge on desktop)
  const viberUrl = `viber://chat?number=%2B${viberCleanDigits}`;
  const viberWebFallback = `https://msng.link/vi/${viberCleanDigits}`;

  const handleViberClick = () => {
    // Open app URL first, then fallback after brief delay if blocked
    const start = Date.now();
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        window.open(viberWebFallback, '_blank');
      }
    }, 700);
  };

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 font-mono select-none"
    >
      {/* Popover Menu */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Зв'язатися з менеджером"
          className="absolute bottom-16 sm:bottom-16 right-0 w-[calc(100vw-1.5rem)] max-w-[340px] bg-white hairline-all shadow-2xl overflow-hidden animate-fade-in text-black"
        >
          {/* Header */}
          <div className="bg-black text-white p-4 hairline-b flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 bg-neutral-900 border border-[#dec400]/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#dec400]" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
              </div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                  Служба турботи MALLROOM
                </h3>
                <p className="text-[10px] text-emerald-400 font-sans font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Менеджер онлайн • відповідь за 2 хв</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Закрити меню зв'язку"
              className="text-neutral-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Options */}
          <div className="p-3.5 space-y-2 bg-[#fafafa]">
            {/* Telegram Button */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 p-3 bg-white hover:bg-neutral-50 hairline-all transition-all hover:border-[#229ED9] active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-full bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center shrink-0 group-hover:bg-[#229ED9] group-hover:text-white transition-all">
                <Send className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-black group-hover:text-[#229ED9] transition-colors">
                    Telegram
                  </span>
                  <span className="font-mono text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Швидко
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-mono">
                  @{cleanTg}
                </p>
              </div>
            </a>

            {/* Viber Button */}
            <a
              href={viberUrl}
              onClick={() => {
                handleViberClick();
                setIsOpen(false);
              }}
              className="group flex items-center gap-3 p-3 bg-white hover:bg-neutral-50 hairline-all transition-all hover:border-[#7360F2] active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-full bg-[#7360F2]/10 text-[#7360F2] flex items-center justify-center shrink-0 group-hover:bg-[#7360F2] group-hover:text-white transition-all">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-black group-hover:text-[#7360F2] transition-colors">
                    Viber
                  </span>
                  <span className="font-mono text-[9px] uppercase font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                    Чат
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-mono">
                  {rawViber}
                </p>
              </div>
            </a>

            {/* Direct Phone Call */}
            {storeSettings.phone && (
              <a
                href={`tel:${storeSettings.phone.replace(/[^\d+]/g, '')}`}
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-3 p-3 bg-white hover:bg-neutral-50 hairline-all transition-all hover:border-black active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-black flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-[#dec400] transition-all">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 font-sans">
                  <span className="font-bold text-xs text-black block">
                    Зателефонувати
                  </span>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-mono font-bold text-black">
                    {storeSettings.phone}
                  </p>
                </div>
              </a>
            )}
          </div>

          {/* Footer notice */}
          <div className="p-2.5 bg-neutral-100 hairline-t text-center font-mono text-[10px] text-neutral-500">
            {storeSettings.workingHours || 'Пн–Нд: 10:00 — 20:00'} · Допомога з вибором
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Написати нам в Telegram або Viber"
        className={`group relative inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-black hover:bg-neutral-900 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-2xl hairline-all border-[#dec400]/40 transition-all duration-300 active:scale-95 ${
          isOpen ? 'ring-2 ring-black' : ''
        }`}
      >
        {/* Pulsing online badge indicator */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>

        {/* Icon */}
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4 text-[#dec400]" />
        </div>

        {/* Text */}
        <span className="font-bold tracking-wider">
          НАПИСАТИ НАМ
        </span>

        {/* Telegram & Viber mini logos hint on desktop */}
        <div className="hidden sm:flex items-center gap-1 ml-0.5 text-neutral-400">
          <span className="text-neutral-500">//</span>
          <span className="text-[10px] text-dune-ochre">TG · VIBER</span>
        </div>
      </button>
    </div>
  );
};

export default ContactWidget;
