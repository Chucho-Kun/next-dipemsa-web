# AGENTS.md — dipemsa-web

DIPEMSA e-commerce (tools distributor). Next.js 16 App Router + React 19 + TS, PostgreSQL (Railway) via Drizzle ORM, Zustand client state, Mercado Pago payments. Deployed on Railway. Before writing Next.js code, check `node_modules/next/dist/docs/01-app/` — pinned Next version may differ from training data.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build (typecheck only — `next lint` was removed in Next 16, it does NOT run ESLint)
npm run start          # run production build
npm run lint           # eslint (bare `eslint`, no args)
npm run db:studio      # drizzle-kit studio
npm run import:csv     # bulk product import from CSV (scripts/import-csv.ts)
npx drizzle-kit generate  # generate migrations (no npm script for this)
```

- Node ≥ 20.9 required (use `nvm use 22` if default node is older; old node makes `next build` exit 0 silently and `eslint` fail with `structuredClone is not defined`).
- No test runner configured: `jest`/`playwright`/`@testing-library/*` are installed but there are no `jest.config.*`/`playwright.config.*` or test files, and no `test` script. Configure a runner before adding tests.
- No CI workflows, no `opencode.json`.

## Env

Required in `.env` (not committed): `DATABASE_URL`, `NEXT_PUBLIC_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`, `RESEND_API_KEY`, `EMAIL_USER`, `EMAIL_APP_PASSWORD` (legacy `EMAIL_PASSWORD` also present), `NEXT_PUBLIC_GTM_ID`.

## Architecture

- `app/(public)/` — storefront (home, `categoria/[slug]`, `marca/[slug]`, `producto/[id]/[slug]`, `productos`, `carrito-de-compra`, `compra/pago-{exitoso,fallido,pendiente}`, static pages). Its `layout.tsx` wraps `GoogleTagManager` + `Header` + `Footer`.
- `app/(admin)/productos/relacionados/` — minimal internal tool for related-product links, own layout, no store chrome.
- `app/api/` — route handlers: `mercadopago/{preference,process-payment}`, `admin/productos[/[id]/relacionados]`, `search`, `send-email`. `app/sitemap.ts`, `app/feed.xml/route.ts`, `app/products.xml/route.ts` are catalog-generated feeds.
- Data layer `src/shared/db/`: reuse the module-level `db` export in `index.ts` (single `pg.Pool` → `drizzle(pool)`); never create pools per request. Hand-written queries in `queries.ts`, `productos.ts`, `marcas.ts`, `resultados.ts`, `contact-info.ts` — no repository layer, components/routes call them directly.
- Central table is `productos_` (Drizzle name `productos`, schema `src/shared/db/schema/productList.ts`). `precio`/`precioant` are `varchar` (e.g. `"$1234.56"`), not numeric — parse with `parsePrecio` before math. `related_products` is `jsonb` string array. `ficha` (nullable varchar) holds a Google Drive PDF URL; `ProductCard` only shows "VER FICHA TÉCNICA" when non-empty.
- Product variants are NOT normalized: encoded in `descripcion` as `"Base name | variant"`, grouped by base name in app code (`getProductsByGroupsofTrademarks/Categories`). Never assume 1 row = 1 product.
- Category/brand slugs map to real DB values (accents/spaces) via hand-kept dicts `slugToMarca`/`slugToCategory` in `queries.ts` + generic fallback. New brands/categories with special formatting need an entry there.
- `@/*` maps to repo root (not `src/`): imports look like `@/src/shared/db`.
- Components in `src/shared/components/` grouped by feature (`cart/`, `header/`, `footer/`, `dashboard/` for admin). Server-fetch wrappers use `...Server` suffix (`ProductCardsServer.tsx` fetches, `ProductCard` presents).
- `src/respaldo/` is historical CSV/SQL reference only, not active code.

## Gotchas

- **DB migrations are dangerous here**: history was managed with `drizzle-kit push`, so `drizzle.__drizzle_migrations` is empty and `npx drizzle-kit migrate` fails (replays history from scratch). The DB also holds a legacy `productos` table (no underscore, real data) absent from the schema, which `drizzle-kit push` tries to drop — **never run `push` without reviewing its confirm prompt**. For simple additive changes (nullable column), run `ALTER TABLE` manually against `DATABASE_URL`. Same applies to `ordenes` table (created by hand, see below).
- **Discounts** (`src/config/descuentos.ts`, SPEC 07): percentage rules per brand/category applied **once in the data layer** (`src/utils/aplicarDescuento.ts` → `aplicarDescuento/Lista`, max matching rule wins, never stacked, exact match after trim/NFD/lowercase). Queries return `precio` already discounted, `precioant` = list price. Discount config change = commit + Railway redeploy (no admin UI, not in DB/env). **After any rule change, bump `version` in `src/store/cartStore.ts`** — cart persists prices in localStorage (`dipemsa-cart`) and a version bump empties stale carts; otherwise old carts charge the pre-discount price.
- **Prices**: stored as `varchar`, transported untouched; format only for display via `src/utils/formatPrice.ts` (`parsePrecio` / `formatMoney` / `formatPrecio` / `totalxcantidad`). Never hand-roll `.toFixed(2)` or render the raw DB string to users (prepend `$` in JSX; `formatMoney` omits it).
- **Cart/store**: `src/store/cartStore.ts` (persisted, free shipping ≥ $5000 else $300) + `src/store/deliveryStore.ts`. Client components read stores directly, no prop drilling.
- **Payments**: client brick (`MercadoPagoBrick`/`MercadoPagoButton`) → `POST /api/mercadopago/preference` (server builds `Preference`, MXN, `back_urls` from `NEXT_PUBLIC_URL`, images from `https://www.dipemsa.com.mx/fotos/webp/{id}.webp`) → Mercado Pago → `compra/pago-*` pages. `process-payment/route.ts` calls `payment.create()` and logs the attempt to `ordenes` via `registrarOrden()` (never throws — swallows DB errors to protect buyer response; amounts are `numeric` = strings on read, use `parsePrecio`/`formatMoney`). Confirmation email (`send-email/route.ts`, client fire-and-forget) is independent of `ordenes`.
- **Images**: `next.config.ts` allows all remote hosts; product photos also served locally from `public/fotos/` with long `Cache-Control`.
