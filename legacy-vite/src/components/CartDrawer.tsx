import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { findVariant } from '../lib/ids';
import { useModal } from '../hooks/useModal';
import { getRelatedProducts } from '../lib/related';
import { DispatchCountdown } from './DispatchCountdown';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    products,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    openCartCheckout,
    addToCart,
    storeSettings,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const handleClose = () => setIsCartDrawerOpen(false);
  useModal(isCartDrawerOpen, handleClose);

  if (!isCartDrawerOpen) return null;

  const subtotal = cart.reduce((acc, item) => {
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

  const freeThreshold = storeSettings.freeShippingThreshold || 2000;
  const amountToFreeShipping = Math.max(freeThreshold - subtotal, 0);
  const freeShippingProgress = Math.min((subtotal / freeThreshold) * 100, 100);

  const totalCount = cart.reduce((a, b) => a + b.quantity, 0);

  // Recommendations for items not in cart
  const cartProducts = cart.map((i) => i.product);
  const crossSell = getRelatedProducts(cartProducts, products, 2);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput, subtotal);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoError(null);
      setPromoInput('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Stiletto Monospace Style */}
        <div className="p-4 sm:p-5 hairline-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-dune-ochre" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-black">
              BAG [{totalCount}]
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 font-mono text-sm text-neutral-400 hover:text-black flex items-center justify-center transition-colors"
            aria-label="Закрити кошик"
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Progress Bar (Stiletto Mono Style) */}
        <div className="bg-neutral-50 hairline-b px-5 py-3">
          <div className="flex items-center justify-between font-mono text-xs mb-2">
            <span className="flex items-center gap-1.5 text-neutral-700">
              <Truck className="w-3.5 h-3.5 text-dune-ochre" />
              {amountToFreeShipping === 0 ? (
                <span className="text-dune-ochre font-bold">
                  ★ БЕЗКОШТОВНА ДОСТАВКА АКТИВОВАНА
                </span>
              ) : (
                <span>
                  ДО БЕЗКОШТОВНОЇ ДОСТАВКИ:{' '}
                  <strong className="text-black tabular-nums">
                    {amountToFreeShipping.toLocaleString('uk-UA')} ₴
                  </strong>
                </span>
              )}
            </span>
            <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
              {Math.round(freeShippingProgress)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-200 overflow-hidden mb-2.5">
            <div
              className="h-full bg-black transition-all duration-500 ease-out"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
          <DispatchCountdown variant="cart" />
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {cart.length > 0 ? (
            <>
              {cart.map((item) => {
                const v = findVariant(item.product, item.selectedVariant);
                const price = v?.price || item.product.price;
                return (
                  <div
                    key={`${item.product.id}__${item.selectedVariant || 'default'}`}
                    className="flex items-center gap-3 p-3 bg-white hairline-all"
                  >
                    <div className="w-16 h-16 bg-[#f6f6f6] shrink-0 overflow-hidden">
                      <img
                        src={item.product.featuredImage}
                        alt={item.product.title}
                        className="w-full h-full object-cover mix-blend-multiply"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans font-medium text-xs text-black uppercase line-clamp-1 mb-0.5 leading-snug">
                        {item.product.title}
                      </h4>
                      {item.selectedVariant && item.selectedVariant !== 'Default Title' && (
                        <p className="font-mono text-[10px] text-neutral-400 uppercase mb-1">
                          VAR: {item.selectedVariant}
                        </p>
                      )}
                      <div className="font-mono font-bold text-xs text-black mb-2 tabular-nums">
                        {price.toLocaleString('uk-UA')} ₴
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between font-mono">
                        <div className="flex items-center hairline-all bg-white">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.selectedVariant
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 text-neutral-600 transition-colors"
                            title="Зменшити кількість"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-black tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.selectedVariant
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 text-neutral-600 transition-colors"
                            title="Збільшити кількість"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedVariant)}
                          className="text-neutral-400 hover:text-black p-1 transition-colors"
                          title="Видалити"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* In-Cart Routine Upsell Bundle */}
              {crossSell.length > 0 && (
                <div className="pt-4 hairline-t">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="font-mono text-[10px] text-dune-ochre uppercase font-bold tracking-widest flex items-center gap-1">
                      <span>⚡️ КОМПЛЕКСНА РУТИНА ДОГЛЯДУ</span>
                    </p>
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-black text-white font-bold">
                      -15% В КОМПЛЕКТІ
                    </span>
                  </div>
                  <div className="space-y-2">
                    {crossSell.map((rel) => {
                      const bundlePrice = Math.round(rel.price * 0.85);
                      return (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-2.5 bg-neutral-50 hairline-all text-xs group hover:border-black transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={rel.featuredImage}
                              alt=""
                              className="w-10 h-10 object-cover bg-white shrink-0 mix-blend-multiply hairline-all"
                            />
                            <div className="truncate">
                              <span className="font-sans font-medium text-black truncate uppercase text-[11px] block">
                                {rel.title}
                              </span>
                              <div className="flex items-baseline gap-1.5 mt-0.5 font-mono text-[11px]">
                                <span className="font-bold text-black tabular-nums">{bundlePrice} ₴</span>
                                <span className="text-[10px] text-neutral-400 line-through tabular-nums">{rel.price} ₴</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(rel, 1)}
                            className="min-h-[32px] inline-flex items-center gap-1 px-3 py-1 bg-black text-white font-mono text-[10px] uppercase font-bold shrink-0 ml-2 hover:bg-neutral-800 active:scale-95 transition-all"
                            title="Додати до комплекту"
                          >
                            <span>+ ДОДАТИ</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 px-4 font-mono">
              <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="font-bold text-black text-sm uppercase mb-1">Кошик порожній</p>
              <p className="text-neutral-400 text-xs uppercase mb-6 max-w-xs mx-auto">
                Оберіть товари в каталозі для оформлення замовлення
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-black text-white font-mono text-xs uppercase font-bold hover:bg-neutral-800 transition-colors"
              >
                [ ДО КАТАЛОГУ ]
              </button>
            </div>
          )}
        </div>

        {/* Footer & Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 hairline-t bg-neutral-50 space-y-3 font-mono">
            {/* Promo Code Input or Active Promo Badge */}
            <div className="pb-1">
              {appliedPromo ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ПРОМОКОД: <strong>{appliedPromo.code}</strong></span>
                    <span className="font-bold">(-{discountAmount.toLocaleString('uk-UA')} ₴)</span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-neutral-400 hover:text-black p-0.5"
                    title="Видалити промокод"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="ПРОМОКОД (НАПР. BEAUTY10)"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        setPromoError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white hairline-all text-xs uppercase focus:outline-none focus:border-black"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase transition-colors shrink-0"
                    >
                      ЗАСТОСУВАТИ
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[10px] text-rose-600 font-mono">{promoError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-neutral-600">
              <span className="uppercase">Сума замовлення:</span>
              <span className="text-black font-semibold tabular-nums">
                {subtotal.toLocaleString('uk-UA')} ₴
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                <span className="uppercase">Знижка:</span>
                <span className="tabular-nums">
                  -{discountAmount.toLocaleString('uk-UA')} ₴
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-neutral-600">
              <span className="uppercase">Доставка:</span>
              <span className={amountToFreeShipping === 0 ? 'text-dune-ochre font-bold' : 'text-neutral-800'}>
                {amountToFreeShipping === 0 ? 'БЕЗКОШТОВНО' : 'ЗА ТАРИФАМИ ПОШТИ'}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-black hairline-t pt-2.5">
              <span className="uppercase">РАЗОМ ДО СПЛАТИ:</span>
              <span className="text-base text-black font-bold tabular-nums">
                {finalTotal.toLocaleString('uk-UA')} ₴
              </span>
            </div>

            <button
              onClick={openCartCheckout}
              className="w-full min-h-[46px] py-3 px-4 bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>ОФОРМИТИ ЗАМОВЛЕННЯ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
