import React from 'react';
import { Phone, Mail, MapPin, Clock, Settings, ShieldCheck, Truck, RotateCcw, FileText, Sparkles, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { setIsAdminOpen, openPolicyModal, setIsQuizOpen, setIsTrackingOpen } = useStore();

  return (
    <footer className="bg-black text-[#dec400] pt-16 pb-12 hairline-t border-neutral-800 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Manifesto */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-2xl font-black font-display tracking-tight text-white uppercase">
                MALLROOM
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
                SKINCARE CONCEPT STORE // KYIV
              </span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed font-sans font-normal">
              Мультибрендовий простір оригінальної доглядової косметики з Південної Кореї та Європи. 100% перевірені формули (COSRX, Beauty of Joseon, Round Lab, Skin1004), сертифіковані партії та свіжі терміни придатності.
            </p>
            <div className="text-[11px] text-[#dec400] pt-1 font-bold">
              ★ ВІДПРАВКА СЬОГОДНІ НОВОЮ ПОШТОЮ ДО 18:00
            </div>
          </div>

          {/* Customer Care & Policies (Mistorely structure) */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white uppercase tracking-wider text-sm">
              Сервіс & Політики
            </h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button
                  onClick={() => openPolicyModal('about')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>[ 01 ] Про бренд MALLROOM</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('shipping')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-left"
                >
                  <Truck className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>[ 02 ] Умови оплати та доставки</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('refund')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>[ 03 ] Обмін та повернення (П-172)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('privacy')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>[ 04 ] Політика конфіденційності</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('terms')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>[ 05 ] Договір публічної оферти</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openPolicyModal('contacts')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-left"
                >
                  <span>[ 06 ] Контакти та реквізити ФОП</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsTrackingOpen(true)}
                  className="text-white hover:text-[#dec400] transition-colors flex items-center gap-1.5 text-left font-bold"
                >
                  <Truck className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>[ 07 ] Відстеження посилки / ТТН</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsQuizOpen(true)}
                  className="text-white hover:text-[#dec400] transition-colors flex items-center gap-1.5 text-left font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>[ 08 ] Тест шкіри & Підбір рутини (-15%)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Working hours & Logistics */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white uppercase tracking-wider text-sm">
              Логістика & Графік
            </h4>
            <div className="space-y-2 text-neutral-400">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#dec400] shrink-0 mt-0.5" />
                <span>Пн–Нд: 10:00 — 20:00 (без вихідних)</span>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed font-sans font-normal">
                Нова Пошта: щоденні відправлення о 18:00. Замовлення, прийняті до 17:00, відвантажуються день у день.
              </p>
              <div className="pt-2 text-[11px] text-neutral-500">
                Безкоштовна доставка у відділення та поштомати для всіх замовлень від <strong>2 000 ₴</strong>.
              </div>
            </div>
          </div>

          {/* Direct Contacts */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white uppercase tracking-wider text-sm">
              Контакти
            </h4>
            <ul className="space-y-2.5 text-neutral-400">
              <li>
                <a
                  href="tel:+380800332211"
                  className="flex items-center gap-2 text-white font-bold hover:text-[#dec400] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>0 (800) 33-22-11</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:care@mallroom.ua"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#dec400]" />
                  <span>care@mallroom.ua</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/mallroom_ua"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#229ED9] hover:underline"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram @mallroom_ua</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-[11px] pt-1">
                <MapPin className="w-3.5 h-3.5 text-[#dec400] shrink-0 mt-0.5" />
                <span>Київ, вул. Митрополита Василя Липківського, 16Б</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar with payment badges and sys admin */}
        <div className="hairline-t border-neutral-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© {new Date().getFullYear()} MALLROOM // SKINCARE CONCEPT STORE. ВСІ ПРАВА ЗАХИЩЕНІ.</span>
            <span className="hidden sm:inline text-neutral-700">|</span>
            <span className="text-neutral-400">100% ОРИГІНАЛ · НОВА ПОШТА · ПІСЛЯПЛАТА</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsAdminOpen(true);
                if (typeof window !== 'undefined') {
                  window.location.hash = '#admin';
                }
              }}
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <Settings className="w-3 h-3 text-[#dec400]" />
              <span>SYS ADMIN</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
