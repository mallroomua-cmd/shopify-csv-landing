import React from 'react';
import { Truck, ShieldCheck, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  return (
    <section id="trust-section" className="py-14 sm:py-20 bg-neutral-50/50 hairline-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 hairline-b gap-4">
          <div>
            <div className="font-mono text-xs text-dune-ochre uppercase tracking-widest mb-1.5">
              // STANDARDS & SERVICE
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-display text-black uppercase tracking-tight">
              Принципи роботи
            </h2>
          </div>
          <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider max-w-md">
            Ми усунули всі бар'єри та ризики: огляд перед оплатою, оригінальна якість та щоденна відправка Новою Поштою.
          </p>
        </div>

        {/* 4 Architectural Modular Columns with Hairline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: COD Payment */}
          <div className="bg-white p-6 sm:p-7 hairline-all flex flex-col justify-between hover:border-black transition-colors group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-dune-ochre uppercase">
                  // 01. PAYMENT
                </span>
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-display font-bold text-lg text-black uppercase mb-3">
                Оплата при отриманні
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                Жодних передоплат. Оглядайте цілісність пакування у відділенні або поштоматі Нової Пошти. Розраховуйтесь карткою або готівкою тільки після повної перевірки.
              </p>
            </div>
            <div className="pt-4 mt-6 hairline-t font-mono text-[11px] text-neutral-500 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-dune-ochre" />
              <span>Безпечний розрахунок</span>
            </div>
          </div>

          {/* Card 2: Fast Delivery */}
          <div className="bg-white p-6 sm:p-7 hairline-all flex flex-col justify-between hover:border-black transition-colors group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-dune-ochre uppercase">
                  // 02. DISPATCH
                </span>
                <Truck className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-display font-bold text-lg text-black uppercase mb-3">
                Нова Пошта 1-2 дні
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                Щоденні відправлення замовлень до 18:00 зі складу в Києві. Замовлення від 2 000 ₴ доставляються повністю безкоштовно у відділення та поштомати.
              </p>
            </div>
            <div className="pt-4 mt-6 hairline-t font-mono text-[11px] text-neutral-500 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-dune-ochre" />
              <span>Швидкий трекінг ТТН</span>
            </div>
          </div>

          {/* Card 3: 100% Protection & Exchange */}
          <div className="bg-white p-6 sm:p-7 hairline-all flex flex-col justify-between hover:border-black transition-colors group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-dune-ochre uppercase">
                  // 03. PROTECTION
                </span>
                <RefreshCw className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-display font-bold text-lg text-black uppercase mb-3">
                Гарантія цілісності
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                Гарантований обмін або повернення 100% коштів у разі виробничого дефекту дозатора чи пошкодження під час доставки. Швидкий розгляд за 1–3 дні.
              </p>
            </div>
            <div className="pt-4 mt-6 hairline-t font-mono text-[11px] text-neutral-500 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-dune-ochre" />
              <span>Захист покупця 100%</span>
            </div>
          </div>

          {/* Card 4: Authentic Korean Skincare */}
          <div className="bg-white p-6 sm:p-7 hairline-all flex flex-col justify-between hover:border-black transition-colors group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-dune-ochre uppercase">
                  // 04. ORIGIN
                </span>
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-display font-bold text-lg text-black uppercase mb-3">
                100% Оригінал
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                Офіційний імпорт брендів COSRX, Beauty of Joseon, Round Lab, Skin1004. Свіжі терміни придатності, сертифікати якості та контроль температурного режиму зберігання.
              </p>
            </div>
            <div className="pt-4 mt-6 hairline-t font-mono text-[11px] text-dune-ochre uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-dune-ochre" />
              <span>Сертифікований імпорт</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
