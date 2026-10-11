import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  RotateCcw,
  Truck,
  FileText,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Clock,
  MapPin,
  Mail,
  Send,
} from 'lucide-react';
import { useModal } from '../hooks/useModal';

export type PolicyTabKey =
  | 'privacy'
  | 'refund'
  | 'shipping'
  | 'terms'
  | 'about'
  | 'contacts';

interface PolicyModalProps {
  isOpen: boolean;
  initialTab?: PolicyTabKey;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  initialTab = 'shipping',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTabKey>(initialTab);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleClose = useCallback(() => {
    onClose();
    if (typeof window !== 'undefined') {
      const policyHashes = [
        '#privacy',
        '#privacy-policy',
        '#refund',
        '#refund-policy',
        '#shipping',
        '#shipping-policy',
        '#terms',
        '#terms-of-service',
        '#about',
        '#about-us',
        '#contacts',
        '#contact-information',
      ];
      if (policyHashes.includes(window.location.hash)) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }
    }
  }, [onClose]);

  useModal(isOpen, handleClose);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 md:p-6 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl h-full max-h-[92dvh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <header className="px-5 py-4 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#dec400] text-black flex items-center justify-center font-bold text-xs">
              MR
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-display uppercase tracking-wide text-white flex items-center gap-2">
                Інформаційний центр & Політики
                <span className="text-[10px] font-mono text-[#dec400] bg-[#dec400]/10 px-2 py-0.5 rounded border border-[#dec400]/30 hidden sm:inline-block">
                  MALLROOM Skincare
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                Офіційні правила, гарантії безпеки та умови обслуговування
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Закрити"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* NAVIGATION TABS (Horizontal Scroll on Mobile) */}
        <nav className="flex items-center gap-1 px-4 py-2 bg-neutral-100 border-b border-neutral-200 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === 'about'
                ? 'bg-black text-[#dec400] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Про нас</span>
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === 'shipping'
                ? 'bg-black text-[#dec400] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Оплата & Доставка</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === 'refund'
                ? 'bg-black text-[#dec400] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Обмін & Повернення</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === 'privacy'
                ? 'bg-black text-[#dec400] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Конфіденційність</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === 'terms'
                ? 'bg-black text-[#dec400] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Публічна оферта</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === 'contacts'
                ? 'bg-black text-[#dec400] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Контакти & Реквізити</span>
          </button>
        </nav>

        {/* MODAL BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 text-neutral-800 text-sm leading-relaxed space-y-6">
          {/* 1. ABOUT US (Про нас) */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  // CONCEPT STORE // PHILOSOPHY
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display text-black uppercase mt-1">
                  Про простір MALLROOM Skincare
                </h3>
                <p className="text-neutral-600 mt-2 font-normal leading-relaxed">
                  <strong>MALLROOM</strong> — концептуальний мультибрендовий простір оригінальної доглядової та функціональної косметики з Південної Кореї, Японії та Європи. Ми об’єднали дерматологічні інновації, робочі формули активних компонентів та чесний сервіс без компромісів.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <div className="w-8 h-8 rounded-lg bg-black text-[#dec400] flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-black mb-1">
                    100% Оригінальність
                  </h4>
                  <p className="text-xs text-neutral-500 leading-normal">
                    Прямі поставки від офіційних імпортерів брендів COSRX, Beauty of Joseon, Round Lab, Skin1004. Кожна партія має діючі сертифікати відповідності.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <div className="w-8 h-8 rounded-lg bg-black text-[#dec400] flex items-center justify-center mb-3">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-black mb-1">
                    Свіжі терміни & Склад
                  </h4>
                  <p className="text-xs text-neutral-500 leading-normal">
                    Суворий контроль термінів придатності. Складське зберігання в умовах стабільної температури (+18°C) без доступу ультрафіолету.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
                  <div className="w-8 h-8 rounded-lg bg-black text-[#dec400] flex items-center justify-center mb-3">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-black mb-1">
                    Експертний підбір
                  </h4>
                  <p className="text-xs text-neutral-500 leading-normal">
                    Індивідуальний підбір доглядової рутини під потреби вашої шкіри: себорегуляція, боротьба з акне, відновлення бар'єру чи anti-age.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <h4 className="font-bold text-sm text-black uppercase tracking-wide">
                  Культура вибору та свідомий догляд
                </h4>
                <p className="text-neutral-600 text-xs sm:text-sm">
                  Ми віримо, що догляд за шкірою — це щоденний ритуал турботи про себе, а не хаотичні покупки. У нашому каталозі немає випадкових товарів: кожна сироватка, крем або SPF-засіб перевірені за складом (INCI) на ефективність концентрацій (ніацинамід, пептиди, центелла, кислоти AHA/BHA/PHA, муцин равлика).
                </p>
              </div>

              <div className="p-4 bg-neutral-900 text-neutral-300 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#dec400] font-bold font-mono">
                  <span>★ ВІДПРАВКА ДЕНЬ У ДЕНЬ</span>
                </div>
                <p>
                  Всі замовлення, оформлені до 17:00, відправляються з нашого складу в Києві в той самий день Новою Поштою. Доставка до вашого відділення чи поштомату триває всього 24–48 годин.
                </p>
              </div>
            </div>
          )}

          {/* 2. SHIPPING & PAYMENT (Оплата та доставка) */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  // LOGISTICS // PAYMENT METHODS
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display text-black uppercase mt-1">
                  Умови доставки та оплати
                </h3>
                <p className="text-neutral-600 mt-2 font-normal">
                  Швидка, надійна та прозора логістика по всій території України. Ми не беремо обов'язкових передоплат і відправляємо замовлення щодня.
                </p>
              </div>

              {/* Delivery Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-black uppercase flex items-center gap-2">
                  <Truck className="w-4 h-4 text-black" />
                  1. Способи доставки по Україні
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <span className="font-bold text-xs text-black block mb-1">
                      Відділення Нової Пошти
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Термін: 1–2 дні. Огляд перед оплатою. Вартість від 70 ₴ (або <strong>безкоштовно від 2 000 ₴</strong>).
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <span className="font-bold text-xs text-black block mb-1">
                      Поштомати Нової Пошти
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Цілодобовий доступ біля вашого дому. Швидке отримання через мобільний додаток.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    <span className="font-bold text-xs text-black block mb-1">
                      Кур'єр Нової Пошти
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Адресна доставка прямо до дверей вашої квартири чи офісу в зручний інтервал часу.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Графік відправлень:</strong> Замовлення, оформлені до 17:00 з понеділка по неділю, відвантажуються в день замовлення. Замовлення після 17:00 передаються кур'єру Нової Пошти наступного ранку о 10:00.
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <h4 className="font-bold text-sm text-black uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-black" />
                  2. Способи оплати
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-black uppercase">
                        Післяплата (Накладений платіж) — Без передоплати
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        Найпопулярніший
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Ви сплачуєте замовлення карткою або готівкою безпосередньо у відділенні або поштоматі Нової Пошти <strong>тільки після повного огляду посилки</strong>. Зверніть увагу: Нова Пошта стягує комісію за послугу переказу коштів (20 ₴ + 2% від вартості замовлення).
                    </p>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <span className="font-bold text-xs text-black uppercase block mb-1">
                      Оплата банківською карткою онлайн
                    </span>
                    <p className="text-xs text-neutral-600">
                      Миттєва безпечна оплата через Apple Pay, Google Pay, Visa чи MasterCard без комісії за післяплату.
                    </p>
                  </div>
                </div>
              </div>

              {/* Free delivery rule */}
              <div className="p-4 bg-black text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-[#dec400] font-mono font-bold uppercase block">
                    АКЦІЯ НА ДОСТАВКУ
                  </span>
                  <span className="font-bold text-sm">
                    Безкоштовна доставка для замовлень від 2 000 ₴
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    Доставка до відділення та поштомату здійснюється за рахунок магазину.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. REFUND & RETURN (Обмін та повернення) */}
          {activeTab === 'refund' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  // CONSUMER RIGHTS // UKRAINE LAW
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display text-black uppercase mt-1">
                  Політика повернення та обміну
                </h3>
                <p className="text-neutral-600 mt-2 font-normal">
                  Відповідно до законодавства України та високих стандартів клієнтського сервісу MALLROOM.
                </p>
              </div>

              {/* Legal Notice on Cosmetics */}
              <div className="p-4 bg-neutral-100 rounded-xl border border-neutral-300 text-xs text-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-black uppercase font-mono">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Законодавча норма для косметичних засобів</span>
                </div>
                <p className="leading-relaxed">
                  Згідно з <strong>Постановою Кабінету Міністрів України від 19.03.1994 року № 172</strong> «Про реалізацію окремих положень Закону України "Про захист прав споживачів"», <strong>парфумерно-косметичні товари належної якості обміну та поверненню не підлягають</strong> з міркувань санітарно-гігієнічної безпеки.
                </p>
              </div>

              {/* Situations where exchange/refund is guaranteed */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-black uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Коли ми гарантовано здійснюємо обмін або повернення 100% коштів:
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-neutral-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#dec400] font-bold">✓</span>
                    <span><strong>Виробничий дефект:</strong> зламаний дозатор, несправний розпилювач, пошкоджена внутрішня захисна мембрана флакона.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#dec400] font-bold">✓</span>
                    <span><strong>Помилка комплектації:</strong> отримано не той товар, об'єм чи відтінок, який було замовлено.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#dec400] font-bold">✓</span>
                    <span><strong>Пошкодження під час транспортування:</strong> розбитий флакон або витік засобу в посилці.</span>
                  </li>
                </ul>
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <h4 className="font-bold text-sm text-black uppercase">
                  Покрокова інструкція для покупця:
                </h4>
                <ol className="space-y-3 text-xs sm:text-sm text-neutral-600 list-decimal pl-5">
                  <li>
                    <strong>Оглядайте товар у присутності співробітника Нової Пошти</strong> до внесення оплати або одразу під час отримання у відділенні/поштоматі.
                  </li>
                  <li>
                    У разі виявлення пошкодження або невідповідності замовлення, складіть акт разом з представником Нової Пошти та відмовтеся від посилки.
                  </li>
                  <li>
                    Зв'яжіться з нашою підтримкою за номером <strong>0 (800) 33-22-11</strong> або у Telegram <strong>@mallroom_support</strong>, надавши номер замовлення та фотографії.
                  </li>
                  <li>
                    Ми надішлемо повторну посилку за наш рахунок або повернемо кошти на вашу картку протягом <strong>1–3 робочих днів</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* 4. PRIVACY POLICY (Політика конфіденційності) */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  // GDPR // DATA PROTECTION
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display text-black uppercase mt-1">
                  Політика конфіденційності
                </h3>
                <p className="text-neutral-600 mt-2 font-normal">
                  MALLROOM гарантує повну безпеку та конфіденційність ваших персональних даних відповідно до Закону України «Про захист персональних даних».
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-neutral-600">
                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    1. Які дані ми збираємо
                  </h4>
                  <p>
                    Під час оформлення замовлення ви надаєте: ім'я та прізвище, контактний номер телефону, місто доставки та номер відділення/поштомату Нової Пошти. Ми не збираємо платіжні реквізити ваших карток (вся оплата відбувається на захищеній сторінці сертифікованого банку-еквайєра).
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    2. Мета обробки даних
                  </h4>
                  <p>
                    Зібрані дані використовуються виключно для: комплектації та доставки замовлення, надсилання SMS/Viber-повідомлення з номером ТТН (експрес-накладної), зв'язку менеджера для підтвердження деталей замовлення та інформування про статус доставки.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    3. Передача третім особам
                  </h4>
                  <p>
                    Ми ніколи не продаємо і не передаємо ваші дані стороннім організаціям чи рекламним базам. Дані передаються виключно логістичному партнеру («Нова Пошта») для фізичної доставки вашої посилки.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    4. Файли Cookie та аналітика
                  </h4>
                  <p>
                    Для покращення роботи сайту, збереження товарів у кошику та коректного відображення каталогу використовуються файли Cookie, а також знеособлені системи веб-аналітики Google Analytics 4 та Meta Pixel.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    5. Права користувача
                  </h4>
                  <p>
                    Ви маєте право в будь-який момент запросити інформацію про збережені дані або вимагати їх повного видалення з нашої клієнтської бази, звернувшись на e-mail: <strong>care@mallroom.ua</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. TERMS OF SERVICE (Публічна оферта) */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  // LEGAL // PUBLIC OFFER CONTRACT
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display text-black uppercase mt-1">
                  Договір публічної оферти
                </h3>
                <p className="text-neutral-600 mt-2 font-normal">
                  Публічний договір купівлі-продажу товарів через інтернет-магазин MALLROOM.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    1. Загальні положення
                  </h4>
                  <p>
                    Цей договір є офіційною та публічною пропозицією Продавця (ФОП) укласти договір купівлі-продажу Товару, представленого на сайті інтернет-магазину. Відповідно до статті 633 Цивільного кодексу України, його умови є однаковими для всіх покупців.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    2. Момент укладення договору (Акцепт)
                  </h4>
                  <p>
                    Договір вважається укладеним, а оферта прийнятою Покупцем у повному обсязі з моменту натискання кнопки «Оформити замовлення» на сторінці онлайн-кошика або здійснення усного замовлення за телефоном магазину.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    3. Ціна товару та порядок оплати
                  </h4>
                  <p>
                    Ціни на Товари визначаються Продавцем та зазначаються в національній валюті України — гривні (UAH). Оплата здійснюється готівкою або безготівковим розрахунком при отриманні у відділенні перевізника або онлайн банківською карткою.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-black uppercase mb-1">
                    4. Відповідальність сторін та форс-мажор
                  </h4>
                  <p>
                    Сторони несуть відповідальність за невиконання або неналежне виконання умов договору згідно з чинним законодавством України. Сторони звільняються від відповідальності у разі настання обставин непереборної сили (форс-мажорних обставин).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. CONTACTS & REQUISITES (Контакти та реквізити) */}
          {activeTab === 'contacts' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  // CONTACT INFORMATION // FOP DETAILS
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display text-black uppercase mt-1">
                  Контактна інформація та реквізити
                </h3>
                <p className="text-neutral-600 mt-2 font-normal">
                  Офіційні канали зв'язку зі службою клієнтської підтримки та юридичні реквізити підприємства.
                </p>
              </div>

              {/* Direct channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2 text-black font-bold text-xs uppercase">
                    <PhoneCall className="w-4 h-4 text-[#dec400]" />
                    <span>Гаряча лінія</span>
                  </div>
                  <a
                    href="tel:+380800332211"
                    className="text-lg font-black font-mono text-black hover:text-[#dec400] transition-colors block"
                  >
                    0 (800) 33-22-11
                  </a>
                  <p className="text-[11px] text-neutral-500">
                    Безкоштовно з усіх мобільних та міських номерів по Україні.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2 text-black font-bold text-xs uppercase">
                    <Send className="w-4 h-4 text-[#dec400]" />
                    <span>Месенджери (Швидка відповідь)</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href="https://t.me/mallroom_ua"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#229ED9] text-white rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                    >
                      <span>Telegram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="viber://chat?number=%2B380800332211"
                      className="px-3 py-1.5 bg-[#7360F2] text-white rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                    >
                      <span>Viber</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Середній час відповіді в чаті — 3–5 хвилин.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2 text-black font-bold text-xs uppercase">
                    <Mail className="w-4 h-4 text-[#dec400]" />
                    <span>Електронна пошта</span>
                  </div>
                  <a
                    href="mailto:care@mallroom.ua"
                    className="text-sm font-bold font-mono text-black hover:text-[#dec400] transition-colors block"
                  >
                    care@mallroom.ua
                  </a>
                  <p className="text-[11px] text-neutral-500">
                    Для клієнтських звернень, питань повернення та співпраці.
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2 text-black font-bold text-xs uppercase">
                    <Clock className="w-4 h-4 text-[#dec400]" />
                    <span>Графік роботи</span>
                  </div>
                  <div className="text-xs font-bold text-black font-mono">
                    Пн — Нд: 10:00 — 20:00
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Склад та онлайн-підтримка працюють без вихідних.
                  </p>
                </div>
              </div>

              {/* Showroom & Requisites Box */}
              <div className="p-5 bg-neutral-900 text-white rounded-2xl border border-neutral-800 space-y-4">
                <div className="flex items-center gap-2 text-[#dec400] font-bold text-xs font-mono uppercase">
                  <MapPin className="w-4 h-4" />
                  <span>Адреса та юридичні реквізити</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-neutral-300">
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">
                      Фактична адреса / Шоурум:
                    </span>
                    <span className="text-white font-medium">
                      Україна, 03035, м. Київ, вул. Митрополита Василя Липківського, 16Б
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">
                      Суб'єкт підприємницької діяльності:
                    </span>
                    <span className="text-white font-medium">
                      ФОП Шулім Е. М.
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">
                      Код ЄДРПОУ / ІПН:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">3284910294</span>
                      <button
                        onClick={() => copyToClipboard('3284910294', 'edrpou')}
                        className="text-neutral-400 hover:text-white transition-colors"
                        title="Копіювати"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {copiedField === 'edrpou' && (
                        <span className="text-[10px] text-emerald-400">Скопійовано!</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">
                      Система оподаткування:
                    </span>
                    <span className="text-white font-medium">
                      Спрощена система (2 група платника єдиного податку)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <footer className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs font-mono text-neutral-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Офіційний сервіс MALLROOM</span>
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase transition-colors"
          >
            Закрити
          </button>
        </footer>
      </div>
    </div>
  );
};
