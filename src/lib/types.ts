export interface Variant {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  barcode?: string;
  available: boolean;
}

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
  sku: string;
  barcode: string;
  variants: Variant[];
  updatedAt?: string;
}

export interface CartLine {
  productId: string;
  variantId: string;
  handle: string;
  title: string;
  variantTitle: string;
  price: number;
  image: string;
  quantity: number;
}

// Строка таблицы public.products
export interface ProductRow {
  id: string;
  handle: string;
  title: string;
  body_html: string | null;
  vendor: string | null;
  product_type: string | null;
  tags: string[] | null;
  price: number | string;
  compare_at_price: number | string | null;
  images: string[] | null;
  featured_image: string | null;
  available: boolean;
  sku: string | null;
  barcode: string | null;
  variants: Partial<Variant>[] | null;
  updated_at?: string;
}
