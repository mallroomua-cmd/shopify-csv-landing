# ROADMAP — MALLROOM

Основано на `docs/AUDIT.md` (2026-10-11). Версии сверены через `npm show` 2026-10-11: next 16.4.0, @supabase/supabase-js 2.117.3, @medusajs/medusa 2.21.2, payload 3.90.2, tailwindcss 4.3.3, @playwright/test 1.64.0, vite 8.3.4.

> Важно: Next.js анонсировал внеплановый security-релиз на **14.10.2026** (2 Critical + 1 High в зависимостях). Фиксируем версию next только после этого релиза.

## 2.1 Архитектура

Фронтенд в любом варианте: **Next.js 16 (App Router, SSG/ISR) на Vercel**. Текущий Vite SPA без URL не индексируется, и пререндер поверх модалок — это заплатка. Компоненты UI (React 19 + Tailwind) переносятся почти без изменений.

| Критерий | A. Next.js + Supabase + своя админка | B. Next.js headless + Shopify (Storefront API) | C. Medusa 2 / Payload 3 |
|---|---|---|---|
| Скорость запуска | M–L: админка, импорт и заказы уже частично есть, но всё нужно чинить (B1, B2, H1–H6) | **S–M**: админка, импорт CSV, остатки, CDN картинок, заказы, письма — готовые | L: свой сервер, настройка, плагины UA |
| Стоимость в месяц | Supabase Free / Pro $25 + Vercel Hobby/Pro $0–20 | Shopify Basic ~$39 + стороннее комиссионное 2% (Basic) + эквайринг; Vercel $0–20 | VPS/БД $10–40 + время разработчика |
| Поддержка | вся безопасность наша (RLS, вебхуки, пересчёт цен) | платёж и чекаут — зона Shopify | вся наша, плюс обновления фреймворка |
| Гибкость | максимальная | чекаут ограничен Shopify | высокая |
| UA-платежи | Monobank Acquiring напрямую (код уже есть) | plata by mono / LiqPay / WayForPay через Payment Apps (по данным агентства trademinister, **официально не проверено**) | интеграции писать самим |
| Нова Пошта | API НП напрямую | приложение НП в Shopify или свой виджет (не проверено) | писать самим |
| Merchant Center | свой фид (пишем) | Google & YouTube channel + свой фид при необходимости | свой фид |
| Совместимость с вашими инструментами | CSV-импорт формата Shopify уже реализован | **нативно**: `shopify-parser`, `1688-to-shopify`, `eion-listing` уже работают с Shopify | нет |

**Рекомендация: B — Next.js headless + Shopify.** Для небольшого магазина это убирает три блокера безопасности (подделка оплаты, цена с клиента, открытая БД заказов) просто потому, что чекаут, оплата и ПДн живут в Shopify. Вы уже работаете с Shopify-стеком и инструментами. Минус — комиссии (на Basic суммарно до ~5% с карты, по данным агентства; проверить на месте) и меньше контроля над чекаутом.

**Когда выбрать A:** если комиссии Shopify неприемлемы или нужен полностью свой чекаут. Тогда P0 ниже дополняется задачами A-1…A-5.

⚠️ **Решение за вами** — от него зависит P0. Ниже план расписан для B, отличия для A помечены.

## 2.2 Дорожная карта

Оценка: S ≤ 0.5 дня, M 1–2 дня, L 3–5 дней.

### P0 — блокеры (до любого трафика)

| # | Задача | Файлы | Оценка | Зависит | Готово, когда | Проверка |
|---|---|---|---|---|---|---|
| P0-1 | Срочная защита текущего сайта: снять `Anon all` политики, `git rm --cached .env`, ротация anon key, выключить `#admin` PIN в prod, удалить GitHub Pages deploy | `supabase_schema.sql`, `.env`, `AdminControlHub.tsx`, `deploy.yml` | S | доступ к Supabase | anon не может `select` из orders | `curl` к PostgREST с anon key → 401/пусто |
| P0-2 | Починить CI: убрать симлинк `node_modules`, `npm install`, lock, ESLint, `lint`-скрипт, typecheck `api/` | `package*.json`, `tsconfig*.json`, `eslint.config.js`, `ci.yml` | S | — | `npm ci && npm run lint && npm run build && npm test` зелёные в Actions | GitHub Actions |
| P0-3 | Скелет Next.js 16 (App Router, TS strict, Tailwind 4, next/font, next/image) + перенос UI-компонентов | `app/**`, `components/**` | L | решение 2.1 | главная, `/c/[slug]`, `/p/[handle]`, корзина работают | e2e |
| P0-4 | Источник каталога: Storefront API (B) / Supabase server-side (A). Удалить `SAMPLE_PRODUCTS` из прод-кода | `lib/catalog.ts` | M | P0-3 | нет моков в бандле | `grep` + build |
| P0-5 | Чекаут: Shopify Checkout + plata by mono (B) / **A:** серверный пересчёт цены, ECDSA-проверка `X-Sign`, `insert` заказа с серверным id, убрать демо-оплату | `api/*` или Shopify | M | P0-4 | оплатить можно только реальную сумму | unit-тесты подписи, e2e с тестовой картой |
| P0-6 | Юр. страницы по URL: `/oferta`, `/povernennya`, `/dostavka-i-oplata`, `/privacy`, `/kontakty`, реквизиты из одного конфига | `app/(legal)/**`, `config/seller.ts` | S | ваши реквизиты | страницы в sitemap и в футере | curl 200 + HTML без JS |
| P0-7 | Убрать фейки: рейтинг «★ 5.0», «В НАЯВНОСТІ» всегда, хардкод отзывов, `verified: true`, генераторы покупок, «гарантія 14 днів» | `ProductCard`, `ReviewsSection`, `SocialProofToast`, `LiveSocialProof` | S | — | grep пуст | grep + визуально |
| P0-8 | Свои изображения: перенести с lil-shop.com.ua в Shopify CDN / Supabase Storage | импорт | M | решение по правам | 0 внешних хотлинков | grep `lil-shop` |

### P1 — запуск

| # | Задача | Оценка | Готово, когда | Проверка |
|---|---|---|---|---|
| P1-1 | Редизайн по дизайн-системе (ui-ux-pro-max: stone + gold `#A16207`, Cormorant/Montserrat cyrillic), токены, контраст AA, focus-visible, тач 44 px, `<dialog>` | L | Lighthouse a11y ≥ 95 | Lighthouse CI |
| P1-2 | SEO: Metadata API, canonical, OG 1200×630, `sitemap.ts`, `robots.ts`, JSON-LD Organization/WebSite/Product+Offer/BreadcrumbList | M | Rich Results Test без ошибок | Google Rich Results Test |
| P1-3 | Фид `/feed/google.xml` (ISR, 1 ч) из того же источника, что и карточка | M | цена/наличие = карточке | тест сравнения фид ↔ страница |
| P1-4 | GA4 + Ads через GTM, Consent Mode v2 (`denied` по умолчанию) + баннер, все e-commerce события, дедуп purchase по transaction_id, gclid/UTM в заказ | M | события видны в DebugView | Tag Assistant + e2e |
| P1-5 | Нова Пошта API (поиск города/отделения) | M | реальные отделения | e2e |
| P1-6 | Performance: JS главной < 120 KB gz, AVIF/WebP, LCP < 2.5 s на 4G | M | Lighthouse mobile perf ≥ 90 | Lighthouse CI |
| P1-7 | Playwright e2e: каталог → товар → корзина → чекаут → purchase event | M | в CI | Actions |
| P1-8 | Sentry, CSP/HSTS, preview/prod на Vercel, домен | S | ошибки приходят в Sentry | тестовая ошибка |

### P2 — рост
Отзывы с подтверждением по заказу; ЛК и история заказов; XLSX-импорт (A); фильтры по свойствам (тип кожи, объём); Performance Max с feed-only; RU/EN локали (`/ru`, hreflang); email-маркетинг; Enhanced Conversions for Leads/offline import для оплат по IBAN.

## 2.3 Каталог и загрузка товаров

**Схема данных** (в B — нативные сущности Shopify; в A — таблицы Postgres):

| Сущность | Ключевые поля |
|---|---|
| product | id, handle (slug, уникальный), title_uk, description_uk, brand_id, category_id, product_type, status (draft/active), google_product_category, created_at |
| variant | id, product_id, sku, gtin (EAN-13 штрихкод — у косметики почти всегда есть), option1 (объём/оттенок), price, compare_at_price, weight_g |
| inventory | variant_id, location_id, quantity, updated_at |
| category | id, slug, parent_id, title_uk |
| collection | id, slug, title_uk, rule / ручной список |
| brand | id, slug, name, logo, authorization_doc (подтверждение оригинальности) |
| media | id, product_id, variant_id?, url, alt_uk, position, width, height |

- **Админка:** B — Shopify Admin. A — перенос текущего `AdminControlHub` (разбитого по вкладкам) за Supabase Auth с allowlist.
- **Импорт:** B — нативный CSV-импорт Shopify (ваш `shopify-parser` уже делает этот формат). A — загрузчик CSV/XLSX (`papaparse` + `xlsx`) с валидацией zod, предпросмотром diff (новые / изменённые / ошибки) и upsert по `handle`+`sku`. Шаблон файла: `docs/templates/products-import.csv` (сделаем в P0-4).
- **Изображения:** B — Shopify CDN (`?width=` даёт ресайз, WebP/AVIF по Accept). A — Supabase Storage + `next/image` (Vercel Image Optimization).
- **Slug:** транслитерация по КМУ №55 (уже есть `src/lib/slugify.ts` — переиспользуем), неизменяемый после публикации, при смене — 301.
- **Языки:** uk — основной без префикса; ru/en в P2 через `/ru`, `/en` + hreflang.

## 2.4 Google Ads / Merchant Center

**1. Обязательные страницы:** контакты (телефон, email, адрес), возврат (14 дней + исключение КМУ №172 для косметики), доставка (сроки, стоимость НП), оплата (способы), конфиденциальность, оферта, реквизиты ФОП (ПІБ, РНОКПП, адрес). Все — по отдельным URL, без JS.

**2. Атрибуты фида** (для косметики, а не одежды — size/gender/age_group не нужны, кроме исключений):
`id` (= variant id, совпадает с `item_id` в GA4), `title`, `description`, `link`, `image_link`, `additional_image_link`, `price` (`1299.00 UAH`), `sale_price`, `availability`, `brand`, `gtin` (EAN) / иначе `mpn` + `identifier_exists=no`, `condition=new`, `google_product_category` (469 Health & Beauty › Personal Care › Cosmetics — уточнить по таксономии), `product_type`, `item_group_id` (для оттенков/объёмов), `color` (для оттенков), `size` (объём), `shipping` (UA, НП, цена), `shipping_weight`.

**3. Генерация:** `/feed/google.xml` (ISR revalidate 3600) → в Merchant Center как scheduled fetch раз в сутки. Merchant API v1 — только если понадобятся мгновенные обновления (Content API выведен 18.08.2026).

**4. JSON-LD:** Product + Offer (price, priceCurrency UAH, availability, url = canonical, sku, gtin13, brand, `hasMerchantReturnPolicy`, `shippingDetails`) — строится той же функцией, что и фид.

**5. Трекинг:** GTM + GA4 + Ads Conversion. События: `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase` (transaction_id, value, currency `UAH`, items). Consent Mode v2 (advanced, default `denied`) + баннер (accept / reject / настройки). Enhanced Conversions (sha256 email/телефон, без открытого текста). Дедуп purchase по transaction_id (+ в B — Shopify Customer Events / Web Pixel). gclid, gbraid, wbraid, UTM → cookie 90 дней → в атрибуты заказа.

**6. Чек-лист против отклонения:**
- [ ] Цена/наличие/валюта в фиде = на странице = в JSON-LD
- [ ] Нет фейковых рейтингов, отзывов, счётчиков, «осталось 2 шт» без данных
- [ ] Реквизиты, контакты, политики доступны из футера на всех страницах
- [ ] Чекаут работает, есть реальная оплата и способ возврата
- [ ] Люкс-бренды: документы от официального дистрибьютора / инвойсы; фото свои или с разрешения; не использовать логотипы брендов в рекламе без права
- [ ] HTTPS, нет битых ссылок, мобильная версия
- [ ] Нет обещаний, противоречащих политикам («гарантія 14 днів» vs КМУ №172)

**7.** В аккаунтах Google ничего не делаю без вашего подтверждения.

## 2.5 Качество и деплой

- **CI (GitHub Actions):** `npm ci` → `typecheck` → `lint` → `test` (vitest) → `build` → Playwright e2e против Vercel preview → Lighthouse CI (perf ≥ 90, a11y ≥ 95, seo = 100).
- **Окружения:** Vercel preview на каждый PR, prod из `main`. Секреты — только в Vercel env.
- **Мониторинг:** Sentry (frontend + route handlers), Vercel Analytics / Speed Insights.
- **Бэкапы:** A — Supabase PITR (Pro) / ежедневный `pg_dump` в Actions. B — экспорт товаров CSV по расписанию.
- **Домен:** нужен ваш домен (для Merchant Center и HSTS).
