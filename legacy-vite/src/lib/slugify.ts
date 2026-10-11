/**
 * Transliterates Ukrainian and Cyrillic text to SEO-friendly clean URL handles / slugs.
 */
const UKRAINIAN_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye',
  ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu',
  я: 'ya', ъ: '', ы: 'y', э: 'e', ё: 'yo',
};

export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => UKRAINIAN_MAP[char] ?? char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+|-+$/g, ''); // trim dashes
}
