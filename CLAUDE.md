# CLAUDE.md

Este archivo brinda orientación a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

@AGENTS.md

## Qué es esto

DIPEMSA es un sitio de e-commerce para una distribuidora de materiales de construcción (herramientas, marcas, categorías). Next.js (App Router) + React 19 + TypeScript, PostgreSQL (Railway) vía Drizzle ORM, Zustand para el estado del cliente, Mercado Pago para pagos. Desplegado en Railway.

**Antes de escribir código**, lee la guía correspondiente en `node_modules/next/dist/docs/01-app/` — este proyecto fija una versión de Next.js cuyas APIs/convenciones pueden diferir de tus datos de entrenamiento. Respeta los avisos de deprecación.

## Comandos

```bash
npm run dev            # levantar servidor de desarrollo
npm run build           # build de producción
npm run start           # ejecutar el build de producción
npm run lint             # eslint
npm run db:studio      # drizzle-kit studio (explorar la BD)
npm run import:csv     # importación masiva de productos desde CSV (scripts/import-csv.ts)
```

No hay script de tests configurado en `package.json` — `jest`, `@testing-library/*` y `playwright` están instalados como devDependencies pero no existen `jest.config.*`/`playwright.config.*` ni archivos de test todavía. Si te piden agregar tests, primero hay que configurar el runner.

Las migraciones de Drizzle viven en `drizzle/`; el esquema fuente está en `src/shared/db/schema/`. La configuración es `drizzle.config.ts` (`dialect: postgresql`, lee `DATABASE_URL`). Usa `drizzle-kit` directamente (ej. `npx drizzle-kit generate`) para generar migraciones — no hay script de npm para eso.

**Cuidado al aplicar migraciones**: la tabla de tracking `drizzle.__drizzle_migrations` está vacía en la BD de Railway aunque el schema ya tiene columnas de migraciones anteriores aplicadas — la BD se gestionó históricamente con `drizzle-kit push`, no con `migrate`, así que `npx drizzle-kit migrate` falla (intenta reproducir el historial completo desde cero). Además la BD todavía tiene una tabla legada `productos` (sin guion bajo, distinta de `productos_`) con datos reales que `drizzle-kit push` intenta borrar automáticamente al ver que ya no está en el schema — **nunca corras `drizzle-kit push` sin revisar el diff/prompt de confirmación primero**. Para cambios aditivos simples (agregar una columna nullable), aplicar el `ALTER TABLE` a mano contra `DATABASE_URL` es más seguro que `migrate`/`push`.

## Variables de entorno

Requeridas en `.env` (ver `.env` para la lista completa, no está commiteado): `DATABASE_URL`, `NEXT_PUBLIC_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`, `RESEND_API_KEY`, `EMAIL_USER`, `EMAIL_APP_PASSWORD`/`EMAIL_PASSWORD`, `NEXT_PUBLIC_GTM_ID`.

## Arquitectura

**Grupos de rutas** bajo `app/`:
- `(public)/` — la tienda: home, `categoria/[slug]`, `marca/[slug]`, `producto/[id]/[slug]`, `productos`, `carrito-de-compra`, `compra/pago-{exitoso,fallido,pendiente}`, páginas estáticas (`contacto`, `soy-mayorista`, `aviso-de-privacidad`, `terminos-y-condiciones`). Su `layout.tsx` envuelve el contenido con `GoogleTagManager`, `Header`, `Footer`.
- `(admin)/productos/relacionados/` — una herramienta interna mínima para gestionar asociaciones de productos relacionados; tiene su propio layout, sin el chrome compartido.
- `app/api/` — route handlers: `mercadopago/{preference,process-payment}`, `admin/productos[/[id]/relacionados]`, `search`, `send-email`.
- `app/sitemap.ts`, `app/feed.xml/route.ts`, `app/products.xml/route.ts` son feeds generados a partir del catálogo de productos.

**Capa de datos** (`src/shared/db/`):
- `index.ts` crea un único `pg.Pool` a nivel de módulo → `drizzle(pool)`. Reutiliza el `db` exportado; no crees pools/clientes nuevos por request.
- `schema/productList.ts` define la única tabla central, `productos_` (nombre de tabla en Drizzle: `productos`). Nota que muchos campos "numéricos" (`precio`, `precioant`) se guardan como `varchar` — el cálculo de precios en otras partes hace `parseFloat`/quita `$,` antes de usarlos (ver `cartStore.subTotal`). `related_products` es un arreglo de strings `jsonb`. `ficha` (`varchar(100)`, nullable) guarda la URL pública de Google Drive de la ficha técnica en PDF de un producto; `ProductCard.tsx` solo muestra el enlace "VER FICHA TÉCNICA" cuando el campo no está vacío.
- `queries.ts`, `productos.ts`, `marcas.ts`, `resultados.ts`, `contact-info.ts` contienen funciones de consulta escritas a mano (no hay capa de repositorio/servicio — los componentes y las rutas llaman a estas funciones directamente).
- Los productos no tienen una tabla de variantes normalizada: las variantes están codificadas en `descripcion` como `"Nombre base | variante"`, y la lógica de agrupación (`getProductsByGroupsofTrademarks`, `getProductsByGroupsofCategories`) separa por `|` y agrupa por el nombre base en el código de la aplicación. Preserva esta convención al tocar datos de productos — no asumas que una fila equivale a un producto.
- Los slugs de categoría/marca se mapean a sus valores reales en BD (con acentos/espacios) mediante diccionarios mantenidos a mano (`slugToMarca`, `slugToCategory` en `queries.ts`), con un fallback genérico de reversión de slug. Las marcas/categorías nuevas con formato especial necesitan una entrada ahí.

**Estado**: `src/store/cartStore.ts` (Zustand + `persist` en localStorage, clave `dipemsa-cart`) maneja los items del carrito, cantidades y totales derivados (`subTotal`, `shippingCost` — envío gratis ≥ $5000, si no $300, `totalPrice`). `src/store/deliveryStore.ts` maneja la info de entrega/checkout. Los componentes cliente leen estos stores directamente en vez de pasar props en cascada.

**Pagos**: el flujo de Mercado Pago es `MercadoPagoBrick`/`MercadoPagoButton` (cliente) → `POST /api/mercadopago/preference` (arma una `Preference` en el servidor, inyecta `back_urls` desde `NEXT_PUBLIC_URL`, moneda MXN, URLs de imágenes de producto desde `https://www.dipemsa.com.mx/fotos/webp/{id}.webp`) → redirección a Mercado Pago → retorno a alguna de las páginas `compra/pago-*`. `process-payment/route.ts` maneja el lado de confirmación del pago.

**Componentes** viven bajo `src/shared/components/`, agrupados por funcionalidad (`cart/`, `header/`, `footer/`, `dashboard/` para la herramienta de admin). Los componentes de listado renderizados en el servidor están separados de su wrapper de obtención de datos mediante el sufijo `...Server` (ej. `ProductCardsServer.tsx`, `RecommendedProductsServer.tsx` obtienen los datos y los pasan a los componentes presentacionales `ProductCard`/`RecommendedProducts`).

**Alias de rutas**: `@/*` apunta a la raíz del repo (no a `src/`) — los imports se ven como `@/src/shared/db`, `@/src/shared/components/...`.

**Imágenes**: `next.config.ts` permite todos los hosts remotos (`hostname: '**'`) y genera avif/webp; las fotos de producto también se sirven localmente desde `public/fotos/`. Precios/slugs usan `src/utils/slugify.ts` (quita acentos, pipes, comas — separa por `|`/`,` antes de generar el slug, así que solo convierte en slug el nombre base del producto) y `src/utils/formatPrice.ts`.

**Datos de respaldo/scratch**: `src/respaldo/` contiene exports históricos CSV/SQL (catálogos de productos antiguos) — solo de referencia, no son rutas de código activas.
