import React, { useState } from 'react';
import { CheckCircle, ShieldCheck, Truck, CreditCard, Banknote, Copy, ExternalLink } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatUaPhone } from '../lib/formatters';
import { findVariant } from '../lib/ids';
import { useModal } from '../hooks/useModal';
import { NovaPoshtaPicker } from './NovaPoshtaPicker';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    checkoutProduct,
    checkoutVariant,
    cart,
    submitOrder,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    setIsTrackingOpen,
    addToast,
  } = useStore();

  const isQuick = !!checkoutProduct;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380 ');
  const [city, setCity] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'nova_poshta' | 'ukrposhta' | 'courier'>('nova_poshta');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card'>('cash_on_delivery');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState(''); // Anti-bot honeypot
  const [openedAt] = useState(() => Date.now()); // Time trap
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Restore saved name and phone for returning customers
  React.useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('mallroom_saved_phone');
      const savedName = localStorage.getItem('mallroom_saved_name');
      if (savedPhone) setPhone(savedPhone);
      if (savedName) setName(savedName);
    } catch {
      // ignore
    }
  }, []);

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setOrderComplete(false);
    setErrorMessage(null);
  };

  useModal(isCheckoutOpen, handleClose);

  if (!isCheckoutOpen) return null;

  const items = checkoutProduct
    ? [{ product: checkoutProduct, quantity: 1, selectedVariant: checkoutVariant }]
    : cart;

  const subtotal = items.reduce((acc, item) => {
    const v = findVariant(item.product, item.selectedVariant);
    return acc + (v?.price || item.product.price) * item.quantity;
  }, 0);

  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percent') {
      discountAmount = Math.round((subtotal * appliedPromo.discountValue) / 100);
    } else {
      discountAmount = Math.min(appliedPromo.discountValue, subtotal);
    }
  }

  const finalTotal = Math.max(subtotal - discountAmount, 0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUaPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 12) {
      setErrorMessage('Введіть повний номер телефону: +380 (XX) XXX-XX-XX');
      return;
    }

    if (!isQuick && !city.trim()) {
      setErrorMessage('Вкажіть місто для доставки');
      return;
    }

    setIsSubmitting(true);
    try {
      const elapsedMs = Date.now() - openedAt;
      try {
        localStorage.setItem('mallroom_saved_phone', phone.trim());
        if (name.trim()) localStorage.setItem('mallroom_saved_name', name.trim());
      } catch {}
      const res = await submitOrder({
        name: name.trim() || (isQuick ? 'Клієнт (В 1 клік)' : 'Клієнт'),
        phone: phone.trim(),
        city: city.trim() || 'Уточнюється менеджером',
        warehouse: warehouse.trim() || 'Уточнюється менеджером',
        deliveryMethod,
        paymentMethod,
        notes: notes.trim(),
        website,
        elapsedMs,
        promoCode: appliedPromo?.code,
        discountAmount,
      });

      setOrderNumber(res.orderId);
      setOrderComplete(true);
    } catch {
      setErrorMessage('Помилка при оформленні. Спробуйте ще раз або зателефонуйте нам.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 overscroll-contain animate-fade-in font-mono"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <div
        className="relative bg-white max-w-lg w-full hairline-all max-h-[94dvh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-7 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile top handle */}
        <div className="w-10 h-1 bg-neutral-300 mx-auto mb-3 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Закрити вікно замовлення"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 font-mono text-neutral-400 hover:text-black flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        {orderComplete ? (
          /* Success Screen */
          <div className="text-center py-6 animate-fade-in">
            <div className="w-14 h-14 bg-black text-white flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-dune-ochre" />
            </div>

            <span className="font-mono text-xs uppercase tracking-widest text-dune-ochre mb-2 inline-block">
              // ЗАМОВЛЕННЯ №{orderNumber}
            </span>

            <h3 className="text-xl sm:text-2xl font-bold font-display uppercase text-black mb-2">
              Дякуємо за замовлення!
            </h3>

            <p className="text-xs text-neutral-600 max-w-md mx-auto mb-6 leading-relaxed font-sans">
              Менеджер зв’яжеться з вами за номером <strong>{phone}</strong> протягом 10 хвилин для підтвердження відправки.
            </p>

            <div className="bg-neutral-50 p-4 text-left hairline-all text-xs space-y-2 mb-6">
              <div className="flex justify-between font-bold text-black border-b border-neutral-200 pb-2">
                <span>НОМЕР ЗАМОВЛЕННЯ:</span>
                <span className="text-dune-ochre">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>ТЕЛЕФОН:</span>
                <span className="text-black font-semibold">{phone}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-black border-t border-neutral-200 pt-2">
                <span>СУМА ДО СПЛАТИ:</span>
                <span className="tabular-nums text-dune-ochre">{finalTotal.toLocaleString('uk-UA')} ₴</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Знижка за промокодом:</span>
                  <span>-{discountAmount.toLocaleString('uk-UA')} ₴</span>
                </div>
              )}
            </div>

            {paymentMethod === 'card' && (
              <div className="bg-neutral-900 text-white p-4 text-left hairline-all text-xs space-y-3 mb-6 font-mono">
                <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
                  <span className="font-bold text-dune-ochre text-[11px] uppercase tracking-wider">
                    // ОФІЦІЙНІ РЕКВІЗИТИ IBAN (MONOBANK)
                  </span>
                  <span className="text-[9px] bg-dune-ochre text-black px-1.5 py-0.5 font-bold">
                    0% КОМІСІЇ
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Одержувач:</span>
                    <span className="font-bold">ФОП Шулім Е. О.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">ЄДРПОУ:</span>
                    <span className="font-bold">3344556677</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">IBAN:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined') {
                          navigator.clipboard.writeText('UA213220010000026001234567890');
                          addToast('IBAN скопійовано в буфер обміну!', 'success');
                        }
                      }}
                      className="font-bold text-dune-ochre hover:underline flex items-center gap-1"
                      title="Скопіювати IBAN"
                    >
                      <span>UA21322001...7890</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Призначення:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined') {
                          navigator.clipboard.writeText(`Оплата замовлення ${orderNumber}`);
                          addToast('Призначення платежу скопійовано!', 'success');
                        }
                      }}
                      className="font-bold hover:underline flex items-center gap-1 text-white"
                      title="Скопіювати призначення"
                    >
                      <span>Оплата {orderNumber}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <a
                    href="https://send.monobank.ua/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-dune-ochre hover:bg-[#ebd500] text-black font-bold text-center uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>🐱 ВІДКРИТИ ЗАСТОСУНОК MONOBANK</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setIsTrackingOpen(true);
                }}
                className="flex-1 min-h-[46px] py-3 bg-white hover:bg-neutral-50 text-black font-mono font-bold text-xs uppercase tracking-widest hairline-all transition-all"
              >
                [ 📦 ВІДСТЕЖИТИ ТТН ]
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 min-h-[46px] py-3 bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all"
              >
                [ ДО МАГАЗИНУ ]
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-dune-ochre uppercase tracking-wider">
                {isQuick ? '// 1-CLICK CHECKOUT' : '// FAST CHECKOUT'}
              </span>
            </div>

            <h2 id="checkout-title" className="text-lg sm:text-xl font-bold font-display uppercase text-black mb-1">
              {isQuick ? 'Замовлення в 1 клік' : 'Оформлення замовлення'}
            </h2>
            <p className="text-xs text-neutral-500 font-sans mb-5">
              {isQuick
                ? 'Введіть номер телефону — наш менеджер зателефонує та оформить доставку!'
                : 'Заповніть контактні дані для відправки Новою Поштою'}
            </p>

            {/* Order Items Preview */}
            <div className="bg-neutral-50 p-3 mb-5 hairline-all max-h-40 overflow-y-auto space-y-2">
              {items.map((item, idx) => {
                const v = findVariant(item.product, item.selectedVariant);
                const price = v?.price || item.product.price;
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.product.featuredImage}
                        alt=""
                        className="w-9 h-9 object-cover bg-white shrink-0 mix-blend-multiply"
                      />
                      <div className="truncate">
                        <p className="font-medium text-black truncate uppercase font-sans text-xs">
                          {item.product.title}
                        </p>
                        <p className="text-neutral-500 text-[10px]">
                          {item.quantity} шт. × {price} ₴
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-black shrink-0 tabular-nums">
                      {(price * item.quantity).toLocaleString('uk-UA')} ₴
                    </span>
                  </div>
                );
              })}
              <div className="hairline-t pt-2 flex justify-between items-center text-xs font-bold text-black">
                <span>РАЗОМ ДО СПЛАТИ:</span>
                <span className="text-sm tabular-nums text-dune-ochre">{finalTotal.toLocaleString('uk-UA')} ₴</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-[11px] text-emerald-600 font-bold">
                  <span>ЗНИЖКА ЗА ПРОМОКОДОМ ({appliedPromo?.code}):</span>
                  <span className="tabular-nums">-{discountAmount.toLocaleString('uk-UA')} ₴</span>
                </div>
              )}

              {/* Promo Code Input Toggle */}
              <div className="hairline-t pt-2 mt-2">
                {appliedPromo ? (
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 hairline-all">
                    <span>ПРОМОКОД <strong>{appliedPromo.code}</strong> АКТИВОВАНО (-{discountAmount} ₴)</span>
                    <button
                      type="button"
                      onClick={() => removePromoCode()}
                      className="text-neutral-500 hover:text-black uppercase text-[10px] font-bold"
                    >
                      [ ВИДАЛИТИ ]
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ПРОМОКОД (НАПР. VIP15)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs font-mono uppercase bg-white hairline-all focus:outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!promoInput.trim()) return;
                          const res = applyPromoCode(promoInput, subtotal);
                          if (res.success) {
                            setPromoFeedback({ type: 'success', text: res.message });
                            setPromoInput('');
                          } else {
                            setPromoFeedback({ type: 'error', text: res.message });
                          }
                        }}
                        className="px-3 py-1 bg-black hover:bg-neutral-800 text-white font-mono text-[10px] uppercase font-bold transition-all"
                      >
                        ЗАСТОСУВАТИ
                      </button>
                    </div>
                    {promoFeedback && (
                      <p className={`text-[10px] mt-1 ${promoFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {promoFeedback.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {errorMessage && (
              <div role="alert" className="p-3 mb-4 bg-neutral-100 hairline-all text-black text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* Phone Input */}
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  НОМЕР ТЕЛЕФОНУ (УКРАЇНА) *
                </label>
                <input
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+380 (99) 000-00-00"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full min-h-[46px] px-3 py-2 bg-white hairline-all text-sm font-bold text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  ВАШЕ ІМ'Я {isQuick ? '(НЕОБОВ’ЯЗКОВО)' : '*'}
                </label>
                <input
                  type="text"
                  required={!isQuick}
                  placeholder="Олександр"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-white hairline-all text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              {!isQuick && (
                <>
                  {/* Delivery Service */}
                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1.5">
                      СЛУЖБА ДОСТАВКИ
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('nova_poshta')}
                        className={`min-h-[42px] p-2 hairline-all text-xs uppercase font-bold flex items-center justify-center gap-1.5 transition-all ${
                          deliveryMethod === 'nova_poshta'
                            ? 'bg-black text-white'
                            : 'bg-white text-neutral-600 hover:text-black hover:bg-neutral-50'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>НОВА ПОШТА</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('ukrposhta')}
                        className={`min-h-[42px] p-2 hairline-all text-xs uppercase font-bold flex items-center justify-center gap-1.5 transition-all ${
                          deliveryMethod === 'ukrposhta'
                            ? 'bg-black text-white'
                            : 'bg-white text-neutral-600 hover:text-black hover:bg-neutral-50'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>УКРПОШТА</span>
                      </button>
                    </div>

                    {deliveryMethod === 'nova_poshta' ? (
                      <NovaPoshtaPicker
                        selectedCity={city}
                        onCityChange={setCity}
                        warehouse={warehouse}
                        onWarehouseChange={setWarehouse}
                      />
                    ) : (
                      <div className="space-y-3 font-mono">
                        <div>
                          <label className="block text-[10px] sm:text-[11px] font-bold text-black uppercase mb-1">
                            МІСТО ТА ПОШТОВИЙ ІНДЕКС *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="м. Київ, 01001"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full min-h-[42px] px-3 py-2 bg-white hairline-all text-xs text-black focus:outline-none focus:border-black font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-[11px] font-bold text-black uppercase mb-1">
                            ВІДДІЛЕННЯ УКРПОШТИ АБО АДРЕСА *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Відділення 01001 (вул. Хрещатик, 22)"
                            value={warehouse}
                            onChange={(e) => setWarehouse(e.target.value)}
                            className="w-full min-h-[42px] px-3 py-2 bg-white hairline-all text-xs text-black focus:outline-none focus:border-black font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment */}
                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1.5">
                      СПОСІБ ОПЛАТИ
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash_on_delivery')}
                        className={`min-h-[46px] p-2 hairline-all text-xs uppercase font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                          paymentMethod === 'cash_on_delivery'
                            ? 'bg-black text-white'
                            : 'bg-white text-neutral-600 hover:text-black'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5" />
                          <span>ПРИ ОТРИМАННІ</span>
                        </div>
                        <span className="text-[9px] font-normal text-neutral-400">0% передоплати</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`min-h-[46px] p-2 hairline-all text-xs uppercase font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                          paymentMethod === 'card'
                            ? 'bg-black text-white'
                            : 'bg-white text-neutral-600 hover:text-black'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>MONOBANK / IBAN</span>
                        </div>
                        <span className="text-[9px] font-normal text-dune-ochre">0% комісії</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="mt-2 p-2.5 bg-neutral-50 hairline-all text-[11px] text-neutral-600 font-sans leading-relaxed flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Офіційні реквізити IBAN з можливістю швидкої оплати через <strong>Monobank</strong> або <strong>Приват24</strong> відобразяться одразу на наступному екрані.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1">
                      КОМЕНТАР ДО ЗАМОВЛЕННЯ
                    </label>
                    <input
                      type="text"
                      placeholder="Уточнення або побажання щодо замовлення..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-white hairline-all text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] py-3.5 px-6 bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting
                    ? 'ОФОРМЛЕННЯ...'
                    : `ЗАМОВИТИ ЗАРАЗ • ${finalTotal.toLocaleString('uk-UA')} ₴`}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 text-center uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-dune-ochre" />
                <span>ОПЛАТА ПРИ ОТРИМАННІ • ОГЛЯД У ВІДДІЛЕННІ</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
