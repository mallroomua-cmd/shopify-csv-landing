// Единый источник данных о магазине и продавце. Реквизиты — через env (заполнить перед запуском рекламы).
const env = (key: string, fallback = '') => process.env[key]?.trim() || fallback;

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  name: 'MALLROOM',
  tagline: 'Доглянута косметика з доставкою по Україні',
  description:
    'MALLROOM — інтернет-магазин косметики та догляду. Доставка Новою Поштою по всій Україні, оплата при отриманні.',
  url: env('NEXT_PUBLIC_SITE_URL', vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000').replace(/\/$/, ''),
  locale: 'uk_UA',
  currency: 'UAH',
  freeShippingFrom: Number(env('NEXT_PUBLIC_FREE_SHIPPING_FROM', '1500')),
};

export const seller = {
  legalName: env('NEXT_PUBLIC_SELLER_NAME', '[ФОП — буде вказано]'),
  taxId: env('NEXT_PUBLIC_SELLER_TAX_ID', '[РНОКПП — буде вказано]'),
  address: env('NEXT_PUBLIC_SELLER_ADDRESS', '[Адреса — буде вказано]'),
  iban: env('NEXT_PUBLIC_SELLER_IBAN', ''),
  phone: env('NEXT_PUBLIC_SELLER_PHONE', ''),
  email: env('NEXT_PUBLIC_SELLER_EMAIL', ''),
  hours: env('NEXT_PUBLIC_SELLER_HOURS', 'Пн–Пт 10:00–19:00'),
};

export const legalPages = [
  { href: '/dostavka-i-oplata', title: 'Доставка і оплата' },
  { href: '/povernennya', title: 'Повернення та обмін' },
  { href: '/oferta', title: 'Публічна оферта' },
  { href: '/privacy', title: 'Політика конфіденційності' },
  { href: '/kontakty', title: 'Контакти' },
] as const;
