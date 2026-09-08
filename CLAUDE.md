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

**Versión de Node**: Next.js 16 requiere Node ≥ 20.9. Si el `node` por defecto del entorno es más viejo, `next build` sale con exit 0 sin construir nada y `eslint` revienta con `structuredClone is not defined` — usar `nvm use 22` (o equivalente) antes de correr `lint`/`build`. En Next 16 `next lint` fue removido: `next build` **ya no corre ESLint**, solo el chequeo de tipos de TypeScript.

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
- `queries.ts`, `productos.ts`, `marcas.ts`, `resultados.ts`, `contact-info.ts` contienen funciones de consulta escritas a mano (no hay capa de repositorio/servicio — los componentes y las rutas llaman a estas funciones directamente). Casi todas las funciones de `queries.ts` que devuelven productos pasan el resultado por `aplicarDescuento`/`aplicarDescuentoLista` antes de retornarlo (ver "Descuentos por marca y categoría" abajo) — el descuento se aplica en la capa de datos, no en los componentes.
- `schema/ordenes.ts` define la tabla `ordenes` (registro de intentos de pago de Mercado Pago, ver SPEC 06). Los montos (`subtotal`, `envio`, `total`) son `numeric` (Drizzle los expone como `string` al leer; pasar por `parsePrecio`/`formatMoney` para mostrarlos), a diferencia de `precio`/`precioant` de `productos_` que son `varchar` por historia del catálogo. `items` es un `jsonb` con un arreglo de `OrdenItem` (snapshot de lo vendido, sin FK a `productos_`). `ordenes.ts` (junto a la carpeta `schema/`) expone `registrarOrden()`, que hace el `INSERT` y **nunca lanza** — atrapa su propio error y lo loguea, para no afectar la respuesta al comprador si la BD falla. La tabla se creó a mano con `CREATE TABLE` contra `DATABASE_URL` (no vía `drizzle-kit push`/`migrate`, ver aviso de migraciones arriba); cualquier cambio futuro a sus columnas repite ese mismo camino (`ALTER TABLE` a mano + edición del schema).
- Los productos no tienen una tabla de variantes normalizada: las variantes están codificadas en `descripcion` como `"Nombre base | variante"`, y la lógica de agrupación (`getProductsByGroupsofTrademarks`, `getProductsByGroupsofCategories`) separa por `|` y agrupa por el nombre base en el código de la aplicación. Preserva esta convención al tocar datos de productos — no asumas que una fila equivale a un producto.
- Los slugs de categoría/marca se mapean a sus valores reales en BD (con acentos/espacios) mediante diccionarios mantenidos a mano (`slugToMarca`, `slugToCategory` en `queries.ts`), con un fallback genérico de reversión de slug. Las marcas/categorías nuevas con formato especial necesitan una entrada ahí.

**Estado**: `src/store/cartStore.ts` (Zustand + `persist` en localStorage, clave `dipemsa-cart`) maneja los items del carrito, cantidades y totales derivados (`subTotal`, `shippingCost` — envío gratis ≥ $5000, si no $300, `totalPrice`). El bloque `persist` tiene `version` + `migrate: () => ({ items: [] })`: el carrito congela el precio al agregar el producto y nunca lo recalcula, así que **hay que subir `version` cada vez que cambie una regla de descuento** (SPEC 07) o los carritos ya guardados cobrarían el precio viejo — al rehidratar con `version` distinta, `migrate` los vacía. `src/store/deliveryStore.ts` maneja la info de entrega/checkout. Los componentes cliente leen estos stores directamente en vez de pasar props en cascada.

**Pagos**: el flujo de Mercado Pago es `MercadoPagoBrick`/`MercadoPagoButton` (cliente) → `POST /api/mercadopago/preference` (arma una `Preference` en el servidor, inyecta `back_urls` desde `NEXT_PUBLIC_URL`, moneda MXN, URLs de imágenes de producto desde `https://www.dipemsa.com.mx/fotos/webp/{id}.webp`) → redirección a Mercado Pago → retorno a alguna de las páginas `compra/pago-*`. `process-payment/route.ts` maneja el lado de confirmación del pago: además de llamar a `payment.create()`, registra el intento (aprobado, `in_process` o rechazado) en la tabla `ordenes` vía `registrarOrden()` — ver SPEC 06 y la nota de `schema/ordenes.ts` arriba. `MercadoPagoBrick.tsx` manda `subtotal`/`shipping`/`total` (ya calculados por `cartStore`) en el body de ese `POST`, para no reimplementar la regla de envío gratis en el servidor. El correo de confirmación (`send-email/route.ts`, fire-and-forget desde el cliente) sigue siendo independiente de este registro — no se leen ni se escriben entre sí.

**Componentes** viven bajo `src/shared/components/`, agrupados por funcionalidad (`cart/`, `header/`, `footer/`, `dashboard/` para la herramienta de admin). Los componentes de listado renderizados en el servidor están separados de su wrapper de obtención de datos mediante el sufijo `...Server` (ej. `ProductCardsServer.tsx`, `RecommendedProductsServer.tsx` obtienen los datos y los pasan a los componentes presentacionales `ProductCard`/`RecommendedProducts`).

**Alias de rutas**: `@/*` apunta a la raíz del repo (no a `src/`) — los imports se ven como `@/src/shared/db`, `@/src/shared/components/...`.

**Imágenes**: `next.config.ts` permite todos los hosts remotos (`hostname: '**'`) y genera avif/webp; las fotos de producto también se sirven localmente desde `public/fotos/`. Precios/slugs usan `src/utils/slugify.ts` (quita acentos, pipes, comas — separa por `|`/`,` antes de generar el slug, así que solo convierte en slug el nombre base del producto) y `src/utils/formatPrice.ts`.

**Datos de respaldo/scratch**: `src/respaldo/` contiene exports históricos CSV/SQL (catálogos de productos antiguos) — solo de referencia, no son rutas de código activas.

## Formateo de precios

Los precios se guardan en BD como `varchar` (ej. `"$1234.56"`, sin coma de miles — ver nota en `schema/productList.ts` arriba) y así viajan sin tocar entre `cartStore`, componentes y payloads de API. `src/utils/formatPrice.ts` centraliza el parseo/formateo para mostrarlos en pantalla:

- `parsePrecio(precio: string): number` — limpia `$`/`,` y convierte a número (0 si no es válido).
- `formatMoney(valor: number): string` — formatea un número con `toLocaleString('es-MX', ...)`, agregando coma de miles solo cuando el valor es ≥ 1000 (comportamiento nativo de `toLocaleString`) y siempre 2 decimales.
- `formatPrecio(precio: string): string` — atajo `formatMoney(parsePrecio(precio))` para precios guardados como string (el `$` no se incluye, hay que anteponerlo en el JSX/HTML).
- `totalxcantidad(precio: string, cantidad: number): string` — `formatMoney(parsePrecio(precio) * cantidad)`, usado para el precio total de una línea (precio unitario × cantidad).

**Regla**: nunca formatear con `.toFixed(2)` a mano ni concatenar el string de precio crudo en JSX/HTML para mostrarlo al usuario — siempre pasar por `formatMoney`/`formatPrecio`/`totalxcantidad`. Esto solo afecta el string mostrado; el valor numérico/string que se transporta entre componentes, el store y las APIs no se toca.

Puntos donde ya se aplica: precio y precio anterior en `ProductCard.tsx`, precio unitario y total de línea en `cart/ProductComponent.tsx`, subtotal/envío/total en `cart/ResumenCompra.tsx`, y subtotal/envío/precio unitario/monto a pagar en el HTML del correo de confirmación (`app/api/send-email/route.ts`). Si se agregan nuevos lugares que muestren un precio, aplicar el mismo criterio.

## Descuentos por marca y categoría

Descuento porcentual configurable por marca o por categoría (SPEC 07). **Se aplica una sola vez, en la capa de datos**: las consultas devuelven `precio` ya descontado y `precioant` con el precio de lista, así toda la cadena (fichas, buscador, carrito, Mercado Pago, correo, `ordenes`, GA4, feeds XML) hereda el precio nuevo sin tocar ningún componente, y el tachado + badge "PROMOCIÓN" salen solos por la lógica que ya existía para `precioant`.

- **Configuración**: `src/config/descuentos.ts` — arreglo `reglasDescuento: ReglaDescuento[]`, cada regla `{ tipo: 'marca' | 'categoria', valor, porcentaje, activo }`. Vive en el repo, no en BD ni en env vars: cambiar un porcentaje o activar/desactivar una regla es un commit + deploy en Railway. No hay pantalla de administración.
- **Helper**: `src/utils/aplicarDescuento.ts` — `porcentajeDescuento(marca, categoria)` devuelve el **mayor** porcentaje de entre las reglas activas que coinciden (nunca se acumulan marca + categoría); `aplicarDescuento(producto)` devuelve una copia con `precio` descontado y `precioant` pisado con el precio de lista; `aplicarDescuentoLista` mapea sobre un arreglo. Coincidencia **exacta tras normalizar** (`trim` + NFD sin diacríticos + `toLowerCase`) — `"Panel"` no alcanza a `"Cempanel"`, pero `"cempanel "` con espacio sobrante sí (la BD tiene filas así, ver SPEC 05). Fórmula: `Math.round(parsePrecio(precio) * (100 - porcentaje)) / 100`, re-emitida como `'$' + formatMoney(nuevo)`. Reglas ignoradas: `activo: false`, `porcentaje <= 0` o `>= 100`. Producto intacto si ninguna regla aplica o si `parsePrecio(precio)` es 0.
- **Dónde se aplica**: `queries.ts` (`getProductsByGroupsofTrademarks`/`...Categories` — sobre `rawProducts` antes de agrupar por nombre base —, `getProductById`, `getRecomendedProducts`, `getAllProductosXML`, `getRelatedProducts`, `getProductVariants`), `app/api/search/route.ts` y `app/api/admin/productos/route.ts`. `getProductVariants` proyecta `marca`/`categoria`/`precioant` (además de lo básico) para poder evaluar la regla; `VariantOptionType` (`resultados.ts`) los incluye.
- **Al cambiar una regla**: subir `version` en `cartStore.ts` (ver "Estado" arriba). El store `recentProductsStore` (`dipemsa-recent-products`) **no** está versionado — es solo display en el carrusel de vistos recientemente, nunca se cobra desde ahí, y se autocorrige tras unas visitas.
- **Fuera de alcance** (SPEC 07): pantalla de admin, reglas en BD, vigencia por fechas, línea "Descuento" desglosada en `ResumenCompra`/correo/`ordenes`, descuentos por producto/clave/volumen/cupón, y validar el `transaction_amount` del cliente contra la BD en `process-payment` (hueco preexistente).
