import Papa from 'papaparse';
import { Product } from '../types';

/**
 * Robust price parser that handles both dot and comma decimals (e.g. Ukrainian Excel "1299,50" -> 1299.5)
 */
export function parsePrice(raw?: string): number {
  if (!raw) return 0;
  const s = raw.replace(/[\s\u00A0]/g, '').replace(/[^\d.,]/g, '');
  if (!s) return 0;
  const decComma = s.lastIndexOf(',') > s.lastIndexOf('.');
  const n = decComma ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  return parseFloat(n) || 0;
}

/**
 * Detects if a product row is active and published
 */
function isRowActive(row: Record<string, string>, hasExplicitActiveProducts = true): boolean {
  const status = (row['Status'] || row['status'] || '').trim().toLowerCase();
  if (status === 'archived') return false;
  // If the CSV contains zero explicitly active items (e.g. store backup where all items are draft), accept them all
  if (!hasExplicitActiveProducts) return true;
  const published = (row['Published'] || row['published'] || '').trim().toLowerCase();
  if (status === 'draft' || published === 'false') return false;
  return true;
}

/**
 * Reads a File object with automatic charset fallback (UTF-8 with fallback to Windows-1251 for Ukrainian Excel exports)
 */
export async function readCsvFileWithEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    // Fallback to Windows-1251 for legacy Excel CSVs
    return new TextDecoder('windows-1251').decode(buffer);
  }
}

export function parseShopifyCsv(csvString: string, options?: { includeDrafts?: boolean }): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
      complete: (results) => {
        try {
          const productsMap = new Map<string, Product>();

          // Check if CSV has any explicit active rows; if not (e.g. store backup where all are draft), allow all non-archived rows
          const hasExplicitActiveProducts = options?.includeDrafts
            ? false
            : results.data.some((row) => {
                const status = (row['Status'] || row['status'] || '').trim().toLowerCase();
                const published = (row['Published'] || row['published'] || '').trim().toLowerCase();
                return status === 'active' || published === 'true';
              });

          results.data.forEach((row) => {
            if (!isRowActive(row, hasExplicitActiveProducts)) return;

            const handle = (row['Handle'] || row['handle'] || '').trim();
            const title = (row['Title'] || row['title'] || '').trim();

            if (!handle && !title) return;

            const productKey = handle || title;

            // Extract image
            const imageSrc = (row['Image Src'] || row['image_src'] || row['Image URL'] || '').trim();

            // Robust price parsing (handles Ukrainian commas)
            const price = parsePrice(row['Variant Price'] || row['Price']);
            const compareAtPrice = parsePrice(row['Variant Compare At Price'] || row['Compare At Price']) || undefined;

            // Inventory quantity
            const rawQty = row['Variant Inventory Qty'];
            const inventoryQty = rawQty !== undefined && rawQty !== '' ? parseInt(rawQty, 10) : undefined;
            const inventoryPolicy = (row['Variant Inventory Policy'] || '').toLowerCase();
            const isAvailable = inventoryQty === undefined ? true : inventoryQty > 0 || inventoryPolicy === 'continue';

            const sku = (row['Variant SKU'] || row['SKU'] || '').trim();
            const barcode = (row['Variant Barcode'] || '').trim();

            // Multi-option support: Option1 Value, Option2 Value, Option3 Value
            const opt1 = (row['Option1 Value'] || '').trim();
            const opt2 = (row['Option2 Value'] || '').trim();
            const opt3 = (row['Option3 Value'] || '').trim();
            const combinedOptions = [opt1, opt2, opt3].filter(Boolean).join(' / ');
            const variantTitle = combinedOptions || (row['Variant Title'] || 'Default Title').trim();

            if (!productsMap.has(productKey)) {
              const tagsRaw = (row['Tags'] || row['tags'] || '').trim();
              const tags = tagsRaw
                ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
                : [];

              const bodyHtml = row['Body (HTML)'] || row['Body'] || row['Description'] || '';
              const vendor = (row['Vendor'] || row['vendor'] || '').trim();
              const productType = (row['Type'] || row['Product Category'] || 'Загальне').trim();

              const newProduct: Product = {
                id: productKey, // Stable ID based on handle/key
                handle: productKey,
                title: title || handle,
                bodyHtml,
                vendor,
                productType,
                tags,
                price: price || 0,
                compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined,
                images: imageSrc ? [imageSrc] : [],
                featuredImage: imageSrc || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
                available: isAvailable,
                sku,
                barcode,
                variants: [],
              };

              newProduct.variants.push({
                id: `var-${productKey}-0`,
                title: variantTitle,
                price: price || 0,
                compareAtPrice,
                sku,
              });

              productsMap.set(productKey, newProduct);
            } else {
              const existing = productsMap.get(productKey)!;

              if (imageSrc && !existing.images.includes(imageSrc)) {
                existing.images.push(imageSrc);
                if (!existing.featuredImage || existing.featuredImage.includes('unsplash.com/photo-1523275335684')) {
                  existing.featuredImage = imageSrc;
                }
              }

              if (existing.price === 0 && price > 0) {
                existing.price = price;
                existing.compareAtPrice = compareAtPrice;
              }

              if (variantTitle && !existing.variants.some((v) => v.title === variantTitle)) {
                existing.variants.push({
                  id: `var-${productKey}-${existing.variants.length}`,
                  title: variantTitle,
                  price: price || existing.price,
                  compareAtPrice: compareAtPrice || existing.compareAtPrice,
                  sku: sku || existing.sku,
                });
              }
            }
          });

          const finalProducts = Array.from(productsMap.values())
            .filter((p) => p.price > 0 && p.title.trim().length > 0)
            .map((p) => {
              if (p.images.length === 0) {
                p.images = [p.featuredImage];
              }
              return p;
            });

          resolve(finalProducts);
        } catch (err) {
          reject(err);
        }
      },
      error: (err: unknown) => {
        reject(err);
      },
    });
  });
}

/**
 * Analyzes CSV content before applying, returning preview metrics:
 * total rows, valid products, invalid prices count, missing images count, categories list
 */
export async function validateCsvPreview(
  csvString: string,
  filename?: string,
  fileSizeBytes?: number
): Promise<import('../types').CsvPreviewResult> {
  const products = await parseShopifyCsv(csvString);

  const categoriesSet = new Set<string>();
  let invalidPriceCount = 0;
  let missingImageCount = 0;

  products.forEach((p) => {
    if (p.productType) categoriesSet.add(p.productType);
    if (!p.price || p.price <= 0) invalidPriceCount++;
    if (!p.featuredImage || p.featuredImage.includes('unsplash.com/photo-1523275335684')) {
      missingImageCount++;
    }
  });

  const lines = csvString.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const totalRows = Math.max(0, lines.length - 1);

  return {
    totalRows,
    validProducts: products,
    invalidPriceCount,
    missingImageCount,
    categories: Array.from(categoriesSet),
    filename,
    fileSizeBytes,
  };
}

/**
 * Converts products catalog back into a standard, Shopify-compatible CSV format
 * Includes UTF-8 BOM (\uFEFF) for immediate compatibility with Ukrainian/European Microsoft Excel
 */
export function exportProductsToShopifyCsv(products: Product[]): string {
  const rows: Record<string, string | number>[] = [];

  products.forEach((product) => {
    const tagsString = (product.tags || []).join(', ');
    const variants =
      product.variants && product.variants.length > 0
        ? product.variants
        : [
            {
              id: `v-${product.id}`,
              title: 'Default Title',
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              sku: product.sku,
            },
          ];

    variants.forEach((variant, vIdx) => {
      const isFirst = vIdx === 0;
      const imageSrc = product.images[vIdx] || (isFirst ? product.featuredImage : '');

      rows.push({
        Handle: product.handle || product.id,
        Title: product.title,
        'Body (HTML)': isFirst ? product.bodyHtml || '' : '',
        Vendor: product.vendor || '',
        'Product Category': product.productType || 'Загальне',
        Type: product.productType || 'Загальне',
        Tags: isFirst ? tagsString : '',
        Published: 'TRUE',
        'Option1 Name': 'Title',
        'Option1 Value': variant.title || 'Default Title',
        'Option2 Name': '',
        'Option2 Value': '',
        'Option3 Name': '',
        'Option3 Value': '',
        'Variant SKU': variant.sku || (isFirst ? product.sku || '' : ''),
        'Variant Inventory Qty': product.available ? 99 : 0,
        'Variant Inventory Policy': 'continue',
        'Variant Price': variant.price ?? product.price,
        'Variant Compare At Price':
          variant.compareAtPrice || (isFirst && product.compareAtPrice ? product.compareAtPrice : ''),
        'Image Src': imageSrc || (isFirst ? product.featuredImage || '' : ''),
        'Image Position': imageSrc ? vIdx + 1 : '',
        Status: product.available ? 'active' : 'draft',
      });
    });

    if (product.images.length > variants.length) {
      for (let i = variants.length; i < product.images.length; i++) {
        rows.push({
          Handle: product.handle || product.id,
          Title: product.title,
          'Body (HTML)': '',
          Vendor: product.vendor || '',
          'Product Category': product.productType || '',
          Type: product.productType || '',
          Tags: '',
          Published: 'TRUE',
          'Option1 Name': '',
          'Option1 Value': '',
          'Option2 Name': '',
          'Option2 Value': '',
          'Option3 Name': '',
          'Option3 Value': '',
          'Variant SKU': '',
          'Variant Inventory Qty': '',
          'Variant Inventory Policy': '',
          'Variant Price': '',
          'Variant Compare At Price': '',
          'Image Src': product.images[i],
          'Image Position': i + 1,
          Status: 'active',
        });
      }
    }
  });

  const unparsed = Papa.unparse(rows, {
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
    header: true,
  });

  return '\uFEFF' + unparsed;
}

export function downloadShopifyCsv(products: Product[], filename = 'shopify_catalog_export.csv') {
  const csvContent = exportProductsToShopifyCsv(products);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

