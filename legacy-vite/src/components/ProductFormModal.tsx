import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Check,
  Plus,
  Sparkles,
  Link as LinkIcon,
  Layers,
  Tag,
  DollarSign,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Product } from '../types';
import { slugify } from '../lib/slugify';
import { uploadProductImage, isSupabaseConfigured } from '../lib/supabase';

interface VariantItem {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  onSave: (product: Product) => Promise<void>;
  allCategories: string[];
  allVendors: string[];
  storeId?: string;
  quickTags?: string[];
  presetVariants?: { label: string; values: string[] }[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  onSave,
  allCategories,
  allVendors,
  storeId = 'mallroom',
  quickTags = ['SPF', 'Сироватка', 'Крем', 'Муцин', 'Тонер', 'Хіт', 'Знижка', 'TOP', 'Подарунок'],
  presetVariants = [
    { label: "Об'єми косметики", values: ['30 ml', '50 ml', '100 ml'] },
    { label: 'Розміри одягу', values: ['S', 'M', 'L', 'XL'] },
  ],
}) => {
  const [title, setTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [autoHandle, setAutoHandle] = useState(true);
  const [price, setPrice] = useState<number>(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [productType, setProductType] = useState('');
  const [vendor, setVendor] = useState('');
  const [available, setAvailable] = useState(true);
  const [sku, setSku] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');

  // Images state: array of image URLs
  const [images, setImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [showManualUrl, setShowManualUrl] = useState(false);

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Variants state
  const [variants, setVariants] = useState<VariantItem[]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'media' | 'variants' | 'description'>('main');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setTitle(editingProduct.title || '');
      setHandle(editingProduct.handle || '');
      setAutoHandle(false);
      setPrice(editingProduct.price || 0);
      setCompareAtPrice(editingProduct.compareAtPrice);
      setProductType(editingProduct.productType || '');
      setVendor(editingProduct.vendor || '');
      setAvailable(editingProduct.available ?? true);
      setSku(editingProduct.sku || '');
      setBodyHtml(editingProduct.bodyHtml || '');

      const imgList = editingProduct.images && editingProduct.images.length > 0
        ? [...editingProduct.images]
        : editingProduct.featuredImage ? [editingProduct.featuredImage] : [];
      setImages(imgList);

      setTags(editingProduct.tags || []);
      setVariants(
        editingProduct.variants && editingProduct.variants.length > 0
          ? editingProduct.variants.map((v) => ({ ...v }))
          : [{ id: `var-${editingProduct.handle}-0`, title: 'Default Title', price: editingProduct.price }]
      );
    } else {
      // New product defaults
      setTitle('');
      setHandle('');
      setAutoHandle(true);
      setPrice(0);
      setCompareAtPrice(undefined);
      setProductType(allCategories[0] || (storeId === 'dune' ? 'Вуличний одяг' : 'Косметика'));
      setVendor(allVendors[0] || (storeId === 'dune' ? 'DUNE' : 'MALLROOM'));
      setAvailable(true);
      setSku(`SKU-${Date.now().toString().slice(-6)}`);
      setBodyHtml('');
      setImages([]);
      setTags(['Хіт']);
      setVariants([{ id: `var-${Date.now()}-0`, title: 'Стандартний', price: 0 }]);
    }

    setUploadError(null);
    setActiveTab('main');
  }, [isOpen, editingProduct, storeId]);

  // Handle title change with auto slugify
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (autoHandle) {
      setHandle(slugify(newTitle));
    }
  };

  // Upload image files
  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const uploadedUrls: string[] = [];
    const hasSupabase = isSupabaseConfigured();

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (hasSupabase) {
          const url = await uploadProductImage(file, storeId);
          uploadedUrls.push(url);
        } else {
          // Fallback to local Data URL for offline testing
          const localUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(localUrl);
        }
      }

      setImages((prev) => [...prev, ...uploadedUrls]);
      if (!hasSupabase) {
        setUploadError('Увага: Supabase не підключено. Фото збережено локально. Для збереження у хмарі вкажіть Supabase URL у вкладці "Хмара Supabase".');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(`Помилка завантаження фото: ${msg}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add manual image URL
  const handleAddManualUrl = () => {
    const trimmed = manualImageUrl.trim();
    if (!trimmed) return;
    if (!images.includes(trimmed)) {
      setImages((prev) => [...prev, trimmed]);
    }
    setManualImageUrl('');
    setShowManualUrl(false);
  };

  // Set image as featured (index 0)
  const handleSetFeaturedImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Tag helpers
  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Variant helpers
  const handleAddPresetVariants = (presetValues: string[]) => {
    const basePrice = price || 0;
    const baseCompare = compareAtPrice;
    const newVariants: VariantItem[] = presetValues.map((val, idx) => ({
      id: `var-${handle || Date.now()}-${idx + 1}`,
      title: val,
      price: basePrice,
      compareAtPrice: baseCompare,
      sku: sku ? `${sku}-${val.replace(/\s+/g, '')}` : undefined,
    }));
    setVariants(newVariants);
  };

  const handleAddCustomVariant = () => {
    const newIdx = variants.length + 1;
    setVariants([
      ...variants,
      {
        id: `var-${handle || Date.now()}-${newIdx}`,
        title: `Варіант ${newIdx}`,
        price: price || 0,
        compareAtPrice,
        sku: sku ? `${sku}-${newIdx}` : undefined,
      },
    ]);
  };

  const handleUpdateVariant = (index: number, updates: Partial<VariantItem>) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...updates } : v))
    );
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert('Товар повинен мати щонайменше 1 варіант');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Discount calculation
  const discountPercent =
    compareAtPrice && compareAtPrice > price && price > 0
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;
  const savings =
    compareAtPrice && compareAtPrice > price ? compareAtPrice - price : 0;

  // Save product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Будь ласка, вкажіть назву товару');
      return;
    }
    if (price <= 0) {
      alert('Ціна товару повинна бути більшою за 0 ₴');
      return;
    }

    setIsSaving(true);
    try {
      const finalHandle = handle.trim() || slugify(title);
      const featured = images[0] || '';

      const productToSave: Product = {
        id: editingProduct ? editingProduct.id : `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        handle: finalHandle,
        title: title.trim(),
        price,
        compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined,
        productType: productType.trim() || (storeId === 'dune' ? 'Одяг' : 'Косметика'),
        vendor: vendor.trim() || (storeId === 'dune' ? 'DUNE' : 'MALLROOM'),
        available,
        featuredImage: featured,
        images: images.length > 0 ? images : featured ? [featured] : [],
        tags,
        bodyHtml: bodyHtml.trim(),
        sku: sku.trim(),
        variants:
          variants.length > 0
            ? variants.map((v) => ({
                id: v.id,
                title: v.title,
                price: Number(v.price) || price,
                compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
                sku: v.sku || sku,
              }))
            : [{ id: `var-${finalHandle}-0`, title: 'Default Title', price }],
      };

      await onSave(productToSave);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Помилка збереження товару: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-white">
                {storeId === 'dune' ? 'DUNE' : 'MALLROOM'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingProduct ? 'Редагування товару' : 'Швидке додавання нового товару'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Товар одразу збережеться у хмарній базі Supabase та зʼявиться на вітрині
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'main'
                ? 'border-black text-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Основне & Ціна
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'media'
                ? 'border-black text-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Фото товару ({images.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'variants'
                ? 'border-black text-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Розміри / Варіанти ({variants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'description'
                ? 'border-black text-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Опис & Характеристики
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* TAB 1: MAIN */}
          {activeTab === 'main' && (
            <div className="space-y-4">
              {/* Product Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Назва товару *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Приклад: Skin1004 Madagascar Centella Ampoule</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Введіть повну назву товару..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* URL Handle / Slug */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                    Посилання товару (URL Slug)
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoHandle}
                      onChange={(e) => setAutoHandle(e.target.checked)}
                      className="rounded text-black focus:ring-black"
                    />
                    Авто-генерація з назви
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[11px]">/products/</span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => {
                      setHandle(e.target.value);
                      setAutoHandle(false);
                    }}
                    placeholder="skin1004-centella-ampoule"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:border-black bg-white"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Ціна продажу (₴) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price || ''}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="450"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Стара ціна (для знижки, ₴)</span>
                    {discountPercent && discountPercent > 0 && (
                      <span className="bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                        -{discountPercent}% (Економія {savings} ₴)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={compareAtPrice || ''}
                    onChange={(e) =>
                      setCompareAtPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="650 (необов'язково)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-600 focus:outline-none focus:border-black bg-white"
                  />
                </div>
              </div>

              {/* Category & Vendor Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Категорія / Тип товару</label>
                  <input
                    type="text"
                    list="cat-datalist"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="Оберіть або введіть..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-black"
                  />
                  <datalist id="cat-datalist">
                    {allCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {allCategories.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setProductType(c)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          productType === c ? 'bg-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Бренд / Виробник</label>
                  <input
                    type="text"
                    list="vendor-datalist"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Назва бренду..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-black"
                  />
                  <datalist id="vendor-datalist">
                    {allVendors.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {allVendors.slice(0, 5).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVendor(v)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          vendor === v ? 'bg-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SKU & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Артикул (SKU)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="MLR-1002"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Швидкі теги (клікніть для вибору)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickTags.map((qt) => {
                      const isSelected = tags.includes(qt);
                      return (
                        <button
                          key={qt}
                          type="button"
                          onClick={() => (isSelected ? handleRemoveTag(qt) : handleAddTag(qt))}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-black text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                          {qt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      placeholder="Власний тег..."
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:border-black flex-1 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(tagInput)}
                      className="px-2.5 py-1 bg-black text-white rounded-lg text-[10px] font-bold hover:bg-slate-800"
                    >
                      + Додати
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock Switch */}
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className="font-bold text-slate-800">
                  {available ? '🟢 Товар у наявності (доступний до замовлення)' : '🔴 Немає в наявності (Sold Out)'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA (PHOTOS) */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              {/* UPLOAD DROPZONE */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-black hover:bg-slate-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors text-slate-600">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-black group-hover:text-white" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {isUploading ? 'Завантаження фото в Supabase Storage...' : 'Виберіть фото з компʼютера або перетягніть сюди'}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Підтримуються JPG, PNG, WEBP. Можна вибрати одразу декілька фото.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFilesUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Add Manual URL toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-700">Завантажені фото ({images.length})</span>
                <button
                  type="button"
                  onClick={() => setShowManualUrl(!showManualUrl)}
                  className="text-xs text-slate-600 hover:text-black font-semibold flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3" />
                  {showManualUrl ? 'Сховати поле URL' : 'Вставити пряме посилання (URL)'}
                </button>
              </div>

              {showManualUrl && (
                <div className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="url"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="https://images.example.com/photo.jpg"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-black bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualUrl}
                    className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                  >
                    Додати
                  </button>
                </div>
              )}

              {/* IMAGES GALLERY GRID */}
              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((imgUrl, idx) => {
                    const isFeatured = idx === 0;
                    return (
                      <div
                        key={`${imgUrl}-${idx}`}
                        className={`relative group rounded-xl overflow-hidden border-2 bg-slate-100 aspect-square flex items-center justify-center transition-all ${
                          isFeatured ? 'border-black ring-2 ring-black/20 shadow-md' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Фото ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/400x400/f1f5f9/94a3b8?text=Зображення';
                          }}
                        />

                        {/* Top Badge */}
                        <div className="absolute top-1.5 left-1.5">
                          {isFeatured ? (
                            <span className="bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-current" /> Головне
                            </span>
                          ) : (
                            <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          {!isFeatured && (
                            <button
                              type="button"
                              onClick={() => handleSetFeaturedImage(idx)}
                              className="px-2.5 py-1 bg-white text-black rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              Зробити головним
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700 transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            Видалити
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600">Ще не додано жодного фото</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Завантажте фото товару вище або вставте посилання
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VARIANTS */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Розміри, об'єми або кольори</h4>
                  <p className="text-slate-500 text-[11px]">
                    Дозволяє покупцю обрати потрібний розмір (напр. S, M, L) або обʼєм (30ml, 50ml)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomVariant}
                  className="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Додати варіант
                </button>
              </div>

              {/* Presets */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px]">Швидкі пресети варіантів:</span>
                <div className="flex flex-wrap gap-2">
                  {presetVariants.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleAddPresetVariants(preset.values)}
                      className="px-2.5 py-1 bg-white hover:bg-black hover:text-white border border-slate-200 rounded-lg text-xs font-medium transition-all"
                    >
                      + {preset.label} ({preset.values.join(', ')})
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <tr>
                      <th className="p-3">Назва варіанту</th>
                      <th className="p-3">Ціна (₴)</th>
                      <th className="p-3">Стара ціна (₴)</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-right">Дія</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variants.map((v, idx) => (
                      <tr key={v.id || idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={v.title}
                            onChange={(e) => handleUpdateVariant(idx, { title: e.target.value })}
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 font-medium text-xs focus:outline-none focus:border-black"
                            placeholder="Напр. 50 ml або M"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) =>
                              handleUpdateVariant(idx, { price: parseFloat(e.target.value) || 0 })
                            }
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs focus:outline-none focus:border-black"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={v.compareAtPrice || ''}
                            onChange={(e) =>
                              handleUpdateVariant(idx, {
                                compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                              })
                            }
                            placeholder="—"
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:border-black"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={v.sku || ''}
                            onChange={(e) => handleUpdateVariant(idx, { sku: e.target.value })}
                            placeholder="SKU"
                            className="w-28 px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:border-black"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DESCRIPTION */}
          {activeTab === 'description' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Опис товару, переваги та застосування
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBodyHtml((prev) => `${prev}\n<p><strong>Особливості:</strong></p>\n<ul>\n  <li>Оригінал з сертифікатом якості</li>\n  <li>Швидкий помітний ефект</li>\n</ul>`)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                  >
                    + Шаблон списку
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyHtml((prev) => `${prev}\n<p><strong>Спосіб застосування:</strong> Нанести невелику кількість на очищену шкіру легкими масажними рухами.</p>`)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                  >
                    + Застосування
                  </button>
                </div>
              </div>

              <textarea
                rows={8}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="Введіть повний опис товару (підтримується звичайний текст та HTML-теги <p>, <ul>, <li>, <strong>)..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 font-sans text-xs focus:outline-none focus:border-black leading-relaxed"
              />

              {bodyHtml && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Попередній перегляд опису:
                  </span>
                  <div
                    className="prose prose-xs max-w-none text-slate-700 leading-normal"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                </div>
              )}
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              Скасувати
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Збереження у хмару...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingProduct ? 'Зберегти зміни' : 'Опублікувати товар'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
