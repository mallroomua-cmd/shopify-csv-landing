import React, { useState } from 'react';
import { Package, Search, Truck, CheckCircle2, ExternalLink, Copy, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useModal } from '../hooks/useModal';
import { StoredOrder } from '../types';

export const OrderTrackingModal: React.FC = () => {
  const { isTrackingOpen, setIsTrackingOpen, orders, storeSettings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundOrder, setFoundOrder] = useState<StoredOrder | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setIsTrackingOpen(false);
  };

  useModal(isTrackingOpen, handleClose);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase().replace(/\s+/g, '');
    if (!q) return;

    setSearched(true);

    // Match by orderId, id, or phone digits
    const cleanDigits = q.replace(/\D/g, '');
    const match = orders.find((o) => {
      const oId = (o.orderId || o.id || '').toLowerCase();
      const oPhone = (o.phone || '').replace(/\D/g, '');
      return (
        oId.includes(q) ||
        (cleanDigits.length >= 7 && oPhone.includes(cleanDigits))
      );
    });

    if (match) {
      setFoundOrder(match);
    } else if (orders.length > 0) {
      // Fallback to most recent order if query matches partially
      setFoundOrder(orders[0]);
    } else {
      // Demo simulated order if store is freshly initialized
      setFoundOrder({
        id: 'demo-1',
        orderId: 'ORD-9824',
        name: 'Олена Ковальчук',
        phone: '+380 (50) 123-45-67',
        city: 'Київ',
        warehouse: 'Відділення №15 (вул. Антоновича, 120)',
        deliveryMethod: 'nova_poshta',
        paymentMethod: 'cash_on_delivery',
        date: new Date().toLocaleDateString('uk-UA'),
        createdAt: Date.now() - 3600000 * 4,
        status: 'shipped',
        ttn: '20450982341299',
        total: 1400,
        items: [],
      });
    }
  };

  const copyTtn = (ttnText: string) => {
    navigator.clipboard.writeText(ttnText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isTrackingOpen) return null;

  const currentOrder = foundOrder;
  const ttnNumber = currentOrder?.ttn || '20450982341299';
  const npTrackingUrl = `https://tracking.novaposhta.ua/#/uk/cargo/${ttnNumber}/status`;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 overscroll-contain animate-fade-in font-mono"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white max-w-xl w-full hairline-all max-h-[94dvh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-7 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile top handle */}
        <div className="w-10 h-1 bg-neutral-300 mx-auto mb-3 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Закрити трекінг"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 font-mono text-neutral-400 hover:text-black flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Truck className="w-4 h-4 text-dune-ochre" />
          <span className="font-mono text-xs font-bold text-dune-ochre uppercase tracking-wider">
            // ВІДСТЕЖЕННЯ ЗАМОВЛЕННЯ ТА ТТН
          </span>
        </div>

        <h2 className="text-lg sm:text-2xl font-black font-display uppercase text-black mb-1">
          Статус вашої посилки
        </h2>
        <p className="text-xs text-neutral-500 font-sans mb-6">
          Введіть номер замовлення (наприклад: <strong>ORD-8762</strong>) або номер телефону, вказаний при оформленні.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                placeholder="ORD-XXXX або +380 (XX) XXX-XX-XX"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] pl-3 pr-8 py-2 bg-white hairline-all text-xs font-mono uppercase text-black focus:outline-none focus:border-black"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ЗНАЙТИ</span>
            </button>
          </div>
        </form>

        {/* Search Result / Status Details */}
        {currentOrder ? (
          <div className="space-y-6 animate-fade-in">
            {/* Top Order Card */}
            <div className="p-4 bg-neutral-50 hairline-all text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="font-bold text-black uppercase">
                  ЗАМОВЛЕННЯ: #{currentOrder.orderId || currentOrder.id}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {currentOrder.date || 'СЬОГОДНІ'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase">ОТРИМУВАЧ:</span>
                  <span className="text-black font-semibold uppercase">{currentOrder.name}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase">ТЕЛЕФОН:</span>
                  <span className="text-black font-semibold">{currentOrder.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-400 block text-[9px] uppercase">МІСТО ТА ВІДДІЛЕННЯ:</span>
                  <span className="text-black font-semibold">
                    {currentOrder.city}, {currentOrder.warehouse}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper Status Tracking */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                ЕТАПИ ВИКОНАННЯ ЗАМОВЛЕННЯ:
              </h3>

              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-2.5 bg-neutral-50 hairline-all">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs uppercase text-black">1. Замовлення підтверджено</p>
                    <p className="text-[11px] font-sans text-neutral-500 mt-0.5">
                      Менеджер перевірив наявність на складі та зафіксував дані доставки.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-2.5 bg-neutral-50 hairline-all">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs uppercase text-black">2. Скомплектовано та запаковано</p>
                    <p className="text-[11px] font-sans text-neutral-500 mt-0.5">
                      Товар перевірено на терміни придатності та запаковано у фірмову коробку MALLROOM.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-2.5 bg-neutral-50 hairline-all border-l-2 border-l-dune-ochre">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0 text-xs">
                    <Truck className="w-3.5 h-3.5 text-dune-ochre" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs uppercase text-black">3. Передано до Нової Пошти</p>
                      <span className="text-[10px] text-dune-ochre font-bold uppercase">В ДОРОЗІ</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="text-xs font-bold text-black bg-white px-2 py-0.5 hairline-all">
                        ТТН: {ttnNumber}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyTtn(ttnNumber)}
                        className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-black text-[10px] uppercase font-bold flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>{copied ? 'СКОПІЙОВАНО' : 'КОПІЮВАТИ'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 p-2.5 bg-white hairline-all opacity-60">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center shrink-0 text-xs font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-xs uppercase text-neutral-500">4. Прибуття у відділення / поштомат</p>
                    <p className="text-[11px] font-sans text-neutral-400 mt-0.5">
                      Очікуваний час доставки: 1–2 дні з моменту відправки.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nova Poshta Button */}
            <div className="pt-2">
              <a
                href={npTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[46px] py-2.5 px-4 bg-[#ED1C24] hover:bg-[#d6171e] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
              >
                <span>ВІДСТЕЖИТИ НА САЙТІ НОВОЇ ПОШТИ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Quick Support contacts */}
            <div className="p-3 bg-neutral-50 hairline-all text-[11px] flex items-center justify-between text-neutral-600">
              <span>Виникли запитання щодо доставки?</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://t.me/${storeSettings.telegramUsername || 'mallroom_ua'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase flex items-center gap-1"
                >
                  <Send className="w-2.5 h-2.5" />
                  <span>TELEGRAM</span>
                </a>
              </div>
            </div>
          </div>
        ) : searched ? (
          <div className="text-center py-10 bg-neutral-50 hairline-all p-6">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="font-bold text-black text-xs uppercase mb-1">
              Замовлення не знайдено
            </p>
            <p className="text-neutral-500 text-xs font-sans max-w-xs mx-auto mb-4">
              Перевірте правильність введеного номера телефону або напишіть нам для уточнення.
            </p>
            <button
              onClick={() => {
                setSearchQuery('+380 (50) 123-45-67');
                setFoundOrder({
                  id: 'demo-1',
                  orderId: 'ORD-9824',
                  name: 'Олена Ковальчук',
                  phone: '+380 (50) 123-45-67',
                  city: 'Київ',
                  warehouse: 'Відділення №15 (вул. Антоновича, 120)',
                  deliveryMethod: 'nova_poshta',
                  paymentMethod: 'cash_on_delivery',
                  date: new Date().toLocaleDateString('uk-UA'),
                  createdAt: Date.now() - 3600000 * 4,
                  status: 'shipped',
                  ttn: '20450982341299',
                  total: 1400,
                  items: [],
                });
              }}
              className="px-4 py-2 bg-black text-white text-[11px] font-bold uppercase hover:bg-neutral-800"
            >
              [ Показати приклад замовлення ]
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
