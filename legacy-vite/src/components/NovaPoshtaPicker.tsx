import React, { useState, useEffect } from 'react';
import { Building2, Package, Truck, MapPin, Check } from 'lucide-react';
import { POPULAR_UA_CITIES } from '../lib/formatters';

export type DeliveryType = 'branch' | 'poshtomat' | 'courier';

interface NovaPoshtaPickerProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  warehouse: string;
  onWarehouseChange: (warehouse: string) => void;
}

const COMMON_BRANCH_NUMBERS = ['1', '2', '3', '5', '10', '15', '20', '50', '100'];

export const NovaPoshtaPicker: React.FC<NovaPoshtaPickerProps> = ({
  selectedCity,
  onCityChange,
  warehouse,
  onWarehouseChange,
}) => {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('branch');
  const [citySearch, setCitySearch] = useState(selectedCity || '');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);

  // Restore saved delivery preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mallroom_last_delivery');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.city && !selectedCity) {
          onCityChange(parsed.city);
          setCitySearch(parsed.city);
        }
        if (parsed.warehouse && !warehouse) {
          onWarehouseChange(parsed.warehouse);
          setHasRestored(true);
        }
        if (parsed.deliveryType) {
          setDeliveryType(parsed.deliveryType);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Sync citySearch if selectedCity changes externally
  useEffect(() => {
    if (selectedCity && selectedCity !== citySearch) {
      setCitySearch(selectedCity);
    }
  }, [selectedCity]);

  // Save changes to localStorage for returning visits
  const persistSelection = (cityVal: string, whVal: string, typeVal: DeliveryType) => {
    try {
      localStorage.setItem(
        'mallroom_last_delivery',
        JSON.stringify({ city: cityVal, warehouse: whVal, deliveryType: typeVal })
      );
    } catch {
      // Ignore
    }
  };

  const handleSelectCity = (city: string) => {
    onCityChange(city);
    setCitySearch(city);
    setIsCityDropdownOpen(false);
    persistSelection(city, warehouse, deliveryType);
  };

  const handleSelectType = (type: DeliveryType) => {
    setDeliveryType(type);
    let newWh = warehouse;
    if (type === 'branch' && warehouse.includes('Поштомат')) {
      newWh = 'Відділення №1';
      onWarehouseChange(newWh);
    } else if (type === 'poshtomat' && warehouse.includes('Відділення')) {
      newWh = 'Поштомат №1001';
      onWarehouseChange(newWh);
    }
    persistSelection(selectedCity, newWh, type);
  };

  const handleBranchQuickPick = (num: string) => {
    const val = `Відділення №${num}`;
    onWarehouseChange(val);
    persistSelection(selectedCity, val, deliveryType);
  };

  const handlePoshtomatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onWarehouseChange(val);
    persistSelection(selectedCity, val, deliveryType);
  };

  const filteredCities = POPULAR_UA_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.trim().toLowerCase())
  );

  return (
    <div className="space-y-3 font-mono">
      {hasRestored && (
        <div className="flex items-center gap-1.5 text-[10px] text-dune-ochre bg-amber-500/10 px-2 py-1 hairline-all">
          <Check className="w-3 h-3 text-dune-ochre shrink-0" />
          <span>Відновлено збережені дані вашого відділення</span>
        </div>
      )}

      {/* Delivery Type Switcher */}
      <div>
        <label className="block text-[10px] sm:text-[11px] font-bold text-black uppercase mb-1.5">
          ФОРМАТ ОТРИМАННЯ НОВОЮ ПОШТОЮ
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectType('branch')}
            className={`min-h-[42px] px-2 py-1.5 hairline-all text-[10px] sm:text-xs font-bold uppercase flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              deliveryType === 'branch'
                ? 'bg-black text-white'
                : 'bg-white text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="truncate">ВІДДІЛЕННЯ</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType('poshtomat')}
            className={`min-h-[42px] px-2 py-1.5 hairline-all text-[10px] sm:text-xs font-bold uppercase flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              deliveryType === 'poshtomat'
                ? 'bg-black text-white'
                : 'bg-white text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="truncate">ПОШТОМАТ 24/7</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType('courier')}
            className={`min-h-[42px] px-2 py-1.5 hairline-all text-[10px] sm:text-xs font-bold uppercase flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              deliveryType === 'courier'
                ? 'bg-black text-white'
                : 'bg-white text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="truncate">КУР'ЄР</span>
          </button>
        </div>
      </div>

      {/* City Autocomplete */}
      <div className="relative">
        <label className="block text-[10px] sm:text-[11px] font-bold text-black uppercase mb-1">
          МІСТО ДОСТАВКИ *
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder="Введіть або оберіть місто (Київ, Львів...)"
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              onCityChange(e.target.value);
              setIsCityDropdownOpen(true);
            }}
            onFocus={() => setIsCityDropdownOpen(true)}
            className="w-full min-h-[42px] pl-8 pr-3 py-2 bg-white hairline-all text-xs text-black focus:outline-none focus:border-black uppercase font-medium"
          />
          <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Popular City Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1.5 pb-1 scrollbar-none text-[10px]">
          <span className="text-neutral-400 shrink-0 text-[9px] uppercase">// ШВИДКИЙ ВИБІР:</span>
          {POPULAR_UA_CITIES.slice(0, 6).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleSelectCity(c)}
              className={`px-2 py-0.5 text-[10px] uppercase shrink-0 transition-colors ${
                selectedCity === c
                  ? 'bg-black text-white font-bold'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-black'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search Results Dropdown */}
        {isCityDropdownOpen && citySearch.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto bg-white hairline-all shadow-xl">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 flex items-center justify-between text-black transition-colors"
                >
                  <span>{city}</span>
                  {selectedCity === city && <Check className="w-3 h-3 text-dune-ochre" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-[11px] text-neutral-500">
                Місто буде записано: <strong>{citySearch}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warehouse / Locker Selector */}
      {deliveryType === 'branch' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] sm:text-[11px] font-bold text-black uppercase">
              НОМЕР АБО АДРЕСА ВІДДІЛЕННЯ *
            </label>
            <span className="text-[10px] text-neutral-400">ДО 30 КГ / ВАНТАЖНЕ</span>
          </div>
          
          <input
            type="text"
            required
            placeholder="Наприклад: Відділення №1 (або введіть адресу)"
            value={warehouse}
            onChange={(e) => {
              onWarehouseChange(e.target.value);
              persistSelection(selectedCity, e.target.value, deliveryType);
            }}
            className="w-full min-h-[42px] px-3 py-2 bg-white hairline-all text-xs text-black focus:outline-none focus:border-black font-medium mb-1.5"
          />

          {/* Quick branch buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
            <span className="text-neutral-400 shrink-0 text-[9px] uppercase">// № ВІДДІЛЕННЯ:</span>
            {COMMON_BRANCH_NUMBERS.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleBranchQuickPick(num)}
                className={`px-2 py-0.5 text-[10px] uppercase shrink-0 transition-colors ${
                  warehouse === `Відділення №${num}`
                    ? 'bg-black text-white font-bold'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-black'
                }`}
              >
                №{num}
              </button>
            ))}
          </div>
        </div>
      )}

      {deliveryType === 'poshtomat' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] sm:text-[11px] font-bold text-black uppercase">
              НОМЕР ПОШТОМАТУ НОВОЇ ПОШТИ *
            </label>
            <span className="text-[10px] text-dune-ochre font-bold">24/7 БІЛЯ ДОМУ</span>
          </div>
          <input
            type="text"
            required
            placeholder="Наприклад: Поштомат №5432 (вул. Хрещатик)"
            value={warehouse.startsWith('Поштомат') ? warehouse : `Поштомат ${warehouse}`}
            onChange={handlePoshtomatChange}
            className="w-full min-h-[42px] px-3 py-2 bg-white hairline-all text-xs text-black focus:outline-none focus:border-black font-medium mb-1"
          />
          <p className="text-[10px] text-neutral-500 font-sans">
            Отримання за допомогою додатку «Нова Пошта» через Bluetooth у будь-який час доби.
          </p>
        </div>
      )}

      {deliveryType === 'courier' && (
        <div>
          <label className="block text-[10px] sm:text-[11px] font-bold text-black uppercase mb-1">
            АДРЕСА ДЛЯ КУР'ЄРА (ВУЛИЦЯ, БУДИНОК, КВАРТИРА) *
          </label>
          <input
            type="text"
            required
            placeholder="вул. Шевченка, буд. 10, кв. 25"
            value={warehouse.replace(/^(Відділення|Поштомат).*/, '')}
            onChange={(e) => {
              const val = `Кур'єр: ${e.target.value}`;
              onWarehouseChange(val);
              persistSelection(selectedCity, val, deliveryType);
            }}
            className="w-full min-h-[42px] px-3 py-2 bg-white hairline-all text-xs text-black focus:outline-none focus:border-black font-medium mb-1"
          />
          <p className="text-[10px] text-neutral-500 font-sans">
            Кур'єр Нової Пошти зателефонує за 30-60 хв до доставки для узгодження часу.
          </p>
        </div>
      )}
    </div>
  );
};
