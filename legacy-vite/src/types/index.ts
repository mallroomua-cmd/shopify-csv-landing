export interface Product {
  id: string;
  handle: string;
  title: string;
  bodyHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  price: number;
  compareAtPrice?: number;
  images: string[];
  featuredImage: string;
  available: boolean;
  sku?: string;
  barcode?: string;
  variants: {
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    sku?: string;
  }[];
}

export interface AnalyticsConfig {
  gaMeasurementId: string; // e.g. G-XXXXXXXXXX
  googleAdsId: string; // e.g. AW-XXXXXXXXX
  googleAdsConversionLabel: string; // e.g. AbC123XyZ
  merchantCenterTag: string; // e.g. <meta name="google-site-verification" content="..." />
  gtmId: string; // e.g. GTM-XXXXXXX
  fbPixelId: string; // e.g. 123456789012345
  telegramBotToken: string; // Telegram bot token for instant order leads
  telegramChatId: string; // Telegram chat ID
  novaPoshtaApiKey: string; // Optional Nova Poshta API key
  debugMode: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  telegramUsername: string;
  viberNumber: string;
  workingHours: string;
  freeShippingThreshold: number;
  contactWidgetEnabled: boolean;
  socialProofEnabled: boolean;
  instagramUsername?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  isActive: boolean;
}

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface OrderDetails {
  orderId?: string;
  name: string;
  phone: string;
  city: string;
  warehouse: string;
  deliveryMethod: 'nova_poshta' | 'ukrposhta' | 'courier';
  paymentMethod: 'cash_on_delivery' | 'card';
  notes?: string;
  items: CartItem[];
  total: number;
  website?: string;
  elapsedMs?: number;
  promoCode?: string;
  discountAmount?: number;
  ttn?: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

export interface StoredOrder extends OrderDetails {
  id: string;
  orderId: string;
  date: string;
  createdAt: number;
  status: OrderStatus;
  syncedToTelegram?: boolean;
  ttn?: string;
}

export interface CsvPreviewResult {
  totalRows: number;
  validProducts: Product[];
  invalidPriceCount: number;
  missingImageCount: number;
  categories: string[];
  filename?: string;
  fileSizeBytes?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  author: string;
  rating: number; // 1 to 5
  text: string;
  date: string;
  verified: boolean;
  skinType?: string;
}

export interface CustomerRecord {
  phone: string;
  name: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'new' | 'regular' | 'vip';
}


