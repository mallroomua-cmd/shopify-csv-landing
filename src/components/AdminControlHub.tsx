import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import {
  X,
  Upload,
  Settings2,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RotateCcw,
  Download,
  Terminal,
  ShoppingBag,
  ShieldCheck,
  Play,
  Send,
  FileCode,
  FileJson,
  Package,
  Search,
  Plus,
  Trash2,
  Edit3,
  Phone,
  MessageSquare,
  RefreshCw,
  Eye,
  Check,
  AlertTriangle,
  Database,
  SlidersHorizontal,
  Tag,
  Copy,
  Truck,
  Printer,
  Users,
  Cloud,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductFormModal } from './ProductFormModal';
import { SupabaseSettingsCard } from './SupabaseSettingsCard';
import { isSupabaseConfigured, STORE_ID } from '../lib/supabase';
import { Product, OrderStatus, StoredOrder, CsvPreviewResult, StoreSettings } from '../types';
import { SAMPLE_SHOPIFY_CSV } from '../lib/sample-data';
import {
  eventHistory,
  subscribeToAnalytics,
  AnalyticsEventLog,
  trackPurchase,
  trackAddToCart,
  trackBeginCheckout,
} from '../lib/analytics';
import { downloadGoogleMerchantXml } from '../lib/merchant-xml';
import { sendTelegramOrderNotification } from '../lib/telegram';
import {
  readCsvFileWithEncoding,
  validateCsvPreview,
  downloadShopifyCsv,
} from '../lib/shopify-parser';
import { normalizeUaPhoneForAnalytics } from '../lib/formatters';
import { useModal } from '../hooks/useModal';


export const AdminControlHub: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    products,
    uploadCsv,
    resetToDemo,
    updateProduct,
    addProduct,
    deleteProduct,
    setAllProducts,
    orders,
    outboxCount,
    updateOrderStatus,
    updateOrderTtn,
    deleteOrder,
    clearOrders,
    retryTelegramNotification,
    flushPendingOutbox,
    analyticsConfig,
    updateAnalyticsConfig,
    storeSettings,
    updateStoreSettings,
    promoCodes,
    addPromoCode,
    deletePromoCode,
    togglePromoCode,
    addToast,
  } = useStore();

  const handleClose = useCallback(() => {
    setIsAdminOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [setIsAdminOpen]);
  useModal(isAdminOpen, handleClose);

  // Active Hub Tab
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'clients' | 'settings' | 'feed' | 'marketing' | 'supabase'>('products');

  // Module: Clients & CRM state
  const [clientSearch, setClientSearch] = useState('');
  const [clientSegmentFilter, setClientSegmentFilter] = useState<'ALL' | 'VIP' | 'REGULAR' | 'NEW'>('ALL');
  const [selectedClientPhone, setSelectedClientPhone] = useState<string | null>(null);

  // PIN Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('shopify_admin_authed') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [storedPin, setStoredPin] = useState(() => {
    return localStorage.getItem('shopify_admin_pin') || (import.meta.env.VITE_ADMIN_PIN as string) || '1234';
  });
  const [newPin, setNewPin] = useState('');
  const [pinNotice, setPinNotice] = useState(false);

  // Module 1: Feed state
  const [dragActive, setDragActive] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewResult | null>(null);
  const [pendingCsvString, setPendingCsvString] = useState<string | null>(null);
  const [isApplyingFeed, setIsApplyingFeed] = useState(false);
  const [feedSuccess, setFeedSuccess] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Module 2: Products Manager state
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'TITLE_ASC'>('DEFAULT');

  // Inline edit state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<number>(0);
  const [comparePriceInput, setComparePriceInput] = useState<number | undefined>(undefined);

  // Add / Edit Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Tag Quick Adder Popover
  const [quickTagProductId, setQuickTagProductId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Module 3: Orders Manager state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<StoredOrder | null>(null);
  const [isFlushingOutbox, setIsFlushingOutbox] = useState(false);
  const [outboxFeedback, setOutboxFeedback] = useState<string | null>(null);

  // Module 5: Store Settings & Messengers state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Module 5: Promo Codes Engine state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoDiscountType, setPromoDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [promoDiscountVal, setPromoDiscountVal] = useState<number>(10);
  const [promoMinOrder, setPromoMinOrder] = useState<number>(500);

  // Module 3: TTN Tracker state
  const [ttnInputs, setTtnInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setSettingsForm(storeSettings);
  }, [storeSettings]);

  // Module 4: Marketing & Integrations state
  const [gaId, setGaId] = useState(analyticsConfig.gaMeasurementId);
  const [gadsId, setGadsId] = useState(analyticsConfig.googleAdsId);
  const [gadsLabel, setGadsLabel] = useState(analyticsConfig.googleAdsConversionLabel);
  const [fbPixelId, setFbPixelId] = useState(analyticsConfig.fbPixelId || '');
  const [gmcTag, setGmcTag] = useState(analyticsConfig.merchantCenterTag);
  const [gtmId, setGtmId] = useState(analyticsConfig.gtmId);
  const [tgToken, setTgToken] = useState(analyticsConfig.telegramBotToken);
  const [tgChatId, setTgChatId] = useState(analyticsConfig.telegramChatId);
  const [npKey, setNpKey] = useState(analyticsConfig.novaPoshtaApiKey);
  const [marketingSavedNotice, setMarketingSavedNotice] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  // Live Debugger logs
  const [logs, setLogs] = useState<AnalyticsEventLog[]>([]);
  const [logFilterPlatform, setLogFilterPlatform] = useState<string>('ALL');

  // Search input ref for keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGaId(analyticsConfig.gaMeasurementId);
    setGadsId(analyticsConfig.googleAdsId);
    setGadsLabel(analyticsConfig.googleAdsConversionLabel);
    setFbPixelId(analyticsConfig.fbPixelId || '');
    setGmcTag(analyticsConfig.merchantCenterTag);
    setGtmId(analyticsConfig.gtmId);
    setTgToken(analyticsConfig.telegramBotToken);
    setTgChatId(analyticsConfig.telegramChatId);
    setNpKey(analyticsConfig.novaPoshtaApiKey);
  }, [analyticsConfig]);

  useEffect(() => {
    setLogs([...eventHistory]);
    const unsub = subscribeToAnalytics((newEvent) => {
      setLogs((prev) => [newEvent, ...prev.slice(0, 70)]);
    });
    return unsub;
  }, []);

  // Keyboard shortcut: Press '/' to focus product search when in products tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAdminOpen) return;
      if (e.key === '/' && activeTab === 'products' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminOpen, activeTab]);

  // --- Auth Handlers ---
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === storedPin.trim()) {
      setIsAuthenticated(true);
      sessionStorage.setItem('shopify_admin_authed', 'true');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleUpdatePin = () => {
    if (newPin.trim().length >= 4) {
      localStorage.setItem('shopify_admin_pin', newPin.trim());
      setStoredPin(newPin.trim());
      setNewPin('');
      setPinNotice(true);
      setTimeout(() => setPinNotice(false), 2500);
    }
  };

  // --- Module 1: Feed Handlers ---
  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFeedError('Будь ласка, оберіть файл у форматі .csv');
      return;
    }

    setFeedError(null);
    setFeedSuccess(null);
    try {
      const text = await readCsvFileWithEncoding(file);
      const preview = await validateCsvPreview(text, file.name, file.size);
      if (preview.validProducts.length === 0) {
        throw new Error('У файлі не знайдено валідних активних товарів Shopify');
      }
      setPendingCsvString(text);
      setCsvPreview(preview);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка зчитування CSV файлу';
      setFeedError(msg);
    }
  };

  const handleApplyCsvFeed = async () => {
    if (!pendingCsvString) return;
    setIsApplyingFeed(true);
    setFeedError(null);
    try {
      const res = await uploadCsv(pendingCsvString);
      setFeedSuccess(`Успішно імпортовано та збережено в IndexedDB: ${res.count} товарів!`);
      setCsvPreview(null);
      setPendingCsvString(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка імпорту каталогу';
      setFeedError(msg);
    } finally {
      setIsApplyingFeed(false);
    }
  };

  const handleCancelPreview = () => {
    setCsvPreview(null);
    setPendingCsvString(null);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_SHOPIFY_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'shopify_products_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'catalog.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Module 2: Product Management Handlers ---
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.productType) set.add(p.productType);
    });
    return Array.from(set);
  }, [products]);

  const allVendors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.vendor) set.add(p.vendor);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (productSearch.trim()) {
      const query = productSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.vendor.toLowerCase().includes(query) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter((p) => p.productType === categoryFilter);
    }

    if (stockFilter === 'IN_STOCK') {
      list = list.filter((p) => p.available);
    } else if (stockFilter === 'OUT_OF_STOCK') {
      list = list.filter((p) => !p.available);
    }

    if (sortBy === 'PRICE_ASC') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_DESC') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'TITLE_ASC') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'uk'));
    }

    return list;
  }, [products, productSearch, categoryFilter, stockFilter, sortBy]);

  const handleStartInlineEdit = (p: Product) => {
    setEditingPriceId(p.id);
    setPriceInput(p.price);
    setComparePriceInput(p.compareAtPrice);
  };

  const handleSaveInlineEdit = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    if (priceInput <= 0) return;

    const updated: Product = {
      ...target,
      price: priceInput,
      compareAtPrice: comparePriceInput && comparePriceInput > priceInput ? comparePriceInput : undefined,
      variants: target.variants.map((v) => ({
        ...v,
        price: priceInput,
        compareAtPrice: comparePriceInput && comparePriceInput > priceInput ? comparePriceInput : undefined,
      })),
    };

    await updateProduct(updated);
    setEditingPriceId(null);
  };

  const handleToggleStock = async (product: Product) => {
    const updated: Product = {
      ...product,
      available: !product.available,
    };
    await updateProduct(updated);
  };

  const handleRemoveTag = async (product: Product, tagToRemove: string) => {
    const updated: Product = {
      ...product,
      tags: product.tags.filter((t) => t !== tagToRemove),
    };
    await updateProduct(updated);
  };

  const handleAddTag = async (product: Product, tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed || product.tags.includes(trimmed)) return;
    const updated: Product = {
      ...product,
      tags: [...product.tags, trimmed],
    };
    await updateProduct(updated);
    setNewTagInput('');
    setQuickTagProductId(null);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setIsProductModalOpen(true);
  };

  const handleDuplicateProduct = async (prod: Product) => {
    const newProduct: Product = {
      ...prod,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${prod.title} (Копія)`,
      handle: `${prod.handle}-copy-${Date.now().toString().slice(-4)}`,
    };
    await addProduct(newProduct);
    addToast(`Товар скопійовано: ${newProduct.title}`, 'success');
  };

  // --- Module 3: Orders Handlers ---
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q) ||
          o.warehouse.toLowerCase().includes(q)
      );
    }

    if (orderStatusFilter !== 'ALL') {
      list = list.filter((o) => o.status === orderStatusFilter);
    }

    return list;
  }, [orders, orderSearch, orderStatusFilter]);

  const ordersKpi = useMemo(() => {
    const totalCount = orders.length;
    const newCount = orders.filter((o) => o.status === 'new').length;
    const totalSum = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    return { totalCount, newCount, totalSum };
  }, [orders]);

  const handleFlushOutboxClick = async () => {
    setIsFlushingOutbox(true);
    setOutboxFeedback(null);
    try {
      const res = await flushPendingOutbox();
      setOutboxFeedback(`Синхронізація завершена: надіслано ${res.sent}, залишилось ${res.remaining}`);
    } catch {
      setOutboxFeedback('Помилка синхронізації з чергою');
    } finally {
      setIsFlushingOutbox(false);
      setTimeout(() => setOutboxFeedback(null), 4000);
    }
  };

  const handleRetryTelegramForOrder = async (orderId: string) => {
    const res = await retryTelegramNotification(orderId);
    if (res.success) {
      if (selectedOrderDetails && selectedOrderDetails.orderId === orderId) {
        setSelectedOrderDetails({ ...selectedOrderDetails, syncedToTelegram: true });
      }
      alert('✅ Замовлення успішно надіслано в Telegram!');
    } else {
      alert(`❌ Помилка: ${res.error || 'Не вдалося надіслати'}`);
    }
  };

  const handleSaveTtn = async (orderId: string) => {
    const ttn = ttnInputs[orderId] ?? '';
    await updateOrderTtn(orderId, ttn);
    addToast(`ТТН для #${orderId} успішно збережено`, 'success');
    if (selectedOrderDetails && selectedOrderDetails.orderId === orderId) {
      setSelectedOrderDetails((prev) => (prev ? { ...prev, ttn } : null));
    }
  };

  const handleCopyForNovaPoshta = (ord: StoredOrder) => {
    const text = `Одержувач: ${ord.name}\nТелефон: ${ord.phone}\nМісто: ${ord.city || 'Уточнюється'}\nВідділення: ${ord.warehouse || 'Уточнюється'}\nОголошена вартість: ${ord.total} грн\nОплата: ${ord.paymentMethod === 'card' ? 'Оплачено карткою' : 'Накладений платіж'}`;
    navigator.clipboard.writeText(text);
    addToast('Дані клієнта скопійовано для додатку Нової Пошти', 'success');
  };

  const handleExportOrdersCsv = () => {
    if (orders.length === 0) {
      addToast('Немає замовлень для експорту', 'info');
      return;
    }
    const headers = [
      'Номер',
      'Дата',
      'Статус',
      'Клієнт',
      'Телефон',
      'Місто',
      'Служба',
      'Відділення',
      'Оплата',
      'Сума (грн)',
      'Промокод',
      'Знижка (грн)',
      'ТТН',
      'Склад замовлення',
    ];
    const rows = orders.map((ord) => [
      `"${ord.orderId}"`,
      `"${ord.date || ''}"`,
      `"${ord.status}"`,
      `"${(ord.name || '').replace(/"/g, '""')}"`,
      `"${ord.phone || ''}"`,
      `"${(ord.city || '').replace(/"/g, '""')}"`,
      `"${ord.deliveryMethod || ''}"`,
      `"${(ord.warehouse || '').replace(/"/g, '""')}"`,
      `"${ord.paymentMethod || ''}"`,
      ord.total,
      `"${ord.promoCode || ''}"`,
      ord.discountAmount || 0,
      `"${ord.ttn || ''}"`,
      `"${(ord.items || [])
        .map((i) => `${i.product.title} (${i.selectedVariant || 'базовий'}) x${i.quantity}`)
        .join('; ')
        .replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Замовлення успішно експортовано у файл CSV', 'success');
  };

  // --- Module: Print Packing Slip (Накладна) ---
  const handlePrintOrderSlip = (ord: StoredOrder) => {
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) {
      addToast('Дозвольте спливаючі вікна для друку накладної', 'error');
      return;
    }
    const itemsHtml = ord.items?.map(it => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600;">${it.product?.title || 'Товар'}</div>
          ${it.selectedVariant ? `<div style="font-size: 11px; color: #64748b;">Варіант: ${it.selectedVariant}</div>` : ''}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${it.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${(it.product?.price || 0).toLocaleString('uk-UA')} ₴</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-family: monospace;">${((it.product?.price || 0) * it.quantity).toLocaleString('uk-UA')} ₴</td>
      </tr>
    `).join('') || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Товарна накладна #${ord.orderId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; }
          .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 8px; }
          .box h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #cbd5e1; }
          .totals { margin-left: auto; width: 320px; font-size: 13px; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand { font-size: 18px; font-weight: 800; border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 6px; }
          .notes { margin-top: 20px; font-size: 12px; background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 6px; }
          .footer { margin-top: 48px; border-top: 1px dashed #cbd5e1; padding-top: 24px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">${storeSettings.storeName || 'DUNE ATELIER'}</div>
            <div class="meta">Товарно-транспортна накладна / Комплектувальний лист</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 800; font-family: monospace;">#${ord.orderId}</div>
            <div class="meta">${ord.date}</div>
            ${ord.ttn ? `<div style="font-weight: 700; color: #0284c7; margin-top: 4px; font-family: monospace;">ТТН: ${ord.ttn}</div>` : ''}
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <h4>Клієнт / Одержувач</h4>
            <div style="font-weight: 700; font-size: 15px;">${ord.name}</div>
            <div style="font-family: monospace; margin-top: 2px;">${ord.phone}</div>
          </div>
          <div class="box">
            <h4>Доставка та Оплата</h4>
            <div>Місто: <strong>${ord.city || 'Уточнюється'}</strong></div>
            <div>Служба / Відділення: <strong>${ord.warehouse || 'Уточнюється'}</strong></div>
            <div>Оплата: <strong>${ord.paymentMethod === 'card' ? 'Оплачено онлайн карткою' : 'Накладений платіж (при отриманні)'}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Товар</th>
              <th style="text-align: center;">К-сть</th>
              <th style="text-align: right;">Ціна</th>
              <th style="text-align: right;">Сума</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          ${ord.promoCode ? `<div><span>Промокод (${ord.promoCode}):</span><span>-${ord.discountAmount?.toLocaleString('uk-UA')} ₴</span></div>` : ''}
          <div class="grand"><span>До сплати:</span><span>${ord.total?.toLocaleString('uk-UA')} ₴</span></div>
        </div>

        ${ord.notes ? `<div class="notes"><strong>Коментар покупця:</strong> ${ord.notes}</div>` : ''}

        <div class="footer">
          <div>Відпустив: _____________________</div>
          <div>Отримав: _____________________</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // --- Module: Clients & CRM Data Aggregation ---
  const uniqueClients = useMemo(() => {
    const map = new Map<string, {
      phone: string;
      name: string;
      ordersCount: number;
      totalSpent: number;
      lastOrderDate: string;
      city: string;
      status: 'vip' | 'regular' | 'new';
      orders: StoredOrder[];
    }>();

    orders.forEach((ord) => {
      const cleanPhone = normalizeUaPhoneForAnalytics(ord.phone) || ord.phone || 'Невідомий';
      const existing = map.get(cleanPhone);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += (ord.total || 0);
        existing.orders.push(ord);
        if (ord.date > existing.lastOrderDate) {
          existing.lastOrderDate = ord.date;
        }
        if (ord.name && (!existing.name || existing.name === 'Покупець')) {
          existing.name = ord.name;
        }
        if (ord.city && !existing.city) {
          existing.city = ord.city;
        }
      } else {
        map.set(cleanPhone, {
          phone: ord.phone,
          name: ord.name || 'Покупець',
          ordersCount: 1,
          totalSpent: ord.total || 0,
          lastOrderDate: ord.date || '',
          city: ord.city || '',
          status: 'new',
          orders: [ord],
        });
      }
    });

    return Array.from(map.values())
      .map((c) => {
        let status: 'vip' | 'regular' | 'new' = 'new';
        if (c.totalSpent >= 5000) {
          status = 'vip';
        } else if (c.ordersCount >= 2) {
          status = 'regular';
        }
        return { ...c, status };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filteredClients = useMemo(() => {
    return uniqueClients.filter((c) => {
      const matchesSearch =
        !clientSearch.trim() ||
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phone.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.city.toLowerCase().includes(clientSearch.toLowerCase());

      const matchesSegment =
        clientSegmentFilter === 'ALL' ||
        (clientSegmentFilter === 'VIP' && c.status === 'vip') ||
        (clientSegmentFilter === 'REGULAR' && c.status === 'regular') ||
        (clientSegmentFilter === 'NEW' && c.status === 'new');

      return matchesSearch && matchesSegment;
    });
  }, [uniqueClients, clientSearch, clientSegmentFilter]);

  const clientsKpi = useMemo(() => {
    const totalClients = uniqueClients.length;
    const vipCount = uniqueClients.filter((c) => c.status === 'vip').length;
    const regularCount = uniqueClients.filter((c) => c.status === 'regular').length;
    const totalRevenue = uniqueClients.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgLtv = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0;
    return { totalClients, vipCount, regularCount, totalRevenue, avgLtv };
  }, [uniqueClients]);

  const handleExportClientsCsv = () => {
    if (uniqueClients.length === 0) {
      addToast('Немає клієнтів для експорту', 'info');
      return;
    }
    const headers = [
      'Телефон',
      "Ім'я",
      'Кількість замовлень',
      'Загальна сума (грн)',
      'Сегмент',
      'Місто',
      'Останнє замовлення',
    ];
    const rows = uniqueClients.map((c) => [
      `"${c.phone}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      c.ordersCount,
      c.totalSpent,
      c.status === 'vip' ? 'VIP' : c.status === 'regular' ? 'Постійний' : 'Новий',
      `"${c.city.replace(/"/g, '""')}"`,
      `"${c.lastOrderDate}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_crm_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Базу клієнтів успішно експортовано в CSV', 'success');
  };


  // --- Module 5: Settings & Promo Handlers ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    updateStoreSettings(settingsForm);
    setIsSavingSettings(false);
    setSettingsSaveSuccess(true);
    addToast('Налаштування магазину збережено!', 'success');
    setTimeout(() => setSettingsSaveSuccess(false), 2500);
  };

  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCodeInput.trim().toUpperCase();
    if (!cleanCode) return;
    addPromoCode({
      id: `promo_${Date.now()}`,
      code: cleanCode,
      discountType: promoDiscountType,
      discountValue: Number(promoDiscountVal),
      minOrderAmount: Number(promoMinOrder),
      isActive: true,
    });
    setPromoCodeInput('');
    setPromoDiscountVal(10);
    addToast(`Промокод ${cleanCode} створено!`, 'success');
  };

  // --- Module 4: Marketing Handlers ---
  const handleSaveMarketing = (e: React.FormEvent) => {
    e.preventDefault();
    updateAnalyticsConfig({
      gaMeasurementId: gaId.trim(),
      googleAdsId: gadsId.trim(),
      googleAdsConversionLabel: gadsLabel.trim(),
      fbPixelId: fbPixelId.trim(),
      merchantCenterTag: gmcTag.trim(),
      gtmId: gtmId.trim(),
      telegramBotToken: tgToken.trim(),
      telegramChatId: tgChatId.trim(),
      novaPoshtaApiKey: npKey.trim(),
    });
    setMarketingSavedNotice(true);
    setTimeout(() => setMarketingSavedNotice(false), 2500);
  };

  const handleTestTelegramOrder = async () => {
    setTgTestResult({ status: 'loading', message: 'Відправка тестового замовлення в Telegram...' });
    const dummyProduct = products[0] || {
      id: 'demo-1',
      title: 'Смарт-годинник Titanium',
      price: 1899,
      productType: 'Тест',
      tags: [],
      images: [],
      featuredImage: '',
      handle: 'demo-1',
      bodyHtml: '',
      vendor: 'Shopify',
      available: true,
      variants: [],
    };

    const res = await sendTelegramOrderNotification(
      {
        orderId: `TEST-${Date.now().toString().slice(-4)}`,
        name: 'Олександр Тестовий',
        phone: '+380991234567',
        city: 'Київ',
        warehouse: 'Відділення №1 (Тестове)',
        deliveryMethod: 'nova_poshta',
        paymentMethod: 'cash_on_delivery',
        notes: 'Тестове повідомлення з Admin Control Hub',
        items: [{ product: dummyProduct, quantity: 1 }],
        total: dummyProduct.price,
      },
      tgToken,
      tgChatId
    );

    if (res.success) {
      setTgTestResult({ status: 'success', message: '✅ Тестове замовлення успішно надіслано в Telegram!' });
    } else {
      setTgTestResult({ status: 'error', message: `❌ Помилка Telegram: ${res.error}` });
    }
  };

  const handleTestConversionEvent = () => {
    const dummyProduct = products[0] || {
      id: 'demo-1',
      title: 'Тестовий товар',
      price: 1500,
      productType: 'Тест',
      tags: [],
      images: [],
      featuredImage: '',
      handle: 'test',
      bodyHtml: '',
      vendor: 'Shop',
      available: true,
      variants: [],
    };

    void trackPurchase(
      {
        orderId: `EV-${Date.now().toString().slice(-5)}`,
        name: 'Тест Покупець',
        phone: '+380991234567',
        city: 'Київ',
        warehouse: 'Відділення 1',
        deliveryMethod: 'nova_poshta',
        paymentMethod: 'cash_on_delivery',
        items: [{ product: dummyProduct, quantity: 1 }],
        total: dummyProduct.price,
      },
      analyticsConfig
    );
  };

  const handleTestAddToCartEvent = () => {
    if (products[0]) {
      trackAddToCart(products[0], 1);
    }
  };

  const handleTestBeginCheckoutEvent = () => {
    if (products[0]) {
      trackBeginCheckout([{ product: products[0], quantity: 1 }], products[0].price);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Нове</span>;
      case 'confirmed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Підтверджено</span>;
      case 'shipped':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Відправлено</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Виконано</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">Скасовано</span>;
    }
  };

  if (!isAdminOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-2 sm:p-4 md:p-6 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-7xl h-full max-h-[96dvh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR / CONTROL HUB HEADER */}
        <header className="px-5 py-3.5 sm:px-7 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-900/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black font-heading tracking-tight text-white flex items-center gap-2">
                  Admin Control Hub
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Plus Pro
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Feed Engine · Product Manager · Orders CRM · Analytics Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Outbox Badge Indicator */}
            {outboxCount > 0 && (
              <div
                onClick={() => setActiveTab('orders')}
                className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono animate-pulse"
                title="Очікують відправки у черзі Outbox"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Outbox: {outboxCount}</span>
              </div>
            )}

            {isAuthenticated && (
              <button
                onClick={() => {
                  sessionStorage.removeItem('shopify_admin_authed');
                  setIsAuthenticated(false);
                }}
                className="text-xs text-slate-400 hover:text-rose-400 font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Вийти
              </button>
            )}

            <button
              onClick={handleClose}
              aria-label="Закрити панель керування"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* AUTHENTICATION GATE */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-4 shadow-xl">
              <ShieldCheck className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-xl font-black font-heading text-slate-900 mb-1">
              Вхід до Admin Control Hub
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              Введіть PIN-код адміністратора для доступу до керування товарами, фідом та базою замовлень (за замовчуванням: 1234).
            </p>

            <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={10}
                  autoFocus
                  placeholder="Введіть PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-center text-lg font-mono tracking-widest focus:outline-none transition-all ${
                    pinError
                      ? 'border-rose-400 bg-rose-50 text-rose-700 focus:ring-2 focus:ring-rose-400'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white shadow-sm'
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-rose-600 font-semibold mt-2">
                    Невірний PIN-код. Спробуйте ще раз (демо: 1234).
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                Увійти до панелі
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* NAVIGATION TABS (Shopify/Linear style) */}
            <nav className="flex border-b border-slate-200 px-4 sm:px-6 bg-slate-50/70 gap-1 overflow-x-auto scrollbar-none shrink-0">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'products'
                    ? 'border-brand-600 text-brand-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Товари ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('feed')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'feed'
                    ? 'border-brand-600 text-brand-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Фід & Імпорт/Експорт</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'orders'
                    ? 'border-brand-600 text-brand-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Замовлення ({orders.length})</span>
                {ordersKpi.newCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('clients')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'clients'
                    ? 'border-brand-600 text-brand-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Клієнти ({uniqueClients.length})</span>
                {clientsKpi.vipCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 font-bold border border-amber-300">
                    {clientsKpi.vipCount} VIP
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('marketing')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'marketing'
                    ? 'border-brand-600 text-brand-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings2 className="w-4 h-4" />
                <span>Маркетинг & Інтеграції</span>
                {(analyticsConfig.telegramBotToken || analyticsConfig.gaMeasurementId) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'settings'
                    ? 'border-brand-600 text-brand-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Налаштування & Промо</span>
              </button>

              <button
                onClick={() => setActiveTab('supabase')}
                className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === 'supabase'
                    ? 'border-brand-600 text-brand-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>Хмара Supabase</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
              </button>
            </nav>

            {/* TAB CONTENT CONTAINER */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
              {/* ======================================================== */}
              {/* MODULE 1: FEED ENGINE (CSV IMPORT / EXPORT / MERCHANT)    */}
              {/* ======================================================== */}
              {activeTab === 'feed' && (
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Status Banner */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">Сховище каталогу: IndexedDB Active</h3>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-500">
                          Товари зберігаються у локальній базі браузера IndexedDB без обмежень розміру.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span>Товарів у базі: <strong className="text-slate-900 font-bold">{products.length}</strong></span>
                      <span>·</span>
                      <span>Категорій: <strong className="text-slate-900 font-bold">{allCategories.length}</strong></span>
                    </div>
                  </div>

                  {/* Feedback notices */}
                  {feedSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feedSuccess}</span>
                    </div>
                  )}

                  {feedError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{feedError}</span>
                    </div>
                  )}

                  {/* Pre-import CSV Preview Modal / Card */}
                  {csvPreview && (
                    <div className="bg-white rounded-2xl border-2 border-brand-500/60 p-5 shadow-lg space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-brand-600" />
                          <h3 className="font-heading font-black text-slate-900 text-base">
                            Попередній перегляд імпорту ({csvPreview.filename || 'Shopify CSV'})
                          </h3>
                        </div>
                        <button
                          onClick={handleCancelPreview}
                          className="text-xs text-slate-400 hover:text-slate-700"
                        >
                          Скасувати
                        </button>
                      </div>

                      {/* Preview Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                          <span className="text-[11px] text-slate-500 uppercase block font-mono">Знайдено товарів</span>
                          <strong className="text-lg font-black text-slate-900">{csvPreview.validProducts.length}</strong>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                          <span className="text-[11px] text-slate-500 uppercase block font-mono">Валідація цін</span>
                          <strong className={`text-lg font-black ${csvPreview.invalidPriceCount === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {csvPreview.invalidPriceCount === 0 ? '✓ Всі коректні' : `${csvPreview.invalidPriceCount} без ціни`}
                          </strong>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                          <span className="text-[11px] text-slate-500 uppercase block font-mono">Фотографії</span>
                          <strong className="text-lg font-black text-slate-900">
                            {csvPreview.validProducts.length - csvPreview.missingImageCount}/{csvPreview.validProducts.length}
                          </strong>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                          <span className="text-[11px] text-slate-500 uppercase block font-mono">Категорій</span>
                          <strong className="text-lg font-black text-slate-900">{csvPreview.categories.length}</strong>
                        </div>
                      </div>

                      {/* Sample Products Table Preview */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                          Зразок розпізнаних товарів (перші 3 з {csvPreview.validProducts.length}):
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">Фото</th>
                                <th className="p-2.5">Назва товару</th>
                                <th className="p-2.5">Категорія</th>
                                <th className="p-2.5">Ціна</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {csvPreview.validProducts.slice(0, 3).map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5">
                                    <img
                                      src={p.featuredImage}
                                      alt=""
                                      className="w-8 h-8 rounded object-cover border border-slate-200"
                                    />
                                  </td>
                                  <td className="p-2.5 font-bold text-slate-900">{p.title}</td>
                                  <td className="p-2.5 text-slate-600">{p.productType}</td>
                                  <td className="p-2.5 font-bold text-brand-600">{p.price.toLocaleString('uk-UA')} ₴</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Confirm & Apply Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleCancelPreview}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Скасувати
                        </button>
                        <button
                          type="button"
                          disabled={isApplyingFeed}
                          onClick={handleApplyCsvFeed}
                          className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          {isApplyingFeed ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Застосувати та зберегти в IndexedDB ({csvPreview.validProducts.length} тов.)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Drag-and-Drop Area */}
                  {!csvPreview && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileProcess(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
                        dragActive
                          ? 'border-brand-600 bg-brand-50/70 scale-[0.99]'
                          : 'border-slate-300 hover:border-brand-500 bg-white'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-100 shadow-sm">
                        <Upload className="w-8 h-8" />
                      </div>

                      <h3 className="font-heading font-black text-slate-900 text-lg mb-1">
                        Перетягніть CSV файл Shopify сюди
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                        Підтримуються будь-які експорти Shopify (UTF-8 або Windows-1251 з комами). Перед заміною каталогу ви побачите картку валідації цін та картинок.
                      </p>

                      <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95">
                        <FileSpreadsheet className="w-4 h-4 text-brand-400" />
                        <span>Обрати CSV файл з диска</span>
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileProcess(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* 1-Click Export Actions Toolbar */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Швидкий експорт та інструменти каталогу</h4>
                        <p className="text-xs text-slate-500">
                          Експорт актуальних товарів з урахуванням ваших правок ціни, наявності та тегів.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Google Merchant XML */}
                      <button
                        onClick={() => downloadGoogleMerchantXml(products)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                      >
                        <FileCode className="w-4 h-4" />
                        <span>Експорт Google Merchant XML (1 клік)</span>
                      </button>

                      {/* Export back to CSV */}
                      <button
                        onClick={() => downloadShopifyCsv(products)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-brand-400" />
                        <span>Експорт каталогу в Shopify CSV (1 клік)</span>
                      </button>

                      {/* Export JSON */}
                      <button
                        onClick={handleExportJson}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors shadow-xs"
                      >
                        <FileJson className="w-4 h-4 text-blue-600" />
                        <span>Експорт catalog.json</span>
                      </button>

                      {/* Download sample */}
                      <button
                        onClick={handleDownloadSample}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors shadow-xs"
                      >
                        <Download className="w-4 h-4 text-slate-600" />
                        <span>Зразок Shopify CSV</span>
                      </button>

                      {/* Reset to Demo */}
                      <button
                        onClick={async () => {
                          if (confirm('Скинути всі товари до початкових демо-даних? Усі ваші зміни буде скинуто.')) {
                            await resetToDemo();
                            setFeedSuccess('Каталог успішно повернуто до початкових демо-товарів.');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-bold transition-colors shadow-xs ml-auto"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Скинути до демо-каталогу</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODULE 2: PRODUCT MANAGER (SEARCH, INLINE EDIT, ADD)      */}
              {/* ======================================================== */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Supabase Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs shadow-xs">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-slate-800">
                        {isSupabaseConfigured() ? 'Хмара Supabase:' : 'База товарів:'}
                      </span>
                      {isSupabaseConfigured() ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Підключено (Збереження та фото у хмарі)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Локальний режим (IndexedDB)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('supabase')}
                      className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isSupabaseConfigured() ? 'Налаштування хмари →' : 'Підключити Supabase хмару →'}
                    </button>
                  </div>

                  {/* Toolbar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Пошук за назвою, артикулом (SKU), брендом чи тегами... (натисніть '/')"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      />
                      {productSearch && (
                        <button
                          onClick={() => setProductSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter & Sort Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Category filter */}
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-brand-500 text-slate-700"
                      >
                        <option value="ALL">Всі категорії ({allCategories.length})</option>
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      {/* Stock filter */}
                      <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-brand-500 text-slate-700"
                      >
                        <option value="ALL">Вся наявність</option>
                        <option value="IN_STOCK">В наявності</option>
                        <option value="OUT_OF_STOCK">Немає в наявності</option>
                      </select>

                      {/* Sort */}
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-brand-500 text-slate-700"
                      >
                        <option value="DEFAULT">Сортування: За замовчуванням</option>
                        <option value="PRICE_ASC">Ціна: від низької</option>
                        <option value="PRICE_DESC">Ціна: від високої</option>
                        <option value="TITLE_ASC">Назва: А-Я</option>
                      </select>

                      {/* Add Product Button */}
                      <button
                        type="button"
                        onClick={handleOpenAddProduct}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Додати товар</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-mono">
                    <span>
                      Знайдено товарів: <strong className="text-slate-800">{filteredProducts.length}</strong> з {products.length}
                    </span>
                    <span>Підказка: натисніть на ціну для швидкого редагування (Inline Edit)</span>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                          <tr>
                            <th className="py-3 px-4 w-14">Фото</th>
                            <th className="py-3 px-4">Товар & SKU</th>
                            <th className="py-3 px-4">Категорія</th>
                            <th className="py-3 px-4 w-44">Ціна (₴)</th>
                            <th className="py-3 px-4 w-36">Наявність</th>
                            <th className="py-3 px-4">Теги / Бейджі</th>
                            <th className="py-3 px-4 text-right w-24">Дії</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((p) => {
                              const isEditingPrice = editingPriceId === p.id;
                              return (
                                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                                  {/* Thumbnail */}
                                  <td className="py-2.5 px-4">
                                    <img
                                      src={p.featuredImage}
                                      alt={p.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                      loading="lazy"
                                    />
                                  </td>

                                  {/* Title & SKU */}
                                  <td className="py-2.5 px-4">
                                    <div className="font-bold text-slate-900 line-clamp-1 max-w-xs sm:max-w-md">
                                      {p.title}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                      <span>SKU: {p.sku || '—'}</span>
                                      <span>·</span>
                                      <span>{p.vendor}</span>
                                    </div>
                                  </td>

                                  {/* Category */}
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60">
                                      {p.productType || 'Загальне'}
                                    </span>
                                  </td>

                                  {/* Inline Price Edit */}
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    {isEditingPrice ? (
                                      <div className="flex items-center gap-1.5">
                                        <div className="space-y-1">
                                          <input
                                            type="number"
                                            autoFocus
                                            value={priceInput}
                                            onChange={(e) => setPriceInput(parseFloat(e.target.value) || 0)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveInlineEdit(p.id);
                                              if (e.key === 'Escape') setEditingPriceId(null);
                                            }}
                                            placeholder="Ціна"
                                            className="w-20 px-2 py-1 rounded border border-brand-500 font-mono text-xs focus:outline-none"
                                          />
                                          <input
                                            type="number"
                                            value={comparePriceInput || ''}
                                            onChange={(e) =>
                                              setComparePriceInput(
                                                e.target.value ? parseFloat(e.target.value) : undefined
                                              )
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveInlineEdit(p.id);
                                              if (e.key === 'Escape') setEditingPriceId(null);
                                            }}
                                            placeholder="Стара ціна"
                                            className="w-20 px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px] text-slate-400 focus:outline-none block"
                                          />
                                        </div>
                                        <button
                                          onClick={() => handleSaveInlineEdit(p.id)}
                                          className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
                                          title="Зберегти ціну"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setEditingPriceId(null)}
                                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500"
                                          title="Скасувати"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => handleStartInlineEdit(p)}
                                        className="cursor-pointer group-hover:bg-brand-50/50 p-1.5 rounded-lg transition-colors inline-block"
                                        title="Натисніть для редагування ціни"
                                      >
                                        <div className="flex items-center gap-1.5 font-bold font-mono text-slate-900">
                                          <span>{p.price.toLocaleString('uk-UA')} ₴</span>
                                          <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-brand-600" />
                                        </div>
                                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                                          <div className="text-[10px] text-slate-400 font-mono line-through">
                                            {p.compareAtPrice.toLocaleString('uk-UA')} ₴
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  {/* Availability toggle */}
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStock(p)}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                                        p.available
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          p.available ? 'bg-emerald-500' : 'bg-slate-400'
                                        }`}
                                      />
                                      <span>{p.available ? 'В наявності' : 'Немає'}</span>
                                    </button>
                                  </td>

                                  {/* Tags with remove & quick add */}
                                  <td className="py-2.5 px-4">
                                    <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                                      {p.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-semibold"
                                        >
                                          <span>{tag}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveTag(p, tag)}
                                            className="text-amber-500 hover:text-rose-600"
                                            title="Видалити тег"
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))}

                                      {/* Quick Tag Adder Popover Button */}
                                      {quickTagProductId === p.id ? (
                                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-brand-500 shadow-sm animate-fade-in">
                                          <input
                                            type="text"
                                            autoFocus
                                            placeholder="Тег..."
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleAddTag(p, newTagInput);
                                              if (e.key === 'Escape') setQuickTagProductId(null);
                                            }}
                                            className="w-16 text-[10px] px-1 py-0.5 border-none focus:outline-none"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleAddTag(p, newTagInput)}
                                            className="text-brand-600 hover:text-brand-700 font-bold text-[10px]"
                                          >
                                            +
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setQuickTagProductId(null)}
                                            className="text-slate-400 hover:text-slate-600 text-[10px]"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuickTagProductId(p.id);
                                            setNewTagInput('');
                                          }}
                                          className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-brand-600 hover:bg-slate-100 border border-dashed border-slate-200"
                                          title="Додати тег"
                                        >
                                          + Тег
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleDuplicateProduct(p)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                        title="Дублювати товар"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditProduct(p)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                        title="Повне редагування товару"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (confirm(`Видалити товар "${p.title}"?`)) {
                                            await deleteProduct(p.id);
                                          }
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        title="Видалити товар"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                Товарів за даними фільтрами не знайдено.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add / Edit Product Modal with Supabase Storage, Drag & Drop, Variants */}
                  <ProductFormModal
                    isOpen={isProductModalOpen}
                    onClose={() => {
                      setIsProductModalOpen(false);
                      setEditingProduct(null);
                    }}
                    editingProduct={editingProduct}
                    onSave={async (prod) => {
                      if (editingProduct) {
                        await updateProduct(prod);
                      } else {
                        await addProduct(prod);
                      }
                      setIsProductModalOpen(false);
                      setEditingProduct(null);
                    }}
                    allCategories={allCategories}
                    allVendors={allVendors}
                    storeId={STORE_ID}
                  />
                </div>
              )}

              {/* ======================================================== */}
              {/* MODULE 3: ORDER MANAGEMENT & OUTBOX MONITOR              */}
              {/* ======================================================== */}
              {activeTab === 'orders' && (
                <div className="space-y-5">
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] text-slate-500 font-mono uppercase block">Всього замовлень</span>
                      <strong className="text-xl font-black text-slate-900 mt-1 block">
                        {ordersKpi.totalCount}
                      </strong>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] text-amber-700 font-mono uppercase block">Нові (потребують обробки)</span>
                      <strong className="text-xl font-black text-amber-600 mt-1 block">
                        {ordersKpi.newCount}
                      </strong>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] text-slate-500 font-mono uppercase block">Загальна сума</span>
                      <strong className="text-xl font-black text-brand-600 mt-1 block">
                        {ordersKpi.totalSum.toLocaleString('uk-UA')} ₴
                      </strong>
                    </div>

                    {/* Outbox Status Card */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-mono uppercase block">Черга Outbox</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            outboxCount === 0 ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <strong className="text-xl font-black text-slate-900">
                          {outboxCount} {outboxCount === 0 ? '✓' : 'очікують'}
                        </strong>
                        {outboxCount > 0 && (
                          <button
                            type="button"
                            disabled={isFlushingOutbox}
                            onClick={handleFlushOutboxClick}
                            className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isFlushingOutbox ? 'animate-spin' : ''}`} />
                            <span>Відправити</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outbox Banner if pending */}
                  {outboxCount > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Увага:</strong> У черзі Outbox збережено <strong>{outboxCount}</strong> замовлень, які очікують синхронізації з сервером.
                        </span>
                      </div>
                      <button
                        onClick={handleFlushOutboxClick}
                        disabled={isFlushingOutbox}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <RefreshCw className={`w-3 h-3 ${isFlushingOutbox ? 'animate-spin' : ''}`} />
                        <span>Повторити відправку</span>
                      </button>
                    </div>
                  )}

                  {outboxFeedback && (
                    <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-mono text-center animate-fade-in">
                      {outboxFeedback}
                    </div>
                  )}

                  {/* Toolbar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Пошук за номером, ім'ям, телефоном, містом..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Filter by status */}
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-brand-500 text-slate-700"
                      >
                        <option value="ALL">Всі статуси ({orders.length})</option>
                        <option value="new">Нові</option>
                        <option value="confirmed">Підтверджені</option>
                        <option value="shipped">Відправлені</option>
                        <option value="completed">Виконані</option>
                        <option value="cancelled">Скасовані</option>
                      </select>

                      {orders.length > 0 && (
                        <button
                          type="button"
                          onClick={handleExportOrdersCsv}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                          title="Завантажити всі замовлення у CSV"
                        >
                          <Download className="w-3.5 h-3.5 text-brand-600" />
                          <span>Експорт CSV</span>
                        </button>
                      )}

                      {orders.length > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm('Видалити всю історію замовлень?')) {
                              await clearOrders();
                            }
                          }}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 text-xs font-bold transition-colors"
                        >
                          Очистити все
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                          <tr>
                            <th className="py-3 px-4">Замовлення</th>
                            <th className="py-3 px-4">Клієнт & Телефон</th>
                            <th className="py-3 px-4">Місто & Відділення</th>
                            <th className="py-3 px-4">Товари</th>
                            <th className="py-3 px-4">Сума (₴)</th>
                            <th className="py-3 px-4 w-36">Статус</th>
                            <th className="py-3 px-4 w-28">Telegram</th>
                            <th className="py-3 px-4 text-right w-24">Дії</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredOrders.length > 0 ? (
                            filteredOrders.map((ord) => {
                              const cleanPhone = ord.phone ? normalizeUaPhoneForAnalytics(ord.phone).replace('+', '') : '';
                              return (
                                <tr key={ord.orderId} className="hover:bg-slate-50/60 transition-colors">
                                  {/* ID & Date */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-bold font-mono text-brand-700">{ord.orderId}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ord.date}</div>
                                  </td>

                                  {/* Client */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-bold text-slate-900">{ord.name}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <a
                                        href={`tel:${ord.phone}`}
                                        className="text-brand-600 hover:underline font-mono text-[11px]"
                                      >
                                        {ord.phone}
                                      </a>
                                      {cleanPhone && (
                                        <a
                                          href={`https://t.me/+${cleanPhone}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-500 hover:text-blue-700"
                                          title="Написати в Telegram"
                                        >
                                          <Send className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </td>

                                  {/* Delivery & City */}
                                  <td className="py-3 px-4">
                                    <div className="font-medium text-slate-900">{ord.city || '—'}</div>
                                    <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                                      {ord.warehouse || 'Уточнюється'}
                                    </div>
                                  </td>

                                  {/* Items summary */}
                                  <td className="py-3 px-4">
                                    <div className="text-slate-800 font-medium line-clamp-1 max-w-xs">
                                      {ord.items?.[0]?.product?.title || 'Товар'}
                                      {(ord.items?.length || 0) > 1 && ` (+ще ${ord.items.length - 1})`}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {ord.items?.reduce((a, b) => a + b.quantity, 0) || 1} шт.
                                    </div>
                                  </td>

                                  {/* Total & Payment */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-bold font-mono text-slate-900 text-sm">
                                      {ord.total?.toLocaleString('uk-UA')} ₴
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {ord.paymentMethod === 'card' ? 'Оплата картою' : 'Накладений платіж'}
                                    </div>
                                  </td>

                                  {/* Status Dropdown */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <select
                                      value={ord.status}
                                      onChange={(e) => updateOrderStatus(ord.orderId, e.target.value as OrderStatus)}
                                      className="text-xs font-bold py-1 px-2 rounded-lg border border-slate-200 bg-white focus:outline-none cursor-pointer"
                                    >
                                      <option value="new">🟡 Нове</option>
                                      <option value="confirmed">🔵 Підтверджено</option>
                                      <option value="shipped">🟣 Відправлено</option>
                                      <option value="completed">🟢 Виконано</option>
                                      <option value="cancelled">⚪ Скасовано</option>
                                    </select>
                                  </td>

                                  {/* Telegram status */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    {ord.syncedToTelegram ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <Check className="w-3 h-3" />
                                        <span>Надіслано</span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleRetryTelegramForOrder(ord.orderId)}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200"
                                        title="Надіслати повторно в Telegram бот"
                                      >
                                        <Send className="w-3 h-3" />
                                        <span>Надіслати</span>
                                      </button>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleCopyForNovaPoshta(ord)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50"
                                        title="Копіювати для Нової Пошти"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handlePrintOrderSlip(ord)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                        title="Друкувати накладну"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedOrderDetails(ord)}
                                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                        title="Переглянути деталі замовлення"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (confirm(`Видалити замовлення ${ord.orderId}?`)) {
                                            await deleteOrder(ord.orderId);
                                          }
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        title="Видалити"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                                Замовлень поки що немає або нічого не знайдено за вашим запитом.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Details Modal / Card */}
                  {selectedOrderDetails && (
                    <div
                      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
                      onClick={() => setSelectedOrderDetails(null)}
                    >
                      <div
                        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono uppercase block">Деталі замовлення</span>
                            <h3 className="font-black text-slate-900 text-lg font-mono">
                              #{selectedOrderDetails.orderId}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStatusBadge(selectedOrderDetails.status)}
                            <button
                              onClick={() => setSelectedOrderDetails(null)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Customer Card & 1-Click Communications */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                            Контакти покупця
                          </h4>

                          <div className="grid grid-cols-2 gap-2 text-slate-700">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Ім'я:</span>
                              <strong className="text-slate-900">{selectedOrderDetails.name}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Телефон:</span>
                              <strong className="font-mono text-slate-900">{selectedOrderDetails.phone}</strong>
                            </div>
                          </div>

                          {/* 1-Click Actions: Call / Telegram / Viber */}
                          {selectedOrderDetails.phone && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                              <a
                                href={`tel:${selectedOrderDetails.phone}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Зателефонувати</span>
                              </a>

                              <a
                                href={`https://t.me/+${normalizeUaPhoneForAnalytics(selectedOrderDetails.phone).replace('+', '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] shadow-xs"
                              >
                                <Send className="w-3 h-3" />
                                <span>Telegram</span>
                              </a>

                              <a
                                href={`viber://chat?number=%2B${normalizeUaPhoneForAnalytics(selectedOrderDetails.phone).replace('+', '')}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Viber</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => handleCopyForNovaPoshta(selectedOrderDetails)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] shadow-xs"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Копіювати для НП</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePrintOrderSlip(selectedOrderDetails)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] shadow-xs border border-slate-300"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Друк накладної</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delivery & Payment Card */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                            Доставка та оплата
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-slate-700">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Місто:</span>
                              <strong>{selectedOrderDetails.city || 'Уточнюється'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Служба доставки:</span>
                              <strong>
                                {selectedOrderDetails.deliveryMethod === 'nova_poshta'
                                  ? 'Нова Пошта'
                                  : selectedOrderDetails.deliveryMethod === 'ukrposhta'
                                  ? 'Укрпошта'
                                  : 'Кур’єр'}
                              </strong>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 block text-[10px]">Відділення / Адреса:</span>
                              <strong>{selectedOrderDetails.warehouse || 'Уточнюється'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Спосіб оплати:</span>
                              <strong>
                                {selectedOrderDetails.paymentMethod === 'card'
                                  ? 'Оплата карткою'
                                  : 'Накладений платіж'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Дата створення:</span>
                              <strong className="font-mono">{selectedOrderDetails.date}</strong>
                            </div>
                          </div>

                          {selectedOrderDetails.notes && (
                            <div className="pt-2 border-t border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Коментар клієнта:</span>
                              <p className="italic text-slate-700">{selectedOrderDetails.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* TTN Tracking Card */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-brand-600" />
                            <span>Номер накладної (ТТН Нової Пошти / Укрпошти)</span>
                          </h4>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Введіть 14 цифр ТТН (наприклад: 20450912345678)"
                              value={ttnInputs[selectedOrderDetails.orderId] ?? selectedOrderDetails.ttn ?? ''}
                              onChange={(e) =>
                                setTtnInputs((prev) => ({
                                  ...prev,
                                  [selectedOrderDetails.orderId]: e.target.value,
                                }))
                              }
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveTtn(selectedOrderDetails.orderId)}
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                            >
                              Зберегти ТТН
                            </button>
                          </div>
                        </div>

                        {/* Order Items Table */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                            Замовлені товари
                          </h4>
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                                <tr>
                                  <th className="p-2">Товар</th>
                                  <th className="p-2 text-center">К-сть</th>
                                  <th className="p-2 text-right">Ціна</th>
                                  <th className="p-2 text-right">Разом</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedOrderDetails.items?.map((it, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2">
                                      <div className="font-bold text-slate-900">{it.product?.title}</div>
                                      {it.selectedVariant && (
                                        <div className="text-[10px] text-slate-500">Варіант: {it.selectedVariant}</div>
                                      )}
                                    </td>
                                    <td className="p-2 text-center font-mono">{it.quantity} шт.</td>
                                    <td className="p-2 text-right font-mono">
                                      {it.product?.price?.toLocaleString('uk-UA')} ₴
                                    </td>
                                    <td className="p-2 text-right font-bold font-mono">
                                      {((it.product?.price || 0) * it.quantity).toLocaleString('uk-UA')} ₴
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {selectedOrderDetails.promoCode && (
                            <div className="flex justify-between items-center px-3.5 py-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
                              <span className="flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  Промокод: <strong>{selectedOrderDetails.promoCode}</strong>
                                </span>
                              </span>
                              <span className="font-bold font-mono text-emerald-700">
                                -{selectedOrderDetails.discountAmount?.toLocaleString('uk-UA')} ₴
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded-xl font-bold font-mono text-sm">
                            <span>РАЗОМ ДО СПЛАТИ:</span>
                            <span className="text-brand-400 text-base">
                              {selectedOrderDetails.total?.toLocaleString('uk-UA')} ₴
                            </span>
                          </div>
                        </div>

                        {/* Telegram re-send button */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>Статус Telegram:</span>
                            {selectedOrderDetails.syncedToTelegram ? (
                              <span className="text-emerald-600 font-bold">✓ Надіслано</span>
                            ) : (
                              <span className="text-amber-600 font-bold">Не надіслано</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRetryTelegramForOrder(selectedOrderDetails.orderId)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Відправити в Telegram</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* ======================================================== */}
              {/* MODULE 6: CLIENTS / CRM DATABASE & ANALYTICS              */}
              {/* ======================================================== */}
              {activeTab === 'clients' && (
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="text-slate-500 text-xs font-medium">Усього клієнтів</div>
                      <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                        {clientsKpi.totalClients}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">У базі замовлень</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="text-slate-500 text-xs font-medium">VIP Покупці (від 5 000 ₴)</div>
                      <div className="text-2xl font-black font-mono text-amber-600 mt-1">
                        {clientsKpi.vipCount}
                      </div>
                      <div className="text-[11px] text-amber-600/80 mt-1">Найвищий пріоритет</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="text-slate-500 text-xs font-medium">Загальний LTV бази</div>
                      <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
                        {clientsKpi.totalRevenue.toLocaleString('uk-UA')} ₴
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Сума всіх покупок</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="text-slate-500 text-xs font-medium">Середній чек на клієнта</div>
                      <div className="text-2xl font-black font-mono text-indigo-600 mt-1">
                        {clientsKpi.avgLtv.toLocaleString('uk-UA')} ₴
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">LTV на 1 покупця</div>
                    </div>
                  </div>

                  {/* Actions & Filters */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Пошук за ім'ям, телефоном або містом..."
                          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {(['ALL', 'VIP', 'REGULAR', 'NEW'] as const).map((seg) => (
                          <button
                            key={seg}
                            type="button"
                            onClick={() => setClientSegmentFilter(seg)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                              clientSegmentFilter === seg
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {seg === 'ALL' && 'Всі сегменти'}
                            {seg === 'VIP' && `VIP (${clientsKpi.vipCount})`}
                            {seg === 'REGULAR' && `Постійні (${clientsKpi.regularCount})`}
                            {seg === 'NEW' && 'Нові'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportClientsCsv}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Експорт бази (CSV)</span>
                    </button>
                  </div>

                  {/* Clients Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">Клієнт</th>
                            <th className="py-3 px-4">Зв'язок</th>
                            <th className="py-3 px-4">Місто</th>
                            <th className="py-3 px-4">Сегмент</th>
                            <th className="py-3 px-4 text-center">Замовлень</th>
                            <th className="py-3 px-4 text-right">LTV (Сума)</th>
                            <th className="py-3 px-4 text-right">Останнє замовлення</th>
                            <th className="py-3 px-4 text-center">Дії</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredClients.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="font-medium">Клієнтів не знайдено</p>
                              </td>
                            </tr>
                          ) : (
                            filteredClients.map((client, idx) => {
                              const cleanPhone = normalizeUaPhoneForAnalytics(client.phone).replace('+', '');
                              return (
                                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-4 font-medium text-slate-900">
                                    <div className="font-bold">{client.name}</div>
                                    <div className="font-mono text-slate-400 text-[11px]">{client.phone}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1.5">
                                      <a
                                        href={`tel:${client.phone}`}
                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        title="Зателефонувати"
                                      >
                                        <Phone className="w-3 h-3" />
                                      </a>
                                      {cleanPhone && (
                                        <>
                                          <a
                                            href={`https://t.me/+${cleanPhone}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700"
                                            title="Telegram"
                                          >
                                            <Send className="w-3 h-3" />
                                          </a>
                                          <a
                                            href={`viber://chat?number=%2B${cleanPhone}`}
                                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700"
                                            title="Viber"
                                          >
                                            <MessageSquare className="w-3 h-3" />
                                          </a>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-600">
                                    {client.city || '—'}
                                  </td>
                                  <td className="py-3 px-4">
                                    {client.status === 'vip' && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                        ★ VIP
                                      </span>
                                    )}
                                    {client.status === 'regular' && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        Постійний
                                      </span>
                                    )}
                                    {client.status === 'new' && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        Новий
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                                    {client.ordersCount}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                    {client.totalSpent.toLocaleString('uk-UA')} ₴
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                                    {client.lastOrderDate || '—'}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedClientPhone(client.phone)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                      title="Історія замовлень клієнта"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Selected Client Orders Modal */}
                  {selectedClientPhone && (() => {
                    const client = uniqueClients.find((c) => c.phone === selectedClientPhone);
                    if (!client) return null;
                    return (
                      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
                          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900 text-base">{client.name}</h3>
                              <p className="font-mono text-xs text-slate-500">{client.phone} • {client.city || 'Місто не вказано'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedClientPhone(null)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Замовлень</span>
                                <span className="font-mono font-bold text-slate-800 text-sm">{client.ordersCount}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">LTV</span>
                                <span className="font-mono font-bold text-emerald-600 text-sm">{client.totalSpent.toLocaleString('uk-UA')} ₴</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Статус</span>
                                <span className="text-xs font-bold text-amber-600">{client.status.toUpperCase()}</span>
                              </div>
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Історія замовлень</h4>
                            <div className="space-y-2">
                              {client.orders.map((ord, i) => (
                                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs">
                                  <div>
                                    <div className="font-bold text-slate-900 font-mono">#{ord.orderId} • <span className="text-slate-500 font-normal">{ord.date}</span></div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {ord.items?.map((it) => `${it.product?.title} (x${it.quantity})`).join(', ')}
                                    </div>
                                    {ord.ttn && <div className="text-[11px] text-sky-600 font-mono mt-0.5">ТТН: {ord.ttn}</div>}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-bold font-mono text-slate-900">{ord.total?.toLocaleString('uk-UA')} ₴</div>
                                    <div className="mt-1 flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOrderDetails(ord);
                                          setSelectedClientPhone(null);
                                        }}
                                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        title="Деталі"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handlePrintOrderSlip(ord)}
                                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        title="Друк накладної"
                                      >
                                        <Printer className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ======================================================== */}
              {/* MODULE 4: MARKETING, INTEGRATIONS & LIVE DEBUGGER         */}
              {/* ======================================================== */}
              {activeTab === 'marketing' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Form */}
                  <form onSubmit={handleSaveMarketing} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-heading font-black text-slate-900 text-base">
                          Налаштування сповіщень та маркетингових пікселів
                        </h3>
                        <p className="text-xs text-slate-500">
                          Підключіть Telegram бота, Google Ads, GA4 та Facebook Pixel для повної автоматизації.
                        </p>
                      </div>
                    </div>

                    {/* Section 1: Telegram Bot */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-sky-600" />
                        <h4 className="font-bold text-slate-800 text-sm">Telegram Бот для замовлень</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                            Telegram Bot Token
                          </label>
                          <input
                            type="text"
                            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                            value={tgToken}
                            onChange={(e) => setTgToken(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                            Telegram Chat ID
                          </label>
                          <input
                            type="text"
                            placeholder="987654321 або -100123456789"
                            value={tgChatId}
                            onChange={(e) => setTgChatId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTestTelegramOrder}
                          disabled={tgTestResult.status === 'loading'}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 text-sky-600" />
                          <span>Надіслати тестове замовлення в Telegram</span>
                        </button>
                      </div>

                      {tgTestResult.message && (
                        <div
                          className={`p-3 rounded-xl text-xs font-medium ${
                            tgTestResult.status === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : tgTestResult.status === 'error'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {tgTestResult.message}
                        </div>
                      )}
                    </div>

                    <hr className="border-slate-100" />

                    {/* Section 2: Advertising & Analytics */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-slate-800 text-sm">Маркетинг, Google Ads та Facebook Pixel</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* GA4 */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                            Google Analytics 4 (Measurement ID)
                          </label>
                          <input
                            type="text"
                            placeholder="G-XXXXXXXXXX"
                            value={gaId}
                            onChange={(e) => setGaId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        {/* Facebook Pixel */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                            Facebook Pixel (ID)
                          </label>
                          <input
                            type="text"
                            placeholder="123456789012345"
                            value={fbPixelId}
                            onChange={(e) => setFbPixelId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        {/* Google Ads ID */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                            Google Ads ID
                          </label>
                          <input
                            type="text"
                            placeholder="AW-XXXXXXXXX"
                            value={gadsId}
                            onChange={(e) => setGadsId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        {/* Google Ads Label */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                            Мітка конверсії (Conversion Label)
                          </label>
                          <input
                            type="text"
                            placeholder="AbCdEf123456"
                            value={gadsLabel}
                            onChange={(e) => setGadsLabel(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      </div>

                      {/* GMC Verification tag */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                          Google Merchant Center (Підтвердження власності сайту meta-тег)
                        </label>
                        <input
                          type="text"
                          placeholder='<meta name="google-site-verification" content="..." />'
                          value={gmcTag}
                          onChange={(e) => setGmcTag(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Зберегти налаштування інтеграцій</span>
                      </button>
                    </div>

                    {marketingSavedNotice && (
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200 animate-fade-in">
                        ✅ Налаштування маркетингу та бота успішно збережено!
                      </div>
                    )}

                    {/* Section 3: Security & PIN change */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                        Безпека: Зміна PIN-коду панелі
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          maxLength={10}
                          placeholder="Новий PIN (мін. 4 цифри)"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          className="w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={handleUpdatePin}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                        >
                          Змінити PIN
                        </button>
                      </div>
                      {pinNotice && (
                        <p className="text-xs text-emerald-600 font-bold mt-1">✓ PIN-код успішно оновлено!</p>
                      )}
                    </div>
                  </form>

                  {/* Section 4: Live Event Debugger */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-slate-700" />
                          <h4 className="font-bold text-slate-900 text-sm">Live-лог подій аналітики</h4>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-xs text-slate-500">
                          Події фіксуються в реальному часі (add_to_cart, begin_checkout, purchase)
                        </p>
                      </div>

                      {/* Quick Event Trigger Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTestAddToCartEvent}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          + add_to_cart
                        </button>
                        <button
                          type="button"
                          onClick={handleTestBeginCheckoutEvent}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          + begin_checkout
                        </button>
                        <button
                          type="button"
                          onClick={handleTestConversionEvent}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                        >
                          + purchase (конверсія)
                        </button>
                      </div>
                    </div>

                    {/* Filter logs by platform */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-mono">Фільтр:</span>
                      {['ALL', 'Google Analytics', 'Google Ads', 'Facebook Pixel', 'System'].map((plt) => (
                        <button
                          key={plt}
                          onClick={() => setLogFilterPlatform(plt)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                            logFilterPlatform === plt
                              ? 'bg-slate-900 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {plt === 'ALL' ? 'Всі' : plt}
                        </button>
                      ))}
                    </div>

                    {/* Log list */}
                    {logs.length > 0 ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {logs
                          .filter((l) => logFilterPlatform === 'ALL' || l.platform === logFilterPlatform)
                          .map((log) => (
                            <div
                              key={log.id}
                              className="p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono border border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                                <span className="font-bold text-emerald-400">
                                  [{log.platform}] {log.eventName}
                                </span>
                                <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                              </div>
                              <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200/60 p-4">
                        Поки що немає зафіксованих подій. Натисніть кнопку вище для симуляції або відкрийте сторінку сайту!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODULE 5: STORE SETTINGS, MESSENGERS & PROMO ENGINE       */}
              {/* ======================================================== */}
              {activeTab === 'settings' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Store & Messengers Settings Form */}
                  <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
                          <SlidersHorizontal className="w-5 h-5 text-brand-600" />
                          <span>Налаштування магазину, месенджерів та віджетів</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Контакти зв'язку з клієнтами, Telegram, Viber, графік роботи та плаваюча кнопка «Написати нам».
                        </p>
                      </div>
                      {settingsSaveSuccess && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-fade-in">
                          <Check className="w-3.5 h-3.5" />
                          <span>Збережено!</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Номер телефону магазину</label>
                        <input
                          type="text"
                          value={settingsForm.phone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          placeholder="+380 44 233 45 67"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500"
                        />
                        <span className="text-[10px] text-slate-400">Відображається в шапці сайту та у віджеті дзвінка</span>
                      </div>

                      {/* Telegram Username */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Telegram менеджера (username без @)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">@</span>
                          <input
                            type="text"
                            value={settingsForm.telegramUsername}
                            onChange={(e) => setSettingsForm({ ...settingsForm, telegramUsername: e.target.value.replace('@', '') })}
                            placeholder="stiletto_support"
                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">Використовується кнопкою Telegram у віджеті «Написати нам»</span>
                      </div>

                      {/* Viber Number */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Номер Viber для швидкого чату</label>
                        <input
                          type="text"
                          value={settingsForm.viberNumber}
                          onChange={(e) => setSettingsForm({ ...settingsForm, viberNumber: e.target.value })}
                          placeholder="+380991234567"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500"
                        />
                        <span className="text-[10px] text-slate-400">Номер телефону з кодом країни (+380...) для відкриття Viber чату</span>
                      </div>

                      {/* Instagram */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Instagram акаунт (username без @)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">@</span>
                          <input
                            type="text"
                            value={settingsForm.instagramUsername}
                            onChange={(e) => setSettingsForm({ ...settingsForm, instagramUsername: e.target.value.replace('@', '') })}
                            placeholder="stiletto_atelier"
                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      </div>

                      {/* Working Hours */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Графік роботи підтримки</label>
                        <input
                          type="text"
                          value={settingsForm.workingHours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                          placeholder="Пн-Нд 09:00 - 21:00"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {/* Free Shipping Threshold */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Поріг безкоштовної доставки (₴)</label>
                        <input
                          type="number"
                          min={0}
                          value={settingsForm.freeShippingThreshold}
                          onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) || 0 })}
                          placeholder="1500"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500"
                        />
                        <span className="text-[10px] text-slate-400">Прогрес-бар у кошику автоматично рахує залишок до безкоштовної доставки</span>
                      </div>
                    </div>

                    {/* Widget Toggles */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Віджети та інтерактивні елементи
                      </h4>

                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={settingsForm.contactWidgetEnabled}
                          onChange={(e) => setSettingsForm({ ...settingsForm, contactWidgetEnabled: e.target.checked })}
                          className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <div className="space-y-0.5">
                          <strong className="text-xs text-slate-900 block font-bold">
                            Плаваючий віджет «Написати нам» у правому нижньому кутку
                          </strong>
                          <span className="text-[11px] text-slate-500 block">
                            Компактна кнопка зв'язку з вибором Telegram, Viber або швидкого дзвінка менеджеру, з бейджем «Онлайн».
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={settingsForm.socialProofEnabled}
                          onChange={(e) => setSettingsForm({ ...settingsForm, socialProofEnabled: e.target.checked })}
                          className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <div className="space-y-0.5">
                          <strong className="text-xs text-slate-900 block font-bold">
                            Спливаючі сповіщення про замовлення (Social Proof)
                          </strong>
                          <span className="text-[11px] text-slate-500 block">
                            Акуратні повідомлення «Олена з Києва щойно замовила...» з товарами з вашого каталогу для підвищення конверсії.
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Зберегти налаштування магазину</span>
                      </button>
                    </div>
                  </form>

                  {/* Promo Codes Engine */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
                        <Tag className="w-5 h-5 text-brand-600" />
                        <span>Движок промокодів & знижок</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Створюйте промокоди для рекламних кампаній або блогерів. Клієнти зможуть застосовувати їх у кошику та чек-ауті.
                      </p>
                    </div>

                    {/* Create Promo Code Form */}
                    <form onSubmit={handleCreatePromoCode} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-brand-600" />
                        <span>Створити новий промокод</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Код промокоду</label>
                          <input
                            type="text"
                            required
                            placeholder="GLOW15"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 uppercase font-mono font-bold text-xs focus:outline-none focus:border-brand-500 bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Тип знижки</label>
                          <select
                            value={promoDiscountType}
                            onChange={(e) => setPromoDiscountType(e.target.value as 'percent' | 'fixed')}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500 bg-white"
                          >
                            <option value="percent">Відсоток (%)</option>
                            <option value="fixed">Фіксована сума (₴)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Розмір знижки</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={promoDiscountVal}
                            onChange={(e) => setPromoDiscountVal(Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500 bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Мін. замовлення (₴)</label>
                          <input
                            type="number"
                            min={0}
                            value={promoMinOrder}
                            onChange={(e) => setPromoMinOrder(Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Додати промокод</span>
                        </button>
                      </div>
                    </form>

                    {/* Promo Codes List */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Активні промокоди ({promoCodes.length})
                      </h4>

                      {promoCodes.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                          {promoCodes.map((p) => (
                            <div key={p.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-200 font-mono font-bold tracking-wider text-xs">
                                  {p.code}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900">
                                    {p.discountType === 'percent' ? `Знижка -${p.discountValue}%` : `Знижка -${p.discountValue} ₴`}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {(p.minOrderAmount ?? 0) > 0 ? `Для замовлень від ${p.minOrderAmount} ₴` : 'Без мінімальної суми'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => togglePromoCode(p.id)}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                                    p.isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}
                                >
                                  {p.isActive ? '● Активний' : '○ Вимкнено'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deletePromoCode(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Видалити промокод"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs text-center py-6 border border-dashed border-slate-200 rounded-xl">
                          Немає налаштованих промокодів. Створіть перший промокод за допомогою форми вище.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Security: PIN Change Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-brand-600" />
                          <span>Безпека та зміна PIN-коду адміністратора</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Поточний PIN зберігається локально. Ви можете змінити його для захисту панелі керування.
                        </p>
                      </div>
                      {pinNotice && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          ✓ PIN оновлено!
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
                      <input
                        type="password"
                        placeholder="Новий PIN (мінімум 4 символи)"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={handleUpdatePin}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                      >
                        Зберегти новий PIN
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODULE 6: SUPABASE CLOUD DATABASE & IMAGE STORAGE        */}
              {/* ======================================================== */}
              {activeTab === 'supabase' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <SupabaseSettingsCard
                    products={products}
                    onProductsUpdated={setAllProducts}
                    storeId={STORE_ID}
                  />
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminControlHub;
