const UA_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i',
  ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ъ: '', ы: 'y',
  э: 'e', ё: 'io', "'": '', '’': '',
};

/** Транслитерация (КМУ №55) → slug для URL. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .split('')
    .map((c) => UA_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const uah = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });
export const formatPrice = (n: number) => `${uah.format(Math.round(n))} ₴`;

/** next/image оптимизирует только фото из нашего Supabase Storage; внешние URL — как есть. */
export const canOptimize = (src: string) => src.includes('/storage/v1/object/public/');

/** Описание товара пишут только админы (RLS), но всё равно вычищаем активный контент. */
export const sanitizeHtml = (html: string) =>
  html
    .replace(/<(script|style|iframe|object|embed|form|link|meta)[\s\S]*?(<\/\1>|\/?>)/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');

/** Убирает HTML для description / фида. */
export const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
