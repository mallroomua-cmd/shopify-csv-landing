# MALLROOM — магазин косметики (Украина)

## Стек
Next.js 16.4 (App Router, `cacheComponents` + `partialPrefetching`), React 19, TypeScript strict, Tailwind 4, Supabase (Postgres + Auth + Storage), Vercel. Валюта UAH, язык uk.
ВАЖНО: Next 16 отличается от старых версий — перед кодом читать `node_modules/next/dist/docs/` (см. AGENTS.md).

## Команды
`npm run dev` · `npm run typecheck` · `npm run lint` · `npm run build`. CI: `.github/workflows/ci.yml` (то же самое).

## Архитектура
- `src/lib/catalog.ts` — единственный источник каталога (`'use cache'`, тег `products`). Сброс: `POST /api/revalidate` (только админ).
- `src/lib/seo.ts` — фид Merchant Center и JSON-LD строятся ОДНОЙ функцией `offerFor` → цена/наличие всегда совпадают со страницей.
- `src/app/api/order` — заказ: zod-валидация, цены пересчитываются из БД (клиентским не доверять), insert через service role, уведомление в Telegram.
- `src/app/admin` — Supabase Auth; права = строка в `public.admins`; RLS в `supabase/migrations/001_secure_schema.sql`.
- `src/lib/analytics.ts` — dataLayer (GTM), Consent Mode v2 default denied, purchase дедуп по transaction_id, gclid/UTM → заказ.
- `src/lib/config.ts` — название магазина и реквизиты продавца (из env).
- Дизайн-токены: `src/app/globals.css` (`@theme`). Только они, без raw hex в компонентах. Контраст ≥ 4.5:1, тач ≥ 44px.

## Правила
- Никаких фейковых отзывов, рейтингов, счётчиков «купили», «в наличии» без данных — риск бана в Merchant Center.
- Секреты только в env. `SUPABASE_SERVICE_ROLE_KEY` — только сервер. Не редактировать `.env`.
- URL товара `/p/[handle]`, категории `/catalog/[slug]`; handle не менять после публикации.
- `legacy-vite/` — старое приложение, не трогать (к удалению).
- Content API for Shopping выведен (08.2026) — только Merchant API v1 или фид по URL.
- Скилл дизайна: `.claude/skills/ui-ux-pro-max` (`python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux`).
