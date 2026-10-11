# AUDIT — MALLROOM (shopify-csv-landing)

Дата: 2026-10-11 · Ветка: `audit/claude-review` · Режим: только чтение (код приложения не менялся)

## 0. Сводка

| Область | Оценка |
|---|---|
| Код / архитектура | 4/10 |
| Безопасность | 3/10 |
| Производительность | 4/10 |
| SEO | 2/10 |
| UX / a11y | 4/10 |
| E-commerce функционал | 5/10 |
| Юридические страницы | 4/10 |
| Google Ads / Merchant Center | 2/10 |

**Главное:** это не Next.js, а **Vite 6 + React 19 SPA без роутера и без SSR**. У товаров, категорий и юр. страниц нет URL (только модалки и `#hash`). Из-за этого невозможны SEO и Merchant Center. Плюс БД Supabase открыта на запись и чтение для любого (если применена схема из корня), а оплата подделывается одним POST-запросом.

## 1. Инвентаризация

| Пункт | Факт |
|---|---|
| Стек | Vite 6.4.4, React 19, TS ~5.7 (strict), Tailwind 3.4.19, Supabase JS 2.x, papaparse, dompurify, lucide-react (`package.json`) |
| Роутинг | нет (react-router отсутствует); hash-обработчик `src/context/StoreContext.tsx:473-546` знает только `#admin` и юр. вкладки |
| Package manager | npm 11.11 / Node 24.14 локально, Node 20 в CI |
| Скрипты | `dev`, `build` (`tsc -b && vite build`), `preview`, `test` (11 файлов через `jiti`). **Нет `lint`** |
| Бэкенд | Vercel Functions `api/feed.ts`, `api/order.ts`, `api/monobank.ts`*, `api/mono-webhook.ts`* (* — не закоммичено) |
| Данные | Supabase → IndexedDB → `SAMPLE_PRODUCTS` (`StoreContext.tsx:567-600`) |
| Внешние сервисы | Supabase, Telegram Bot API, Google Sheets webhook, Monobank Acquiring, GA4/Ads (gtag), картинки с lil-shop.com.ua, Unsplash |
| Env | `.env.example`: VITE_GA_ID, VITE_ADS_ID/LABEL, VITE_GMC_TAG, VITE_GTM_ID, VITE_ADMIN_PIN, TG_BOT_TOKEN, TG_CHAT_ID, SHEETS_WEBHOOK_URL, VITE_SITE_URL, VITE_SUPABASE_URL/ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, MONO_MERCHANT_TOKEN, MONO_WEBHOOK_URL |
| Деплой | **два противоречащих**: `.github/workflows/deploy.yml` (GitHub Pages — `api/` там не работает) и `vercel.json`. Какой боевой — не проверено |
| Бандл | `index-*.js` **740 KB (210 KB gzip)**, AdminControlHub 158 KB, CSS 56 KB (вывод `vite build`) |
| Размер кода | ~18.5k строк; `AdminControlHub.tsx` 3483, `StoreContext.tsx` 1131, `ProductFormModal.tsx` 985 |
| Незакоммиченное в `main` | +587/−56 в 9 файлах + новые `api/monobank.ts`, `api/mono-webhook.ts`, `supabase/schema.sql`, `ci.yml`, 2 теста — связная WIP (заказы в Supabase, Monobank, вход в админку через Supabase Auth). Перенесено в эту ветку без коммита |

## 2. Результаты проверок

| Проверка | Результат |
|---|---|
| `tsc -b` | ✅ 0 ошибок — но `tsconfig.json:21` `include: ["src"]`: `api/` и `scripts/` не проверяются (ручной tsc по api/ → TS2307 `@vercel/node`) |
| lint | ❌ ESLint не настроен |
| `npm test` | ✅ 11/11 файлов. Часть тестов проверяет **копию логики в самом тесте** (`test/wave2-features.test.ts:15,50,105`, `wave3:7,74`, `wave4:25,31`) |
| `vite build` | ✅ с предупреждением «chunk > 500 kB» |
| `npm audit` | ❌ 7 уязвимостей (5 high, 2 moderate) — цепочка tailwind 3 → fast-glob/micromatch, postcss-selector-parser |
| `npm ci` (CI) | ❌ **упадёт**: `@supabase/supabase-js` есть в `package.json`, но отсутствует в `package-lock.json`. Локально работает только из-за симлинка `node_modules → ../shopify-landing/node_modules` |
| Lighthouse | не проверено (будет в Фазе 4 через браузер) |

## 3. Находки

### Blocker
| # | Область | Проблема | Где | Исправление |
|---|---|---|---|---|
| B1 | Security | RLS: anon может всё с `products` и `orders` (читать ПДн покупателей, менять цены, удалять) | `supabase_schema.sql:75-83`, применяется `scripts/setup-supabase.mjs:110` | Удалить корневую схему, применить `supabase/schema.sql` с доработкой (см. H4), перевыпустить anon key. Живое состояние RLS — **не проверено** |
| B2 | Security | Webhook Monobank без проверки `X-Sign` (ECDSA) и сверки суммы → «оплачено» подделывается | `api/mono-webhook.ts:15-57` | Проверка подписи по pubkey Monobank по сырому телу, сверка `amount` со статусом `invoice/status`, идемпотентность |
| B3 | SEO/Ads | Нет URL у товаров/категорий; SPA без SSR/пререндера (`index.html` пустой `#root`) | `src/App.tsx`, `index.html:35` | Роуты `/product/:handle`, `/c/:slug` + SSG/SSR |
| B4 | Ads | Фид из моков, ссылки ведут на главную | `api/feed.ts:2,18`; `src/lib/merchant-xml.ts:29` | Фид из БД, `link` = URL карточки |
| B5 | Legal/Ads | Юр. страницы — модалки по `#`, в sitemap `/#refund` и т.п. | `PolicyModal.tsx`, `public/sitemap.xml:8-36` | Отдельные статические URL |
| B6 | Legal | Реквизиты-заглушки и расходятся: «ФОП Шулім Е. О.» ЄДРПОУ 3344556677 vs «ФОП Шулім Е. М.» 3284910294; IBAN-шаблон | `CheckoutModal.tsx:248-267`, `PolicyModal.tsx:684-695` | Реальные реквизиты в одном конфиге |
| B7 | UX/Legal | Фейковый рейтинг «★ 5.0 · ПЕРЕВІРЕНО» на каждой карточке; «В НАЯВНОСТІ» всегда | `ProductCard.tsx:130-132`, `:64` | Убрать / брать из данных |
| B8 | CI | `npm ci` падает (lock без supabase-js) | `package-lock.json` | Удалить симлинк, `npm install`, закоммитить lock |

### High
| # | Область | Проблема | Где | Исправление |
|---|---|---|---|---|
| H1 | Security | Сервер доверяет цене/сумме с клиента; промокоды в localStorage | `api/monobank.ts:23,55-58`; `api/order.ts:67-68,132`; `StoreContext.tsx:284-319` | Пересчёт на сервере по БД |
| H2 | Security | Админка: клиентский PIN, по умолчанию `1234`, открывается по `#admin` | `AdminControlHub.tsx:129`; `StoreContext.tsx:251` | Только Supabase Auth + серверная проверка роли |
| H3 | Security | `.env` отслеживается git (в HEAD), anon key захардкожен в скрипте | `git ls-files .env`; `scripts/seed-supabase.mjs:11` | `git rm --cached .env`, ключ в env, ротация |
| H4 | Security | В новой схеме любой `authenticated` = админ | `supabase/schema.sql:104-123` | Allowlist админов (таблица/claim), выключить signup |
| H5 | Security | Stored XSS в превью админки (без DOMPurify) | `ProductFormModal.tsx:943` | `DOMPurify.sanitize` |
| H6 | Security | Демо-оплата без токена «проходит» (`paid=1`), open redirect через `redirectUrl` | `api/monobank.ts:33,89,102-112` | В prod — ошибка; redirect только из env |
| H7 | Ads | Consent Mode v2 по умолчанию `granted`, нет cookie-баннера | `src/lib/analytics.ts:136-141` | `denied` по умолчанию + баннер |
| H8 | Ads/Legal | Фото люкс-брендов хотлинком с lil-shop.com.ua, «100% оригінал» без подтверждения | `src/lib/sample-data.ts:16+` (59 URL) | Свои фото/CDN, документы от дистрибьютора |
| H9 | UX/Ads | Захардкоженные отзывы «Вчора о 14:20», «1 280 замовлень · 4.9»; любой отзыв `verified: true` | `ReviewsSection.tsx:14-45,62,80`; `ProductDetailModal.tsx:192-195` | Реальные отзывы или убрать |
| H10 | Perf | Supabase SDK (~36 KB gz), papaparse, моки в главном чанке | `StoreContext.tsx:17,36-46,218` | Динамический импорт, данные из API |
| H11 | a11y | Карточка — `div onClick`, без клавиатуры; модалки без focus trap и `aria-labelledby` | `ProductCard.tsx:52-55`; `src/hooks/useModal.ts` | `<a href>`, нативный `<dialog>` / focus trap |
| H12 | Deploy | GitHub Pages workflow деплоит без `api/` → `/api/monobank` 404 | `.github/workflows/deploy.yml` | Оставить только Vercel |
| H13 | SEO | JSON-LD только внутри модалки, `url` с `#`, seller «Магазин» | `ProductJsonLd.tsx:18-32`; `ProductDetailModal.tsx:211` | JSON-LD на странице товара, Organization/WebSite/Breadcrumb |

### Medium
| # | Проблема | Где | Исправление |
|---|---|---|---|
| M1 | `api/order.ts` делает `upsert` по клиентскому `orderId` → перезапись чужого заказа | `api/order.ts:56-58,76` | id на сервере, `insert` |
| M2 | Нет CSP / HSTS | `vercel.json:4-12` | Добавить |
| M3 | Токен Telegram может жить в localStorage и использоваться из браузера; заказы с ПДн в localStorage | `src/lib/telegram.ts:76-86`; `StoreContext.tsx:615-645` | Только сервер |
| M4 | `purchase` для карты отправляется до оплаты; телефон в `user_data` открытым текстом; нет gclid/UTM | `StoreContext.tsx:1027`; `analytics.ts:110-111` | purchase после webhook, только хэш, сохранять gclid/UTM в заказ |
| M5 | Нет `view_item_list`, `add_payment_info`; дедуп purchase только в sessionStorage | `analytics.ts:322` | Добавить, дедуп по transaction_id на сервере |
| M6 | Фид без `additional_image_link`, `sale_price`, `gtin/identifier_exists`, `google_product_category`, `item_group_id`, `shipping`; варианты не разворачиваются | `src/lib/merchant-xml.ts` | Расширить |
| M7 | God-компоненты, контекст без мемоизации (30 `useState`, новый `value` каждый рендер) | `AdminControlHub.tsx`, `StoreContext.tsx:1041` | Разбить |
| M8 | Мёртвый код ~495 строк: `AdminDrawer`, `FaqSection`, `Hero`, `LiveSocialProof`, `SocialProofToast` (последние два — генераторы фейковых покупок) | `src/components/*` | Удалить |
| M9 | `api/`, `scripts/` вне typecheck; `@vercel/node` не в deps | `tsconfig.json:21` | Отдельный tsconfig |
| M10 | Шрифты: 3 семейства ~18 начертаний, render-blocking | `index.html:12` | 2 семейства, self-host cyrillic |
| M11 | LCP-баннер без width/height/srcset | `PromoBanner.tsx:37-43` | Размеры + AVIF/WebP |
| M12 | Контраст ниже AA (`#A77A06` 3.87:1 в 10px, neutral-400 2.52:1), 71× `outline-none` без `focus-visible` | `tailwind.config.js:13` | Токены AA, глобальный focus |
| M13 | Нова Пошта — статичный список городов | `NovaPoshtaPicker.tsx:3,101` | API НП |
| M14 | Трекинг заказа показывает чужой/демо-заказ, если номер не найден | `OrderTrackingModal.tsx:40-50` | «Не знайдено», серверный поиск |
| M15 | «Гарантія 14 днів» противоречит политике возврата (КМУ №172) | `index.html:13`, `ProductDetailModal.tsx:423` | Согласовать |
| M16 | Нет canonical, title не меняется, og:image — часы с Unsplash | `index.html:8,22` | По роутам |

### Low
Host-header в фиде (`api/feed.ts:14-18`); JSON-LD без экранирования `<` (`FaqSection.tsx:70`); in-memory rate limit (`api/order.ts:5-20`); storage bucket открыт anon (`supabase_schema.sql:101-111`); `jiti` не объявлен; `base: './'` (`vite.config.ts:5`); дубли токенов `brand-600..900 = #000`; кнопки 32 px и шрифт 9–10 px (`ProductCard.tsx`); `.skills/` — 3 общих файла без конкретики; `scratch/`, неиспользуемый `birthday-deals.png`; `imported_feed.csv` только для теста; нет XLSX-импорта; нет писем клиенту, ЛК.

## 4. E-commerce: что есть

| Функция | Статус |
|---|---|
| Каталог, фильтры, сортировка, поиск | есть (клиентские) |
| Варианты | есть, без остатка на вариант |
| Корзина, wishlist | есть (localStorage) |
| Чекаут | есть |
| Нова Пошта | мок |
| Monobank | есть, небезопасно (B2, H1, H6) |
| Заказы | Telegram + Sheets + Supabase + IndexedDB outbox |
| Трекинг | мок |
| Письма, ЛК | нет |
| Импорт CSV / XLSX | CSV есть / XLSX нет |

## 5. Google Ads readiness

| Требование | Статус |
|---|---|
| Crawlable URL товаров | ❌ |
| Юр. страницы по URL + реквизиты | ❌ |
| Фид из реальных данных, совпадающий с карточкой | ❌ |
| JSON-LD Product/Offer на странице | ❌ (только в модалке) |
| GA4 + Ads tag | ⚠️ gtag из env, GTM не грузится |
| События ecommerce | ⚠️ нет view_item_list, add_payment_info |
| Consent Mode v2 + баннер | ❌ |
| Enhanced Conversions | ⚠️ телефон открытым текстом |
| gclid / UTM | ❌ |
| Merchant API | не используется (фид по URL — норм). Content API for Shopping выведен 18.08.2026, 410 с 01.09.2026 → любые API-интеграции только через Merchant API v1 |
| Отсутствие misrepresentation | ❌ фейковые рейтинги/отзывы, чужие фото |

## 6. Топ-10 рисков

1. Утечка ПДн всех покупателей и порча каталога через anon RLS (B1).
2. Подделка оплаты через webhook (B2) и оплата заказа за 1 ₴ (H1).
3. Merchant Center отклонит / заблокирует за misrepresentation: фейковые рейтинги и отзывы, нет реквизитов (B6, B7, H9).
4. Нет индексации: SPA без URL (B3, B5).
5. Фид не совпадает с сайтом → disapprove всех товаров (B4).
6. Контрафакт / права на изображения люкс-брендов (H8).
7. Админка открыта (H2, H4).
8. Нарушение GDPR / ЗУ «Про захист ПД»: consent `granted` без баннера (H7).
9. CI красный — деплой невоспроизводим (B8, H12).
10. Медленный мобильный LCP: 210 KB gz JS + render-blocking шрифты (H10, M10).

## 7. Инструменты Claude (состояние)

- Плагины claude.ai: 0. Локальных плагинов: 0 (только данные `memory-bank-inline`).
- Скиллы аккаунта claude.ai: `1688-finder`, `1688-to-shopify`, `shopify-parser`, `eion-listing` (относятся к другим проектам), плюс системные (docs, xlsx, pdf…). В контекст попадают только описания (≈50–100 токенов каждое).
- В репо `.skills/` (3 файла, ~4.7 KB) — формат Gemini/Antigravity, Claude Code их не читает; общие декларации без пользы.
- Установлен проектный скилл `.claude/skills/ui-ux-pro-max` (v2.13.0, MIT, ~135k★; только основной скилл, без banner/slides/brand; скрипты — локальный поиск по CSV, без сети). Smoke-test пройден.
