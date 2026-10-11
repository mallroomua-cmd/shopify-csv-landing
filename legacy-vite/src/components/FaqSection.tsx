import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Як правильно підібрати засоби під свій тип та стан шкіри?',
    answer:
      'Рекомендуємо скористатися нашим інтерактивним тестом «Підбір догляду» у шапці сайту або написати нашому консультанту у Telegram чи Viber. Ми враховуємо тип шкіри (жирна, комбінована, суха, чутлива), поточний стан ліпідного бар’єра та сумісність активів (ретиноїди, AHA/BHA кислоти, вітамін С, ніацинамід).',
  },
  {
    question: 'Чи вся продукція на 100% оригінальна та сертифікована?',
    answer:
      'Так, ми співпрацюємо виключно з офіційними імпортерами та виробниками корейської косметики (COSRX, Beauty of Joseon, Round Lab, Skin1004). Усі партії мають заводське маркування, актуальні терміни придатності (2027–2028 рр.) та сертифікати відповідності.',
  },
  {
    question: 'Які терміни та умови доставки Новою Поштою?',
    answer:
      'Усі замовлення, оформлені до 17:00, відправляються день у день. Термін доставки по Україні зазвичай становить 1–2 дні. Ви можете обрати доставку до будь-якого відділення, поштомату або кур’єром за адресою.',
  },
  {
    question: 'Як отримати безкоштовну доставку та як діють промокоди?',
    answer:
      'Безкоштовна доставка активується автоматично при сумі замовлення від 2 000 ₴ (поточний поріг відображається у прогрес-барі кошика). Промокоди зі знижками можна ввести у спеціальне поле у боковому кошику або на етапі чек-ауту — сума перераховується миттєво.',
  },
  {
    question: 'Чи можу я оглянути товар у відділенні перед оплатою?',
    answer:
      'Звісно! Ми відправляємо замовлення післяплатою (накладеним платежем) без жодної обов’язкової передоплати. Ви маєте повне право перевірити цілісність пакування, терміни придатності та вміст посилки безпосередньо у відділенні Нової Пошти.',
  },
  {
    question: 'Що робити, якщо засіб не підійшов або пошкодився під час перевезення?',
    answer:
      'Згідно з чинним законодавством України та правилами нашого магазину, якщо товар має виробничий брак або був пошкоджений перевізником, ми негайно здійснюємо безкоштовну заміну або повне повернення коштів протягом 1–3 робочих днів.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { setIsQuizOpen } = useStore();

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  // Schema.org FAQPage Microdata for Google SEO Rich Snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="bg-white hairline-b py-12 sm:py-16 overflow-hidden">
      {/* Schema.org FAQ Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 font-mono text-[10px] uppercase font-bold tracking-widest text-neutral-600 hairline-all">
            <HelpCircle className="w-3.5 h-3.5 text-dune-ochre" />
            <span>ЧАСТІ ЗАПИТАННЯ // FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-black uppercase tracking-tight">
            Все, що потрібно знати про замовлення
          </h2>
          <p className="text-xs text-neutral-500 max-w-lg mx-auto font-sans">
            Прозорі умови сервісу, оригінальність продукції та правила доставки по всій Україні.
          </p>
        </div>

        {/* Accordions */}
        <div className="divide-y divide-neutral-200 hairline-all bg-neutral-50/40">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  onClick={() => toggleItem(idx)}
                  className="w-full py-4 sm:py-5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 group focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-black group-hover:text-neutral-600 transition-colors">
                    {faq.question}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-neutral-300 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-black text-white border-black' : 'text-neutral-500'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs text-neutral-600 font-sans leading-relaxed animate-fade-in border-t border-neutral-100">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Quiz Callout */}
        <div className="mt-8 p-5 bg-neutral-900 text-white hairline-all flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-dune-ochre/20 text-dune-ochre flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-dune-ochre" />
            </div>
            <div>
              <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-white">
                Не впевнені, з чого почати догляд?
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Пройдіть 3 швидкі питання та отримайте перевірений протокол для вашого типу шкіри.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsQuizOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-dune-ochre hover:bg-[#ebd500] text-black font-mono font-bold text-xs uppercase tracking-widest transition-all shrink-0 active:scale-95"
          >
            ПІДІБРАТИ ДОГЛЯД
          </button>
        </div>
      </div>
    </section>
  );
};
