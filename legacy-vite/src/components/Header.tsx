import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Settings,
  Phone,
  Sparkles,
  Truck,
  Search,
  Heart,
  Menu,
  X,
  ChevronDown,
  Percent,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DispatchCountdown } from './DispatchCountdown';

interface NavCategory {
  id: string;
  label: string;
  badge?: string;
  highlight?: boolean;
  subcategories?: { title: string; categoryKey: string }[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'face',
    label: 'ДОГЛЯД ЗА ОБЛИЧЧЯМ',
    subcategories: [
      { title: 'Всі засоби для обличчя', categoryKey: 'all' },
      { title: 'Очищення & Демакіяж', categoryKey: 'Очищення' },
      { title: 'Тонери & Есенції', categoryKey: 'Тонери & Есенції' },
      { title: 'Сироватки & Ампули', categoryKey: 'Сироватки & Ампули' },
      { title: 'Креми & Емульсії', categoryKey: 'Креми & Гелі' },
      { title: 'Сонцезахист (SPF 50+)', categoryKey: 'Сонцезахист (SPF)' },
      { title: 'Маски & Патчі', categoryKey: 'Маски' },
    ],
  },
  {
    id: 'hair',
    label: 'ВОЛОССЯ',
    subcategories: [
      { title: 'Шампуні для шкіри голови', categoryKey: 'Шампуні' },
      { title: 'Кондиціонери & Маски', categoryKey: 'Кондиціонери' },
      { title: 'Незмивний догляд & Олії', categoryKey: 'Незмивний догляд' },
      { title: 'Філлери та термозахист', categoryKey: 'Термозахист' },
    ],
  },
  {
    id: 'makeup',
    label: 'МАКІЯЖ',
    subcategories: [
      { title: 'Губи (Блиски, Тінти, Бальзами)', categoryKey: 'Губи' },
      { title: "Рум'яна & Хайлайтери", categoryKey: "Рум'яна & Хайлайтери" },
      { title: 'BB & CC креми', categoryKey: 'Креми' },
      { title: 'Пудри для фіксації', categoryKey: 'Пудри' },
    ],
  },
  {
    id: 'body',
    label: 'ТІЛО ТА АРОМАТИ',
    subcategories: [
      { title: 'Спреї для тіла та волосся', categoryKey: 'Тіло та Аромати' },
      { title: 'Креми & Баттери для тіла', categoryKey: 'Тіло та Аромати' },
      { title: 'Гелі та лосьйони', categoryKey: 'Тіло' },
    ],
  },
  {
    id: 'accessories',
    label: 'АКСЕСУАРИ',
    subcategories: [
      { title: 'Косметички та органайзери', categoryKey: 'Аксесуари' },
      { title: 'Пензлі для макіяжу', categoryKey: 'Аксесуари' },
    ],
  },
  {
    id: 'brands',
    label: 'БРЕНДИ',
    badge: '22+',
    subcategories: [
      { title: 'Rhode', categoryKey: 'Rhode' },
      { title: 'Sol de Janeiro', categoryKey: 'Sol de Janeiro' },
      { title: 'Fenty Beauty', categoryKey: 'Fenty Beauty' },
      { title: 'Rare Beauty', categoryKey: 'Rare Beauty' },
      { title: 'Summer Fridays', categoryKey: 'Summer Fridays' },
      { title: 'Dior', categoryKey: 'Dior' },
      { title: 'Hourglass', categoryKey: 'Hourglass' },
      { title: 'Charlotte Tilbury', categoryKey: 'Charlotte Tilbury' },
      { title: 'COSRX', categoryKey: 'COSRX' },
      { title: 'Beauty of Joseon', categoryKey: 'Beauty of Joseon' },
      { title: 'Round Lab', categoryKey: 'Round Lab' },
      { title: 'SKIN1004', categoryKey: 'SKIN1004' },
      { title: 'Dr. Althea', categoryKey: 'Dr. Althea' },
      { title: 'Anua', categoryKey: 'Anua' },
      { title: 'Torriden', categoryKey: 'Torriden' },
      { title: 'Manyo', categoryKey: 'Manyo' },
    ],
  },
  {
    id: 'sale',
    label: 'АКЦІЇ ДО -50%',
    badge: 'SALE',
    highlight: true,
  },
  {
    id: 'quiz',
    label: 'ПІДБІР ДОГЛЯДУ',
    badge: '-15%',
  },
];

export const Header: React.FC = () => {
  const {
    cart,
    wishlist,
    setIsAdminOpen,
    setIsCartDrawerOpen,
    setIsWishlistOpen,
    setIsSearchOpen,
    setIsQuizOpen,
    setIsTrackingOpen,
    isAdminOpen,
    openPolicyModal,
    storeSettings,
    filterByCategory,
    filterByBrand,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>('face');

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalWishlistCount = wishlist.length;

  const [isAdminVisible, setIsAdminVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        import.meta.env.DEV ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin')
      );
    }
    return false;
  });

  useEffect(() => {
    const updateVisibility = () => {
      if (
        import.meta.env.DEV ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin')
      ) {
        setIsAdminVisible(true);
      }
    };
    updateVisibility();
    window.addEventListener('hashchange', updateVisibility);
    return () => window.removeEventListener('hashchange', updateVisibility);
  }, []);

  // Close mobile drawer on route / escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const freeThreshold = storeSettings.freeShippingThreshold || 2000;
  const phoneFormatted = storeSettings.phone || '0 (800) 33-22-11';
  const cleanPhoneLink = `tel:${phoneFormatted.replace(/[^\d+]/g, '')}`;

  const handleCategoryClick = (cat: NavCategory, sub?: { title: string; categoryKey: string }) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);

    if (cat.id === 'quiz') {
      setIsQuizOpen(true);
      return;
    }

    if (cat.id === 'sale') {
      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (cat.id === 'brands') {
      if (sub) {
        filterByBrand(sub.categoryKey);
      } else {
        document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (sub) {
      filterByCategory(sub.categoryKey);
    } else {
      filterByCategory(cat.label);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white hairline-b shadow-xs transition-all">
      {/* 1. Top Utility Bar (Cosibella Style) */}
      <div className="bg-neutral-950 text-white text-[11px] font-mono tracking-wider py-1.5 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-neutral-200">
              <Truck className="w-3.5 h-3.5 text-[#dec400]" />
              <span>БЕЗКОШТОВНА ДОСТАВКА ВІД {freeThreshold.toLocaleString('uk-UA')} ₴</span>
            </span>
            <span className="hidden sm:inline text-neutral-600">//</span>
            <div className="hidden sm:flex items-center">
              <DispatchCountdown variant="banner" />
            </div>
          </div>

          <div className="flex items-center gap-4 text-neutral-300">
            <a
              href={cleanPhoneLink}
              className="flex items-center gap-1 hover:text-[#dec400] transition-colors"
            >
              <Phone className="w-3 h-3 text-[#dec400]" />
              <span className="hidden md:inline font-bold">{phoneFormatted}</span>
            </a>
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="hidden lg:inline hover:text-white transition-colors cursor-pointer"
            >
              ТТН Нова Пошта
            </button>
            <button
              onClick={() => openPolicyModal('about')}
              className="hidden md:inline hover:text-white transition-colors cursor-pointer"
            >
              Про нас
            </button>
            <span className="text-[10px] font-bold text-neutral-400 border border-neutral-700 px-1.5 py-0.5 rounded">
              UA
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Middle Bar: Hamburger | Logo | Search Input | Icons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-neutral-800 hover:text-black focus:outline-none"
            aria-label="Відкрити меню навігації"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <a href="#" className="flex flex-col group">
              <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-black group-hover:text-neutral-800 transition-colors">
                {storeSettings.storeName || 'MALLROOM'}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-medium tracking-widest text-neutral-500 uppercase -mt-1 flex items-center gap-1">
                <span>K-BEAUTY CONCEPT</span>
                <span className="text-[#dec400]">//</span>
                <span>ORIGINAL</span>
              </span>
            </a>
          </div>

          {/* Central Search Bar (Cosibella Style) */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-6 hidden sm:block">
            <div
              onClick={() => setIsSearchOpen(true)}
              className="relative flex items-center w-full min-h-[44px] px-4 bg-neutral-50 hover:bg-neutral-100 hairline-all rounded-md cursor-pointer transition-all group border border-neutral-300 hover:border-black"
            >
              <Search className="w-4 h-4 text-neutral-500 group-hover:text-black mr-2.5 transition-colors" />
              <span className="font-mono text-xs text-neutral-500 group-hover:text-neutral-700 select-none">
                Пошук за назвою, брендом (COSRX, Round Lab), потребою...
              </span>
              <kbd className="ml-auto hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-white border border-neutral-200 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 text-neutral-700 hover:text-black"
              aria-label="Пошук"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Quiz Routine Quick Button */}
            <button
              onClick={() => setIsQuizOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase text-black bg-[#dec400]/20 hover:bg-[#dec400]/40 border border-[#dec400]/50 rounded transition-all cursor-pointer"
              title="Підібрати рутину за 60 секунд"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
              <span>ТЕСТ ШКІРИ (-15%)</span>
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 sm:px-3 sm:py-2 text-neutral-700 hover:text-black rounded hover:bg-neutral-100 transition-colors flex items-center gap-1"
              title="Список бажань"
              aria-label="Список бажань"
            >
              <Heart
                className={`w-5 h-5 ${totalWishlistCount > 0 ? 'text-rose-500 fill-current' : ''}`}
              />
              <span className="hidden lg:inline text-xs font-mono font-medium">Бажане</span>
              {totalWishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:ml-1 bg-black text-white text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalWishlistCount}
                </span>
              )}
            </button>

            {/* Discreet Admin Button */}
            {(isAdminVisible || isAdminOpen) && (
              <button
                onClick={() => {
                  setIsAdminOpen(true);
                  if (typeof window !== 'undefined') {
                    window.location.hash = '#admin';
                  }
                }}
                className="hidden lg:inline-flex items-center p-2 text-neutral-500 hover:text-black"
                title="Панель керування"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Cart Button (Cosibella / High-Fashion) */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase rounded-md shadow-sm transition-all active:scale-95"
              aria-label="Кошик покупок"
            >
              <ShoppingBag className="w-4 h-4 text-[#dec400]" />
              <span className="hidden sm:inline">КОШИК</span>
              <span className="bg-white/20 text-[#dec400] text-[11px] px-1.5 py-0.5 rounded font-mono font-bold">
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Cosibella-Style Main Categories Navigation Bar (Desktop) */}
      <nav className="hidden lg:block bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-neutral-800">
            {NAV_CATEGORIES.map((cat) => (
              <li
                key={cat.id}
                className="relative group"
                onMouseEnter={() => cat.subcategories && setActiveDropdown(cat.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => handleCategoryClick(cat)}
                  className={`flex items-center gap-1.5 py-3 px-3 transition-colors cursor-pointer border-b-2 border-transparent hover:border-black ${
                    cat.highlight
                      ? 'text-rose-600 hover:text-rose-700 bg-rose-50/50 font-black'
                      : 'hover:text-black'
                  }`}
                >
                  {cat.highlight && <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
                  <span>{cat.label}</span>
                  {cat.badge && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        cat.highlight
                          ? 'bg-rose-600 text-white'
                          : 'bg-black text-white'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                  {cat.subcategories && (
                    <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-black group-hover:rotate-180 transition-transform" />
                  )}
                </button>

                {/* Dropdown Mega-Menu */}
                {cat.subcategories && activeDropdown === cat.id && (
                  <div className="absolute left-0 top-full w-72 bg-white border border-neutral-200 shadow-xl rounded-b-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 border-b border-neutral-100 text-[10px] text-neutral-400 font-mono">
                      // {cat.label}
                    </div>
                    {cat.subcategories.map((sub) => (
                      <button
                        key={sub.title}
                        onClick={() => handleCategoryClick(cat, sub)}
                        className="w-full text-left px-4 py-2 text-xs font-mono font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{sub.title}</span>
                        <ArrowRight className="w-3 h-3 text-neutral-300 hover:text-black" />
                      </button>
                    ))}
                    {cat.id === 'brands' && (
                      <div className="p-2 border-t border-neutral-100 bg-neutral-50">
                        <button
                          onClick={() => {
                            setActiveDropdown(null);
                            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full text-center py-1.5 text-[11px] font-mono font-bold text-black hover:underline uppercase"
                        >
                          Всі бренди в каталозі →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 4. Mobile Drawer Menu (Cosibella Style Off-Canvas) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-900 text-white">
              <div>
                <span className="font-display font-black text-xl tracking-tight">
                  {storeSettings.storeName || 'MALLROOM'}
                </span>
                <span className="block text-[10px] font-mono text-neutral-400">
                  МЕНЮ КАТЕГОРІЙ & БРЕНДІВ
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white"
                aria-label="Закрити меню"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50">
              <div
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex items-center px-3 py-2.5 bg-white border border-neutral-300 rounded text-xs font-mono text-neutral-500 cursor-pointer"
              >
                <Search className="w-4 h-4 mr-2 text-neutral-400" />
                <span>Пошук косметики або бренду...</span>
              </div>
            </div>

            {/* Categories Accordion */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-2">
                // КАТАЛОГ КОСМЕТИКИ
              </div>

              {NAV_CATEGORIES.map((cat) => {
                const isExpanded = mobileExpandedCat === cat.id;

                if (!cat.subcategories) {
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs font-mono font-bold uppercase transition-all ${
                        cat.highlight
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-black'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {cat.highlight && <Percent className="w-4 h-4 text-rose-600" />}
                        {cat.label}
                      </span>
                      {cat.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-black text-white">
                          {cat.badge}
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <div key={cat.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setMobileExpandedCat(isExpanded ? null : cat.id)}
                      className="w-full flex items-center justify-between p-3 bg-neutral-50 text-left text-xs font-mono font-bold uppercase text-black"
                    >
                      <span>{cat.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-500 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="bg-white p-2 divide-y divide-neutral-100">
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub.title}
                            onClick={() => handleCategoryClick(cat, sub)}
                            className="w-full text-left py-2 px-2 text-xs font-mono text-neutral-700 hover:text-black flex items-center justify-between"
                          >
                            <span>{sub.title}</span>
                            <ArrowRight className="w-3 h-3 text-neutral-300" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Quick Info & Policies Links */}
              <div className="pt-4 border-t border-neutral-200 space-y-1 text-xs font-mono">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  // СЕРВІС & КЛІЄНТАМ
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsTrackingOpen(true);
                  }}
                  className="w-full text-left py-2 px-1 text-neutral-600 hover:text-black flex items-center gap-2"
                >
                  <Truck className="w-4 h-4 text-[#dec400]" />
                  <span>Відстежити замовлення (ТТН)</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openPolicyModal('shipping');
                  }}
                  className="w-full text-left py-2 px-1 text-neutral-600 hover:text-black"
                >
                  Доставка та оплата
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openPolicyModal('about');
                  }}
                  className="w-full text-left py-2 px-1 text-neutral-600 hover:text-black"
                >
                  Про магазин та гарантію
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openPolicyModal('contacts');
                  }}
                  className="w-full text-left py-2 px-1 text-neutral-600 hover:text-black"
                >
                  Контакти
                </button>
              </div>
            </div>

            {/* Drawer Footer with Phone & Messengers */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 text-xs font-mono">
              <a
                href={cleanPhoneLink}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-black text-white font-bold rounded uppercase mb-2"
              >
                <Phone className="w-4 h-4 text-[#dec400]" />
                <span>{phoneFormatted}</span>
              </a>
              <div className="text-center text-[10px] text-neutral-500">
                Пн–Нд 10:00 — 20:00 • Київ, Україна
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
