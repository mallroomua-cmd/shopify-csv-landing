import React from 'react';
import { Star, CheckCircle2 } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  city: string;
  rating: number;
  date: string;
  topic: string;
  comment: string;
}

const REVIEWS: Review[] = [
  {
    id: '1',
    name: 'Катерина В.',
    city: 'Київ',
    rating: 5,
    date: 'Вчора о 14:20',
    topic: 'ОРИГІНАЛЬНІСТЬ ТА ЕФЕКТ',
    comment:
      'Брала есенцію COSRX з равликом та сонцезахисний крем Beauty of Joseon. 100% оригінальні флакони, свіжі терміни придатності (до 2028 року). Шкіра сяє, пори не забиває. Дуже задоволена!',
  },
  {
    id: '2',
    name: 'Марина Б.',
    city: 'Львів',
    rating: 5,
    date: '2 дні тому',
    topic: 'ЕКСПЕРТНИЙ ПІДБІР',
    comment:
      'Менеджер ввічливо допомогла підібрати догляд під мою чутливу шкіру з куперозом. Ампула Skin1004 з центеллою просто врятувала від почервоніння. Окреме дякую за швидку відправку день у день!',
  },
  {
    id: '3',
    name: 'Дмитро М.',
    city: 'Дніпро',
    rating: 5,
    date: '3 дні тому',
    topic: 'БЕЗ ПЕРЕДОПЛАТИ',
    comment:
      'Замовляв гель для вмивання та гідрофільну олію Manyo на подарунок. Жодних передплат не вимагали — оглянув упаковку у відділенні Нової Пошти і спокійно оплатив карткою. Надійний сервіс!',
  },
];

export const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews-section" className="py-14 sm:py-20 bg-neutral-50/50 hairline-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 hairline-b gap-4">
          <div>
            <div className="font-mono text-xs text-dune-ochre uppercase tracking-widest mb-1">
              // SOCIAL PROOF & FEEDBACK
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-display text-black uppercase tracking-tight">
              Відгуки клієнтів
            </h2>
          </div>
          <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider max-w-md">
            Понад 1 280 замовлень по всій Україні з середньою оцінкою 4.9 із 5 зірок.
          </p>
        </div>

        {/* Technical Metric Strip in Stiletto style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 hairline-all mb-8 bg-white divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          <div className="p-4 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-black tabular-nums">
              1 280+
            </div>
            <div className="font-mono text-[10px] sm:text-xs text-neutral-400 uppercase tracking-wider mt-1">
              ВИКОНАНИХ ЗАМОВЛЕНЬ
            </div>
          </div>

          <div className="p-4 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-dune-ochre flex items-center justify-center gap-1 tabular-nums">
              <Star className="w-4 h-4 fill-dune-ochre text-dune-ochre" />
              <span>4.9 / 5</span>
            </div>
            <div className="font-mono text-[10px] sm:text-xs text-neutral-400 uppercase tracking-wider mt-1">
              СЕРЕДНЯ ОЦІНКА
            </div>
          </div>

          <div className="p-4 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-black tabular-nums">
              99.4%
            </div>
            <div className="font-mono text-[10px] sm:text-xs text-neutral-400 uppercase tracking-wider mt-1">
              ПОЗИТИВНИХ ВІДГУКІВ
            </div>
          </div>

          <div className="p-4 sm:p-5 text-center">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-black tabular-nums">
              1–2 ДНІ
            </div>
            <div className="font-mono text-[10px] sm:text-xs text-neutral-400 uppercase tracking-wider mt-1">
              ШВИДКІСТЬ ДОСТАВКИ
            </div>
          </div>
        </div>

        {/* Reviews Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 hairline-all hover:border-black transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-dune-ochre">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400 uppercase">
                    {rev.date}
                  </span>
                </div>

                <div className="font-mono text-[10px] text-dune-ochre uppercase tracking-wider mb-2">
                  // {rev.topic}
                </div>

                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal mb-6">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 hairline-t flex items-center justify-between font-mono text-xs">
                <div>
                  <div className="font-bold text-black uppercase">{rev.name}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">{rev.city}</div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-dune-ochre uppercase border border-dune-ochre/30 px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3 text-dune-ochre" />
                  <span>VERIFIED</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
