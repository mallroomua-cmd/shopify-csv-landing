import React, { useState, useMemo } from 'react';
import { ArrowRight, ArrowLeft, Check, RefreshCw, ShoppingBag, Zap, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { useModal } from '../hooks/useModal';

interface QuizState {
  skinType: string;
  concern: string;
  depth: '2-step' | '3-step';
}

export const RoutineQuizModal: React.FC = () => {
  const {
    isQuizOpen,
    setIsQuizOpen,
    products,
    addToCart,
    openQuickOrder,
    addToast,
    setIsCartDrawerOpen,
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [answers, setAnswers] = useState<QuizState>({
    skinType: 'combo',
    concern: 'pores',
    depth: '3-step',
  });

  const handleClose = () => {
    setIsQuizOpen(false);
    setTimeout(() => setStep(1), 300);
  };

  useModal(isQuizOpen, handleClose);

  // Recommendations generator matching real products in the catalog
  const recommendedRoutine = useMemo(() => {
    if (!products.length) return [];

    const getMatching = (types: string[], keywords: string[]): Product => {
      const match = products.find((p) => {
        const typeMatch = types.some((t) => (p.productType || '').toLowerCase().includes(t.toLowerCase()));
        const fullText = `${p.title} ${(p.tags || []).join(' ')} ${p.bodyHtml}`.toLowerCase();
        const kwMatch = keywords.some((k) => fullText.includes(k.toLowerCase()));
        return typeMatch && kwMatch;
      });
      if (match) return match;

      // Fallback: match by type
      const fallbackType = products.find((p) =>
        types.some((t) => (p.productType || '').toLowerCase().includes(t.toLowerCase()))
      );
      if (fallbackType) return fallbackType;

      // Absolute fallback: pick another product
      return products[Math.floor(Math.random() * products.length)];
    };

    const routine: { stepName: string; stepNumber: string; product: Product; role: string }[] = [];

    // Step 1: Cleanser or Toner
    if (answers.depth === '3-step') {
      const cleanser = getMatching(
        ['Пінка', 'Гель', 'Тонер', 'Очищення', 'Cleanser', 'Toner'],
        answers.concern === 'pores' ? ['bha', 'чайне', 'tea tree', 'dokdo', 'пори'] : ['centella', 'гіалурон', 'рис']
      );
      if (cleanser) {
        routine.push({
          stepNumber: '01',
          stepName: 'М’яке очищення & Тонізація',
          product: cleanser,
          role: 'Підготовка епідермісу та відновлення фізіологічного pH балансу',
        });
      }
    }

    // Step 2: Active Serum / Essence (Core Treatment)
    let serumKeywords = ['ніацинамід', 'муцин', 'centella'];
    if (answers.concern === 'pores') serumKeywords = ['ніацинамід', 'цинк', 'bha', 'salicylic'];
    if (answers.concern === 'hydration') serumKeywords = ['гіалурон', 'муцин', 'snail', 'hyaluron'];
    if (answers.concern === 'glow') serumKeywords = ['вітамін', 'ніацинамід', 'рис', 'сяйво', 'пробіотик'];
    if (answers.concern === 'calm') serumKeywords = ['центелла', 'centella', 'cica', 'panthenol', 'пантенол'];
    if (answers.concern === 'antiage') serumKeywords = ['пептид', 'муцин', 'колаген', 'retinol'];

    const serum = getMatching(['Сироватка', 'Ампула', 'Есенція', 'Serum', 'Ampoule', 'Essence'], serumKeywords);
    if (serum) {
      routine.push({
        stepNumber: answers.depth === '3-step' ? '02' : '01',
        stepName: 'Цільовий активний догляд',
        product: serum,
        role: 'Концентрована формула для вирішення вашої головної естетичної задачі',
      });
    }

    // Step 3: Barrier Cream or Sunscreen (Protection / Moisture)
    let creamKeywords = ['крем', 'cream', 'spf'];
    if (answers.skinType === 'oily') creamKeywords = ['гель', 'gel', 'легкий', 'матуючий'];
    if (answers.skinType === 'dry') creamKeywords = ['живильний', 'бар’єр', 'кераміди', 'зволожуючий'];
    if (answers.concern === 'calm') creamKeywords = ['centella', 'заспокійливий', 'пантенол'];

    const cream = getMatching(['Крем', 'Емульсія', 'Сонцезахисний', 'Cream', 'SPF'], creamKeywords);
    if (cream && cream.id !== serum?.id) {
      routine.push({
        stepNumber: answers.depth === '3-step' ? '03' : '02',
        stepName: 'Захисний бар’єр & Зволоження',
        product: cream,
        role: 'Утримання вологи всередині клітин та захист ліпідної мантії',
      });
    }

    return routine;
  }, [products, answers]);

  const routineSubtotal = recommendedRoutine.reduce((sum, item) => sum + item.product.price, 0);
  const bundleDiscount = Math.round(routineSubtotal * 0.1); // 10% bundle discount
  const routineFinalPrice = routineSubtotal - bundleDiscount;

  const handleAddBundleToCart = () => {
    recommendedRoutine.forEach((item) => {
      addToCart(item.product, 1);
    });
    addToast(`Усі ${recommendedRoutine.length} засоби додано до кошика! Знижка 10% врахована.`, 'success');
    handleClose();
    setTimeout(() => setIsCartDrawerOpen(true), 350);
  };

  if (!isQuizOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 md:p-6 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white max-w-2xl w-full hairline-all flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 hairline-b flex items-center justify-between bg-neutral-50/80 sticky top-0 z-20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-dune-ochre animate-pulse" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-black">
              // ДІАГНОСТИКА ШКІРИ • ПІДБІР СЕТУ
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 font-mono text-neutral-400 hover:text-black flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Quiz Steps Body */}
        <div className="p-5 sm:p-8 flex-1">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-dune-ochre font-bold tracking-widest uppercase">
                  КРОК 1 З 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display text-black uppercase tracking-tight">
                  Який ваш тип шкіри?
                </h2>
                <p className="text-xs text-neutral-500 font-sans">
                  Виберіть варіант, який найточніше описує стан вашої шкіри протягом дня:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {[
                  {
                    id: 'combo',
                    label: 'Комбінована',
                    desc: 'Жирна T-зона (лоб, ніс, підборіддя), нормальні або сухі щоки',
                    icon: '🧴',
                  },
                  {
                    id: 'oily',
                    label: 'Жирна / Схильна до висипань',
                    desc: 'Виражений блиск, розширені пори, періодичні запалення',
                    icon: '✨',
                  },
                  {
                    id: 'dry',
                    label: 'Суха / Зневоднена',
                    desc: 'Відчуття стягнутості після вмивання, тьмяність, лущення',
                    icon: '💧',
                  },
                  {
                    id: 'sensitive',
                    label: 'Чутлива / Реактивна',
                    desc: 'Схильність до почервонінь, купероз, реакція на косметику',
                    icon: '🌸',
                  },
                  {
                    id: 'normal',
                    label: 'Нормальна',
                    desc: 'Збалансована шкіра без вираженого блиску чи сухості',
                    icon: '🌿',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, skinType: opt.id }));
                      setStep(2);
                    }}
                    className={`p-4 text-left hairline-all transition-all flex flex-col justify-between gap-2 hover:bg-neutral-50 active:scale-[0.98] ${
                      answers.skinType === opt.id ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{opt.icon}</span>
                      {answers.skinType === opt.id && <Check className="w-4 h-4 text-dune-ochre" />}
                    </div>
                    <div>
                      <div className="font-bold uppercase text-xs tracking-wider mb-1">{opt.label}</div>
                      <div className={`text-[11px] font-sans leading-relaxed ${answers.skinType === opt.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-dune-ochre font-bold tracking-widest uppercase">
                  КРОК 2 З 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display text-black uppercase tracking-tight">
                  Ваша головна естетична мета?
                </h2>
                <p className="text-xs text-neutral-500 font-sans">
                  На чому має сфокусуватися активна фаза щоденного корейського догляду:
                </p>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  {
                    id: 'pores',
                    title: 'Звуження пор та боротьба з недосконалостями',
                    actives: 'Саліцилова кислота (BHA), Ніацинамід, Цинк',
                    icon: '🎯',
                  },
                  {
                    id: 'hydration',
                    title: 'Глибоке наповнення вологою та пружність',
                    actives: 'Фільтрат муцину равлика, 8 видів гіалуронової к-ти',
                    icon: '💧',
                  },
                  {
                    id: 'glow',
                    title: 'Рівний тон, сяйво та освітлення постакне',
                    actives: 'Екстракт рису, Пробіотики, Арбутин',
                    icon: '🌟',
                  },
                  {
                    id: 'calm',
                    title: 'Відновлення ліпідного бар’єра та заспокоєння',
                    actives: 'Мадагаскарська центелла, Пантенол, Кераміди',
                    icon: '🛡️',
                  },
                  {
                    id: 'antiage',
                    title: 'Підтримка пружності та зменшення перших зморшок',
                    actives: 'Пептидні комплекси, Рослинний колаген',
                    icon: '⏳',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, concern: opt.id }));
                      setStep(3);
                    }}
                    className={`w-full p-4 text-left hairline-all transition-all flex items-center justify-between gap-4 hover:bg-neutral-50 active:scale-[0.98] ${
                      answers.concern === opt.id ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <div className="font-bold uppercase text-xs tracking-wider">{opt.title}</div>
                        <div className={`text-[11px] font-sans mt-0.5 ${answers.concern === opt.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          Ключові активи: <strong className={answers.concern === opt.id ? 'text-dune-ochre' : 'text-black'}>{opt.actives}</strong>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-500 hover:text-black uppercase"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Назад до типу шкіри</span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-dune-ochre font-bold tracking-widest uppercase">
                  КРОК 3 З 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display text-black uppercase tracking-tight">
                  Формат догляду, що вам підходить
                </h2>
                <p className="text-xs text-neutral-500 font-sans">
                  Оберіть комфортний рівень щоденної рутини:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <button
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, depth: '3-step' }));
                    setStep(4);
                  }}
                  className={`p-5 text-left hairline-all transition-all flex flex-col justify-between gap-4 hover:bg-neutral-50 active:scale-[0.98] ${
                    answers.depth === '3-step' ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-dune-ochre text-black font-bold text-[10px] uppercase mb-2">
                      РЕКОМЕНДОВАНО
                    </span>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-1">
                      Повний 3-етапний сет
                    </h3>
                    <p className={`text-xs font-sans leading-relaxed ${answers.depth === '3-step' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Очищення/Тонер + Активна сироватка + Бар’єрний крем зі SPF. Комплексний протокол за корейськими дерматологічними стандартами.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/50">
                    <span className="font-bold text-dune-ochre">3 ЗАСОБИ (-10%)</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, depth: '2-step' }));
                    setStep(4);
                  }}
                  className={`p-5 text-left hairline-all transition-all flex flex-col justify-between gap-4 hover:bg-neutral-50 active:scale-[0.98] ${
                    answers.depth === '2-step' ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-neutral-200 text-neutral-800 font-bold text-[10px] uppercase mb-2">
                      ЕКСПРЕС
                    </span>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-1">
                      Мінімалістичний дует
                    </h3>
                    <p className={`text-xs font-sans leading-relaxed ${answers.depth === '2-step' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Тільки цільова активна сироватка та зволожуючий крем. Ідеально для тих, хто цінує швидкість без зайвих кроків.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/50">
                    <span className="font-bold text-dune-ochre">2 ЗАСОБИ (-10%)</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-500 hover:text-black uppercase"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Назад до цілі догляду</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RESULTS & TAILORED BUNDLE */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="text-center space-y-2 pb-2 hairline-b">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] uppercase font-bold tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ПРОТОКОЛ ПІДІБРАНО ДЕРМАТОЛОГІЧНО</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-black uppercase tracking-tight">
                  Ваш персональний щоденний сет
                </h2>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  Формули ідеально поєднуються між собою, не конфліктують і взаємно посилюють ефективність активів.
                </p>
              </div>

              {/* Recommended Items */}
              <div className="space-y-3">
                {recommendedRoutine.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 bg-neutral-50 hairline-all flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-white hairline-all shrink-0 p-1 flex items-center justify-center">
                        <img
                          src={item.product.featuredImage}
                          alt={item.product.title}
                          className="w-full h-full object-cover mix-blend-multiply"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                          <span className="text-dune-ochre font-bold">КРОК {item.stepNumber}</span>
                          <span>•</span>
                          <span>{item.stepName}</span>
                        </div>
                        <h4 className="font-bold text-black uppercase text-xs truncate mt-0.5">
                          {item.product.title}
                        </h4>
                        <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                          {item.role}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="font-bold text-black text-sm tabular-nums">
                        {item.product.price.toLocaleString('uk-UA')} ₴
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing & CTA Card */}
              <div className="p-4 sm:p-5 bg-black text-white hairline-all space-y-4">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-neutral-400 uppercase tracking-wider">Звичайна ціна товарів:</span>
                  <span className="line-through text-neutral-400 tabular-nums">
                    {routineSubtotal.toLocaleString('uk-UA')} ₴
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono text-sm sm:text-base border-t border-neutral-800 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase tracking-wider">Спеціальна ціна сету:</span>
                    <span className="px-2 py-0.5 bg-dune-ochre text-black text-[10px] font-bold uppercase">
                      -10% СЕТ
                    </span>
                  </div>
                  <strong className="text-xl sm:text-2xl font-black text-dune-ochre font-mono tabular-nums">
                    {routineFinalPrice.toLocaleString('uk-UA')} ₴
                  </strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleAddBundleToCart}
                    className="w-full min-h-[46px] py-3 px-4 bg-dune-ochre hover:bg-[#ebd500] text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>ДОДАТИ ВЕСЬ СЕТ У КОШИК</span>
                  </button>

                  <button
                    onClick={() => {
                      if (recommendedRoutine.length > 0) {
                        openQuickOrder(recommendedRoutine[0].product);
                        handleClose();
                      }
                    }}
                    className="w-full min-h-[46px] py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white hairline-all font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Zap className="w-3.5 h-3.5 text-dune-ochre fill-current" />
                    <span>ШВИДКИЙ 1-КЛІК ЗАМОВЛЕННЯ</span>
                  </button>
                </div>
              </div>

              {/* Reset Quiz */}
              <div className="text-center pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-500 hover:text-black uppercase tracking-wider"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Пройти діагностику заново</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
