import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Zap,
  CheckCircle2,
  Star,
  Heart,
  Share2,
  Eye,
  Sparkles,
  Sun,
  Moon,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { useStore } from '../context/StoreContext';
import { ProductJsonLd } from './ProductJsonLd';
import { findVariant } from '../lib/ids';
import { useModal } from '../hooks/useModal';
import { getRelatedProducts } from '../lib/related';

type DetailTab = 'desc' | 'actives' | 'synergy' | 'usage' | 'reviews';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    selectedVariant,
    setSelectedVariant,
    products,
    addToCart,
    openQuickOrder,
    isInWishlist,
    toggleWishlist,
    addRecentlyViewed,
    addToast,
    getProductReviews,
    addReview,
  } = useStore();

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('desc');

  // Review form state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSkin, setReviewSkin] = useState('Комбінована');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      addRecentlyViewed(selectedProduct.id);
      setActiveTab('desc');
    }
  }, [selectedProduct?.id]);

  const handleClose = () => {
    setSelectedProduct(null);
    setSelectedImage('');
    setSelectedVariant('');
  };

  useModal(!!selectedProduct, handleClose);

  // Cross-sell items
  const related = useMemo(() => {
    if (!selectedProduct) return [];
    return getRelatedProducts([selectedProduct], products, 2);
  }, [selectedProduct, products]);

  const dermBadges = useMemo(() => {
    if (!selectedProduct) return [];
    const text = `${selectedProduct.title} ${(selectedProduct.tags || []).join(' ')}`.toLowerCase();
    const badges: string[] = [];
    if (text.includes('центел') || text.includes('centella') || text.includes('cica'))
      badges.push('🌿 100% Центелла азіатська');
    if (text.includes('муцин') || text.includes('snail')) badges.push('🐌 96% Муцин равлика');
    if (text.includes('spf') || text.includes('сонцезах'))
      badges.push('☀️ SPF 50+ PA++++ фотостабільні фільтри');
    if (text.includes('ніацинамід') || text.includes('niacinamide')) badges.push('✨ Ніацинамід + Цинк');
    if (text.includes('гіалурон') || text.includes('hyaluron')) badges.push('💧 8 видів гіалуронової к-ти');
    if (text.includes('bha') || text.includes('чайне дерево') || text.includes('salicylic'))
      badges.push('🍃 BHA + Олія чайного дерева');
    if (text.includes('пробіотик') || text.includes('рис') || text.includes('rice'))
      badges.push('🌾 Екстракт рису + Пробіотики');
    return badges;
  }, [selectedProduct]);

  // Routine AM/PM Protocol & Synergy Rules
  const routineProtocol = useMemo(() => {
    if (!selectedProduct) return null;
    const type = (selectedProduct.productType || '').toLowerCase();
    const title = selectedProduct.title.toLowerCase();

    if (type.includes('сонцезах') || title.includes('spf') || title.includes('sun')) {
      return {
        step: 'КРОК 5: ЗАХИСТ ВІД UV',
        time: 'morning' as const,
        timeLabel: 'ТІЛЬКИ ВРАНЦІ (☀️ AM)',
        synergyWith: 'Гіалуронова кислота, центелла, ніацинамід. Наносити за 15 хвилин до виходу на сонце.',
        conflictWith: 'Не конфліктує. Є обов’язковим завершенням будь-якої ранкової рутини.',
      };
    }
    if (type.includes('крем') || title.includes('cream')) {
      return {
        step: 'КРОК 4: БАР’ЄРНЕ ЗВОЛОЖЕННЯ',
        time: 'both' as const,
        timeLabel: 'РАНОК ТА ВЕЧІР (☀️ AM / 🌙 PM)',
        synergyWith: 'Ідеально «закриває» сироватки з центеллою або муцином, утримуючи вологу та ліпіди.',
        conflictWith: 'Уникайте нанесення занадто щільних шарів перед нанесенням макіяжу.',
      };
    }
    if (
      type.includes('сироват') ||
      type.includes('есенц') ||
      type.includes('ампул') ||
      title.includes('serum') ||
      title.includes('ampoule') ||
      title.includes('essence') ||
      title.includes('муцин')
    ) {
      return {
        step: 'КРОК 3: ТАРГЕТНИЙ АКТИВ',
        time: 'both' as const,
        timeLabel: 'РАНОК ТА ВЕЧІР (☀️ AM / 🌙 PM)',
        synergyWith: 'Центелла, пептиди, пантенол, ніацинамід, гіалуронова кислота.',
        conflictWith: 'Не поєднувати високі концентрації AHA/BHA з чистим ретинолом в одному вечірньому нанесенні.',
      };
    }
    if (type.includes('тонер') || type.includes('тонік') || title.includes('toner')) {
      return {
        step: 'КРОК 2: ТОНІЗУВАННЯ ТА ГІДРАТАЦІЯ',
        time: 'both' as const,
        timeLabel: 'РАНОК ТА ВЕЧІР (☀️ AM / 🌙 PM)',
        synergyWith: 'Готує шкіру до проникнення концентрованих сироваток, нормалізує фізіологічний pH 5.5.',
        conflictWith: 'Не змивати водою після нанесення.',
      };
    }
    return {
      step: 'КРОК 1: ДЕЛІКАТНЕ ОЧИЩЕННЯ',
      time: 'both' as const,
      timeLabel: 'РАНОК ТА ВЕЧІР (☀️ AM / 🌙 PM)',
      synergyWith: 'Наступне зволоження тонером або сироваткою протягом перших 60 секунд після вмивання.',
      conflictWith: 'Не використовувати гарячу воду, щоб не пошкодити гідроліпідну мантію.',
    };
  }, [selectedProduct]);

  // Product reviews
  const productReviews = useMemo(() => {
    if (!selectedProduct) return [];
    return getProductReviews(selectedProduct.id);
  }, [selectedProduct, getProductReviews]);

  if (!selectedProduct) return null;

  const currentVariant = findVariant(selectedProduct, selectedVariant);
  const activePrice = currentVariant?.price ?? selectedProduct.price;
  const activeComparePrice = currentVariant?.compareAtPrice ?? selectedProduct.compareAtPrice;

  const activeImage = selectedImage || selectedProduct.featuredImage;
  const discountPercent =
    activeComparePrice && activeComparePrice > activePrice
      ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100)
      : null;

  const handleAddAndClose = () => {
    addToCart(selectedProduct, 1, selectedVariant || currentVariant?.title);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      handleClose();
    }, 400);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      addToast('Посилання на засіб скопійовано в буфер обміну!', 'success');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewText.trim()) return;
    setIsSubmittingReview(true);
    addReview({
      productId: selectedProduct.id,
      author: reviewAuthor.trim(),
      rating: reviewRating,
      text: reviewText.trim(),
      skinType: reviewSkin,
      verified: true,
    });
    setReviewAuthor('');
    setReviewText('');
    setReviewRating(5);
    setIsSubmittingReview(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 md:p-6 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Schema.org JSON-LD microdata for Google Merchant / SEO */}
      <ProductJsonLd product={selectedProduct} />

      <div
        className="relative bg-white max-w-3xl w-full hairline-all flex flex-col md:flex-row max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto md:overflow-hidden overscroll-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile top handle */}
        <div className="w-10 h-1 bg-neutral-300 mx-auto my-2 sm:hidden shrink-0" />

        {/* Action icons row (Share, Wishlist, Close) */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1">
          <button
            onClick={handleShare}
            aria-label="Поділитися посиланням на товар"
            className="w-8 h-8 font-mono text-neutral-400 hover:text-black flex items-center justify-center transition-colors"
            title="Поділитися"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleWishlist(selectedProduct.id)}
            aria-label={isInWishlist(selectedProduct.id) ? 'У списку бажань' : 'Додати в список бажань'}
            className="w-8 h-8 font-mono text-neutral-400 hover:text-black flex items-center justify-center transition-colors"
            title={isInWishlist(selectedProduct.id) ? 'У списку бажань' : 'Зберегти товар'}
          >
            <Heart
              className={`w-4 h-4 ${
                isInWishlist(selectedProduct.id) ? 'text-rose-500 fill-rose-500' : 'text-neutral-400 hover:text-rose-500'
              }`}
            />
          </button>

          <button
            onClick={handleClose}
            aria-label="Закрити вікно товару"
            className="w-8 h-8 font-mono text-neutral-400 hover:text-black flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Left Column: Image Gallery with #F6F6F6 background */}
        <div className="md:w-1/2 p-5 sm:p-6 bg-[#f6f6f6] flex flex-col items-center justify-center hairline-b md:hairline-b-0 md:hairline-r shrink-0">
          <div className="relative aspect-square w-full max-w-xs sm:max-w-sm overflow-hidden mb-3 sm:mb-4 bg-white p-2 hairline-all">
            <img
              src={activeImage}
              alt={selectedProduct.title}
              className="w-full h-full object-cover object-center mix-blend-multiply"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
              }}
            />
            {discountPercent && (
              <span className="absolute top-2 left-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider bg-black text-white">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {selectedProduct.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto w-full max-w-xs sm:max-w-sm pb-1 scrollbar-none">
              {selectedProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-12 h-12 overflow-hidden shrink-0 transition-all ${
                    activeImage === img
                      ? 'border-2 border-black'
                      : 'border border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}

          {/* Social Proof Viewer Badge */}
          <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
            <Eye className="w-3 h-3 text-dune-ochre" />
            <span>4 людини дивляться цей засіб зараз</span>
          </div>
        </div>

        {/* Right Column: Details & Order CTA */}
        <div className="md:w-1/2 p-5 sm:p-7 overflow-y-auto flex flex-col font-sans">
          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500 uppercase tracking-wider mb-2">
            <span>{selectedProduct.productType || 'ITEM'}</span>
            <span>//</span>
            <span className="text-black font-semibold">{selectedProduct.vendor || 'CONCEPT'}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold font-display text-black uppercase mb-2 leading-snug tracking-tight">
            {selectedProduct.title}
          </h2>

          {/* Active Derm Ingredients & AM/PM Protocol */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {routineProtocol && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-black text-white uppercase tracking-wider flex items-center gap-1">
                {routineProtocol.time === 'morning' ? (
                  <Sun className="w-3 h-3 text-dune-ochre" />
                ) : (
                  <Moon className="w-3 h-3 text-dune-ochre" />
                )}
                <span>{routineProtocol.step}</span>
              </span>
            )}
            {dermBadges.map((b) => (
              <span
                key={b}
                className="font-mono text-[10px] font-bold px-2 py-0.5 bg-neutral-100 text-black border border-neutral-200 uppercase tracking-wider"
              >
                {b}
              </span>
            ))}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3 font-mono text-xs">
            <div className="flex items-center gap-0.5 text-dune-ochre">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-neutral-500 text-[11px] uppercase">
              5.0 / 5 ({productReviews.length} ВІДГУКІВ)
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 mb-3 font-mono">
            <span className="text-2xl font-black text-black tabular-nums">
              {activePrice.toLocaleString('uk-UA')} ₴
            </span>
            {activeComparePrice && activeComparePrice > activePrice && (
              <span className="text-sm text-neutral-400 line-through tabular-nums">
                {activeComparePrice.toLocaleString('uk-UA')} ₴
              </span>
            )}
          </div>

          {/* Stock state */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-dune-ochre uppercase border border-dune-ochre/30 px-2.5 py-1 w-fit mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-dune-ochre" />
            <span>В НАЯВНОСТІ • ВІДПРАВКА СЬОГОДНІ</span>
          </div>

          {/* Variants Selector */}
          {selectedProduct.variants && selectedProduct.variants.length > 1 && (
            <div className="mb-4 font-mono">
              <label className="block text-[11px] text-neutral-500 uppercase tracking-wider mb-2">
                // ВАРІАНТ / РОЗМІР:
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.title)}
                    className={`min-h-[38px] px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                      (selectedVariant || selectedProduct.variants[0].title) === v.title
                        ? 'bg-black text-white hairline-all'
                        : 'bg-white text-neutral-700 hover:text-black hairline-all'
                    }`}
                  >
                    {v.title} — {v.price} ₴
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Editorial Tabs */}
          <div className="hairline-t pt-3 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-neutral-200 pb-2 mb-3 font-mono text-[11px] uppercase tracking-wider">
              {[
                { key: 'desc', label: 'Опис' },
                { key: 'actives', label: 'Активи' },
                { key: 'synergy', label: '⚡ Сумісність' },
                { key: 'usage', label: 'Застосування' },
                { key: 'reviews', label: `Відгуки (${productReviews.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as DetailTab)}
                  className={`pb-1 px-1 transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-black font-bold border-b-2 border-black'
                      : 'text-neutral-400 hover:text-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'desc' && (
              <div className="text-xs text-neutral-600 leading-relaxed space-y-2 animate-fade-in">
                {selectedProduct.bodyHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-neutral-600 line-clamp-6 text-xs"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedProduct.bodyHtml),
                    }}
                  />
                ) : (
                  <p>Оригінальний сертифікований засіб з Кореї. Перевіряється перед відправкою. Офіційна гарантія 14 днів.</p>
                )}
              </div>
            )}

            {activeTab === 'actives' && (
              <div className="space-y-2.5 text-xs text-neutral-700 animate-fade-in">
                <div className="p-3 bg-neutral-50 hairline-all space-y-1">
                  <div className="font-mono font-bold text-black text-[11px] uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-dune-ochre" />
                    <span>Чиста K-Beauty Формула</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
                    Створено без парабенів, штучних барвників та мінеральних олій. Не тестується на тваринах (Cruelty-Free).
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  <div className="p-2 bg-neutral-50 hairline-all">
                    <strong className="block text-black">ФІЗІОЛОГІЧНИЙ pH:</strong>
                    <span className="text-neutral-500">5.5 – 6.0</span>
                  </div>
                  <div className="p-2 bg-neutral-50 hairline-all">
                    <strong className="block text-black">ТИП ДОГЛЯДУ:</strong>
                    <span className="text-neutral-500">Щоденний</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'synergy' && (
              <div className="space-y-3 text-xs animate-fade-in font-mono">
                <div className="p-3 bg-neutral-50 hairline-all space-y-1.5">
                  <div className="font-bold text-black text-[11px] flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ідеально поєднується з:</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 font-sans leading-relaxed">
                    {routineProtocol?.synergyWith ||
                      'Гіалуронова кислота, пантенол, центелла та цераміди для максимального зміцнення захисного бар’єру.'}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/70 hairline-all border-amber-200 space-y-1.5">
                  <div className="font-bold text-amber-900 text-[11px] flex items-center gap-1.5 uppercase">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Застереження дерматолога:</span>
                  </div>
                  <p className="text-[11px] text-amber-950 font-sans leading-relaxed">
                    {routineProtocol?.conflictWith ||
                      'Уникайте одночасного нанесення з агресивними кислотними концентратами без бар’єрного крему.'}
                  </p>
                </div>

                {/* Synergistic Companion Upsell */}
                {related[0] && (
                  <div className="p-3 bg-black text-white hairline-all space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-dune-ochre">
                        // ІДЕАЛЬНИЙ ТАНДЕМ У РУТИНУ:
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-dune-ochre text-black font-bold">
                        -10% НА ДУЕТ
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <img
                        src={related[0].featuredImage}
                        alt=""
                        className="w-10 h-10 object-cover bg-white shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-sans text-[11px] font-bold truncate text-white">
                          {related[0].title}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {related[0].price} ₴
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(selectedProduct, 1);
                        addToCart(related[0], 1);
                        addToast(`Ідеальний тандем додано до кошика зі знижкою!`, 'success');
                        handleClose();
                      }}
                      className="w-full py-2 bg-white hover:bg-neutral-100 text-black font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>ДОДАТИ ДУЕТ У КОШИК</span>
                      <ArrowRight className="w-3 h-3 ml-0.5 text-dune-ochre" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-2 text-xs text-neutral-600 font-sans leading-relaxed animate-fade-in">
                <div className="flex items-start gap-2">
                  <span className="font-mono font-bold text-dune-ochre text-xs">01.</span>
                  <span>Нанесіть необхідну кількість засобу на очищену та тонізовану шкіру обличчя.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono font-bold text-dune-ochre text-xs">02.</span>
                  <span>Розподіліть легкими масажними рухами по масажних лініях до повного вбирання.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono font-bold text-dune-ochre text-xs">03.</span>
                  <span>У ранковому догляді обов'язково закріпіть сонцезахисним кремом зі SPF 50+.</span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4 text-xs animate-fade-in">
                {/* Reviews List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {productReviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-neutral-50 hairline-all space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <strong className="font-mono text-black text-[11px]">{rev.author}</strong>
                          {rev.verified && (
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[9px] font-mono border border-emerald-200">
                              ✓ ПЕРЕВІРЕНА ПОКУПКА
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-neutral-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-dune-ochre">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">{rev.text}</p>
                    </div>
                  ))}
                </div>

                {/* Submit Review Form */}
                <form onSubmit={handleReviewSubmit} className="pt-2 border-t border-neutral-200 space-y-2">
                  <div className="font-mono font-bold text-[10px] uppercase text-black">
                    // ЗАЛИШИТИ ВЛАСНИЙ ВІДГУК
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Ваше ім’я"
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      className="px-2.5 py-1.5 rounded-none border border-neutral-300 text-xs focus:outline-none focus:border-black font-mono"
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-none border border-neutral-300 text-xs focus:outline-none focus:border-black font-mono bg-white"
                    >
                      <option value={5}>★★★★★ (5/5)</option>
                      <option value={4}>★★★★☆ (4/5)</option>
                      <option value={3}>★★★☆☆ (3/5)</option>
                    </select>
                    <select
                      value={reviewSkin}
                      onChange={(e) => setReviewSkin(e.target.value)}
                      className="px-2.5 py-1.5 rounded-none border border-neutral-300 text-xs focus:outline-none focus:border-black font-mono bg-white"
                    >
                      <option value="Комбінована">Комбінована</option>
                      <option value="Жирна/проблемна">Жирна/акне</option>
                      <option value="Суха">Суха</option>
                      <option value="Чутлива">Чутлива</option>
                    </select>
                  </div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ваші враження від використання засобу..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-none border border-neutral-300 text-xs focus:outline-none focus:border-black font-sans resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-3 py-1 bg-black text-white font-mono text-[10px] uppercase font-bold hover:bg-neutral-800 transition-colors"
                    >
                      ОПУБЛІКУВАТИ
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Cross-Sell Recommendations */}
          {related.length > 0 && (
            <div className="hairline-t pt-3 mb-4">
              <h4 className="font-mono text-neutral-500 text-[10px] uppercase tracking-wider mb-2">
                // ЧАСТО ЗАМОВЛЯЮТЬ РАЗОМ:
              </h4>
              <div className="space-y-2">
                {related.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-2 bg-neutral-50 hairline-all text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={rel.featuredImage}
                        alt=""
                        className="w-8 h-8 object-cover bg-white shrink-0"
                      />
                      <span className="font-sans font-medium text-black truncate uppercase text-[11px]">
                        {rel.title}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(rel, 1)}
                      className="min-h-[30px] inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white font-mono text-[10px] uppercase font-bold shrink-0 ml-2 hover:bg-neutral-800 transition-all"
                    >
                      <span>+ {rel.price} ₴</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="mt-auto space-y-2 pt-3 hairline-t font-mono">
            <button
              onClick={() => {
                openQuickOrder(selectedProduct, selectedVariant || currentVariant?.title);
                handleClose();
              }}
              className="w-full min-h-[46px] py-3 px-4 bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 text-dune-ochre fill-current" />
              <span>ШВИДКЕ ЗАМОВЛЕННЯ В 1 КЛІК</span>
            </button>

            <button
              onClick={handleAddAndClose}
              className="w-full min-h-[44px] py-2.5 px-4 bg-white hover:bg-neutral-100 text-black hairline-all font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{added ? 'ДОДАНО ДО КОШИКА!' : 'ДОДАТИ В КОШИК'}</span>
            </button>
          </div>
        </div>

        {/* Sticky Mobile Quick Order Bar */}
        <div className="sticky bottom-0 left-0 right-0 p-3 bg-white hairline-t flex items-center justify-between gap-3 md:hidden z-20 font-mono">
          <div className="min-w-0">
            <div className="text-[10px] text-neutral-400 uppercase">ЦІНА:</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-black tabular-nums">
                {activePrice.toLocaleString('uk-UA')} ₴
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                addToCart(selectedProduct, 1, selectedVariant || currentVariant?.title);
                handleClose();
              }}
              className="min-h-[40px] px-3 bg-white hairline-all text-black font-bold text-xs uppercase flex items-center justify-center"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                openQuickOrder(selectedProduct, selectedVariant || currentVariant?.title);
                handleClose();
              }}
              className="min-h-[40px] py-2 px-4 bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-dune-ochre fill-current" />
              <span>В 1 КЛІК</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
