# SPEC 08 — SEO técnico y visibilidad en buscadores de IA

> **Estado:** Borrador
> **Depende de:** —
> **Fecha:** 2026-09-15
> **Objetivo:** Corregir los errores de datos estructurados y metadata que hoy perjudican la indexación, y dotar a la home, categorías y marcas de prosa y schema citables para que los buscadores generativos (ChatGPT, Perplexity, Gemini, AI Overviews) encuentren y referencien a Dipemsa.

## Por qué existe este spec

Se auditó `https://www.dipemsa.com.mx/` sobre el HTML crudo servido en producción (sin ejecutar JavaScript — exactamente lo que ven GPTBot, ClaudeBot y PerplexityBot) y se cruzó con el código del repo. El objetivo del cliente es aparecer citado en respuestas de buscadores de IA, no solo rankear en Google clásico.

La base técnica es mejor de lo esperado y no se toca en este spec: todo el contenido es SSR real (la parrilla de categoría, el precio y la descripción larga llegan en el HTML inicial sin esperar hidratación), el TTFB es ~0.18s, y ningún crawler de IA está bloqueado — se verificó con `curl -A "<user-agent>"` que GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot y meta-externalagent reciben 200 con el mismo HTML que Googlebot.

Lo que falta es de dos tipos:

1. **Errores que activamente perjudican.** El JSON-LD de `Product` en la ficha de cada uno de los ~440 productos declara `aggregateRating: 4.8` con `reviewCount: 23` y una `review` firmada por "Jesus Peralta" — datos inventados, hardcodeados en el propio código (`app/(public)/producto/[id]/[slug]/page.tsx:130-152`), no leídos de ninguna tabla. Es structured data spam según la política de Google y el riesgo de una acción manual es sobre todo el dominio, no solo esa página. La misma ficha emite `image: https://www.dipemsa.com.mx/webp/{id}.webp` (línea 123), una ruta que da 404 — la ruta real, usada en el feed y en Open Graph, es `/fotos/webp/{id}.webp` (verificado con `curl`). Además existen dos archivos `robots.txt` (`app/robots.txt` y `app/(public)/robots.txt`) compitiendo por la misma URL con contenido ligeramente distinto, y `app/layout.tsx` no declara `metadataBase`, así que 6 páginas (`/productos`, `/marcas`, `/contacto`, `/soy-mayorista`, `/carrito-de-compra`, y el home) emiten `canonical` relativo en vez de absoluto.
2. **Ausencia de material citable.** Un LLM generativo cita pasajes autocontenidos de 50-150 palabras que responden una pregunta concreta ("¿qué es X", "¿dónde comprar Y"). Hoy no existe ninguno en el sitio: la home no tiene `<h1>`; las 28 páginas de categoría y marca (`CategoryResults.tsx:30`, `TrademarckResults.tsx:26`) son catálogo puro — de las ~584 palabras visibles en una página de categoría, ~500 son header, footer y el carrusel "LO MÁS VENDIDO" repetido en cada página del sitio; no existe ningún `FAQPage` en el sitio, que es el schema del que más extraen ChatGPT y Perplexity; y el `Organization` de la home no está modelado como negocio local (`LocalBusiness`/`Store`) pese a tener dos sucursales físicas con dirección y horario, lo que reduce su elegibilidad en búsquedas locales ("distribuidora de tablaroca en Ecatepec").

## Alcance

**Dentro:**

- `app/layout.tsx`: agregar `metadataBase`, `alternates.canonical`, `robots`, `icons`.
- Un solo `robots.txt` (eliminar el duplicado de `app/(public)/`), con los sitemaps correctos y bloques `Allow` explícitos para crawlers de IA.
- `src/config/envio.ts`: constantes de envío compartidas entre `cartStore.ts`, el JSON-LD de producto y `feed.xml`.
- JSON-LD de producto (`producto/[id]/[slug]/page.tsx`): eliminar reseñas falsas, corregir la imagen, corregir el `BreadcrumbList`, agregar `mpn`/`category`/`itemCondition`/ficha técnica, envío real.
- Home: `<h1>` + párrafo de prosa nuevo, `Organization` → `Store` + `LocalBusiness` por sucursal, `WebSite` + `SearchAction`.
- `src/config/contenidoSeo.ts`: intros de ~120 palabras y FAQs para las 14 categorías y 14 marcas, redactadas en este mismo trabajo.
- Categoría y marca: `<h1>`, intro, sección de FAQ visible, JSON-LD (`BreadcrumbList` + `ItemList` + `FAQPage`), breadcrumb visual semántico.
- Breadcrumb de producto: pasar de `<nav><span>` a `<nav aria-label><ol><li>`.
- Metadata propia para `aviso-de-privacidad` y `terminos-y-condiciones`; `noindex` para `/carrito-de-compra` y `/compra/pago-*`; resolver `/resultados/[slug]` (hoy 200 con fragmento vacío).
- `app/sitemap.ts`: quitar la entrada de imagen, agregar las páginas legales, diferenciar prioridades.
- `app/llms.txt/route.ts` nuevo, generado dinámicamente desde la base de datos.
- Corregir los tres `alt` incorrectos/hardcodeados detectados en la auditoría.

**Fuera de alcance (para specs futuros):**

- Reseñas reales: tabla `resenas`, formulario de captura, moderación. Este spec solo elimina las falsas.
- Conectar la columna `existencias` a `availability`/`g:availability`. Hoy no hay confianza en que ese dato esté al día en la base; conectarlo sin verificarlo antes anunciaría como agotado un producto disponible (o viceversa). Se deja fijo en `InStock`, que es el estado actual.
- Blog o centro de contenidos editorial más allá de las intros de categoría/marca.
- Internacionalización / `hreflang` (el sitio es monolingüe `es-MX`).
- Core Web Vitals, optimización de imágenes más allá de lo que ya hace `next/image`, y headers de seguridad (HSTS, CSP, etc.).
- Autenticación del grupo `app/(admin)/` — su `robots: { index: false }` ya existe y es suficiente para este spec.
- Limpiar el dato `"$$38.00"` (doble signo de peso) visible en un producto de ejemplo durante la auditoría — es un problema de datos en la tabla `productos_`, no de código.
- Migrar `app/robots.txt` (archivo estático) a un `robots.ts` generado — se mantiene como archivo estático, solo se elimina el duplicado.
- La duplicación de contenido entre `/` y `/marcas` (la home importa y renderiza `MarcasPage` completo, `app/(public)/page.tsx:5,171`) — cambiarla afecta el diseño de la home más allá del SEO y merece su propia conversación.
- Señales fuera del sitio: Google Business Profile, directorios, backlinks.
- Archivos `.DS_Store` versionados en el repo — no es un problema de SEO.

## Modelo de datos

Este spec no modifica el schema de la base de datos (`productos_` no cambia). Introduce dos archivos de configuración nuevos, siguiendo el patrón ya usado por `src/config/descuentos.ts` (SPEC 07): constantes en el repo, sin tabla ni pantalla de administración.

### `src/config/envio.ts`

```ts
export const ENVIO_GRATIS_DESDE = 5000; // MXN. Envío gratis en compras >= este monto.
export const COSTO_ENVIO = 300;         // MXN. Costo fijo por debajo del umbral.
```

Reemplaza los literales `5000` y `300` hoy hardcodeados en `cartStore.ts:92` (`return subtotal >= 5000 ? 0 : 300;`). Se importa también en el JSON-LD de producto y en `feed.xml` para que las tres superficies (carrito, structured data, Google Merchant Feed) declaren la misma regla. Cambiar el monto de envío gratis en el futuro es editar un archivo, igual que un cambio de descuento.

### `src/config/contenidoSeo.ts`

```ts
export type FaqItem = {
  pregunta: string;
  respuesta: string;
};

export type ContenidoSeo = {
  slug: string;       // debe coincidir con el slug ya usado en sitemap.ts / slugToCategory / slugToMarca
  h1: string;          // título de la página, distinto del <title> de metadata
  intro: string;       // ~120 palabras de prosa citable, un solo párrafo
  faqs: FaqItem[];     // 2-3 preguntas frecuentes
};

export const contenidoCategorias: ContenidoSeo[] = [ /* 14 entradas */ ];
export const contenidoMarcas: ContenidoSeo[] = [ /* 14 entradas */ ];

export function contenidoDeCategoria(slug: string): ContenidoSeo | undefined {
  return contenidoCategorias.find((c) => c.slug === slug);
}

export function contenidoDeMarca(slug: string): ContenidoSeo | undefined {
  return contenidoMarcas.find((c) => c.slug === slug);
}
```

Los 14 slugs de categoría son los ya usados en `app/sitemap.ts` (`tablaroca-y-durock`, `perfiles-galvanizados`, `compuestos-y-cintas`, `glasliner`, `plafones-y-suspension`, `cempanel`, `sellado`, `sistemas-de-fijacion-directa`, `anclajes-quimicos-y-epoxicos`, `tornilleria`, `aislantes`, `perfiles-plasticos`, `adhesivos-y-nivelantes`, `herramientas`). Los 14 de marca son los de `src/shared/db/marcas.ts` (`armstrong`, `cempanel`, `dipemsa`, `fischer`, `glasliner`, `gram-bel`, `gyproc`, `mapei`, `owens-corning`, `panel-rey`, `pennsylvania`, `trim-tex`, `truper`, `usg`).

**Tolerancia a datos faltantes:** si un slug nuevo no tiene entrada en el config (por ejemplo, una categoría agregada después de este spec), `contenidoDeCategoria`/`contenidoDeMarca` devuelven `undefined` y el componente que las consume omite la sección de intro/FAQ sin romper la página — la parrilla de productos sigue funcionando igual que hoy. No se agrega validación de build que obligue a tener las 14+14 entradas completas.

**Redacción:** las 28 intros + FAQs se escriben durante la implementación de este spec, a partir de la información real del catálogo (marca, categoría, productos típicos, medidas) — no son contenido de ejemplo a rellenar después. El cliente las revisa y corrige donde una afirmación comercial no sea exacta.

## Plan de implementación

1. **Metadata global y `metadataBase`.**
   En `app/layout.tsx`, ampliar el `export const metadata` (líneas 17-20) con `metadataBase: new URL('https://www.dipemsa.com.mx')`, `alternates: { canonical: '/' }`, `robots: { index: true, follow: true }` e `icons` (usando `favicon.ico` ya existente). Quitar el import no usado de `Script` (línea 5).
   *Verificación:* `curl -sL https://www.dipemsa.com.mx/productos | grep canonical` muestra una URL absoluta; antes mostraba `/productos`. `npm run build` pasa.

2. **Unificar `robots.txt`.**
   Eliminar `app/(public)/robots.txt` (duplicado). En `app/robots.txt`: agregar `Sitemap: https://www.dipemsa.com.mx/feed.xml` (falta hoy); quitar `Disallow: /admin/`, `/dashboard/`, `/checkout/`, `/cart/success` (rutas que no existen en el proyecto); agregar `Disallow: /productos/relacionados` (la ruta admin real) y `Disallow: /resultados/`; agregar bloques `User-agent: GPTBot` / `OAI-SearchBot` / `ChatGPT-User` / `ClaudeBot` / `Claude-User` / `PerplexityBot` / `Perplexity-User` / `Google-Extended` / `meta-externalagent` con `Allow: /`.
   *Verificación:* solo existe un `robots.txt` servido; `curl https://www.dipemsa.com.mx/robots.txt` lista los tres sitemaps y los crawlers de IA.

3. **Constante de envío compartida.**
   Crear `src/config/envio.ts` con `ENVIO_GRATIS_DESDE` y `COSTO_ENVIO`. Actualizar `cartStore.ts:92` para importarlas en vez de usar los literales `5000`/`300`.
   *Verificación:* el carrito sigue calculando envío gratis a partir de $5,000 exactamente igual que antes; `npm run lint` pasa.

4. **Corregir el JSON-LD de producto.**
   En `app/(public)/producto/[id]/[slug]/page.tsx`:
   - Eliminar el bloque `aggregateRating` (líneas 130-134) y el arreglo `review` (líneas 137-152) del objeto `Product`.
   - Corregir `image` de `https://www.dipemsa.com.mx/webp/${id}.webp` a `https://www.dipemsa.com.mx/fotos/webp/${id}.webp` (línea 123), igual que ya hace el `openGraph` de la misma página.
   - Cambiar `description` para usar `producto.informacion` (con fallback al `descripcion` actual) en vez del fragmento después del `|`.
   - Agregar `mpn: producto.clave`, `category: producto.categoria`.
   - Reemplazar `priceValidUntil: "2026-12-31"` (fijo) por una fecha calculada: un año desde hoy.
   - Envolver `shippingDetails.shippingRate` con `ENVIO_GRATIS_DESDE`/`COSTO_ENVIO` de `src/config/envio.ts`, agregando `freeShippingThreshold` cuando aplique.
   - Cuando `producto.ficha` no esté vacío, agregar `subjectOf: { "@type": "DigitalDocument", "name": "Ficha técnica", "url": producto.ficha }` al `Product`.
   - Corregir el `BreadcrumbList` (líneas 77-111): el `ListItem` de posición 2 debe usar el nombre real de la marca (`producto.marca`), no el literal `"Marca"`; el de posición 3 debe llamarse con el nombre real de la categoría (`producto.categoria`) y mantener su URL a `/categoria/{slug}` (hoy el nombre dice "Producto" mientras la URL ya es de categoría — se corrige el nombre, no la URL).
   *Verificación:* Rich Results Test de Google sobre una ficha de producto no reporta `aggregateRating`/`review`; la URL de `image` responde 200; el breadcrumb muestra marca y categoría reales.

5. **Home: H1, prosa y schema de negocio local.**
   En `app/(public)/page.tsx`:
   - Agregar una sección nueva justo debajo de `<SliderMain />` (antes de `<RecommendedProductsServer />`) con un `<h1>` (ej. "Materiales de Construcción Ligera en Ecatepec y Texcoco") y un párrafo de ~80-100 palabras que mencione qué distribuye Dipemsa, las dos sucursales y el alcance de envío. Texto nuevo, redactado en este spec.
   - Convertir el `@type: "Organization"` (líneas 62-146) en `@type: "Store"` con un `@id` (`https://www.dipemsa.com.mx/#organizacion`); mover cada `Place` del arreglo `location` a un objeto `LocalBusiness` independiente con su propio `@id` y `parentOrganization` apuntando al `@id` de la tienda, conservando toda la dirección/geo/horario/teléfono que ya existen.
   - Agregar un tercer bloque JSON-LD `WebSite` con `@id`, `url`, `name` y `potentialAction: SearchAction` apuntando a `/api/search?q={search_term_string}`.
   *Verificación:* Rich Results Test reconoce `LocalBusiness` para cada sucursal; `curl` sobre la home muestra exactamente un `<h1>`.

6. **Crear `src/config/contenidoSeo.ts` con los 28 textos.**
   Redactar las 14 intros de categoría y 14 de marca (~120 palabras cada una) y 2-3 FAQs por entrada, usando la información real del catálogo (productos típicos de cada categoría, línea de productos de cada marca). Exportar `contenidoCategorias`, `contenidoMarcas`, `contenidoDeCategoria`, `contenidoDeMarca`.
   *Verificación:* `npm run lint` pasa; revisión manual de que ninguna intro repite texto de otra.

7. **Categoría y marca: H1, intro, FAQ visible y schema.**
   - `CategoryResults.tsx:30` y `TrademarckResults.tsx:26`: cambiar el `<h2>` del nombre de la categoría/marca a `<h1>`.
   - Crear `src/shared/components/SeoIntro.tsx` (componente de servidor, sin `'use client'`): recibe el texto de `contenidoDeCategoria`/`contenidoDeMarca` y lo pinta como párrafo bajo el título; si `contenido` es `undefined`, no renderiza nada.
   - Crear `src/shared/components/FaqSection.tsx` (servidor): recibe `faqs: FaqItem[]`, renderiza una lista visible de preguntas/respuestas y devuelve también el JSON-LD `FAQPage` correspondiente (mismo componente arma el bloque visible y el schema, para que nunca queden desincronizados).
   - En `CategoryResults.tsx` y `TrademarckResults.tsx`, agregar el JSON-LD `BreadcrumbList` (Inicio → Categoría/Marca) e `ItemList` construido a partir de los `groupedProducts` que la función ya trae (sin consulta adicional a la base de datos).
   *Verificación:* `/categoria/tablaroca-y-durock` y `/marca/truper` muestran un `<h1>`, un párrafo de intro y una sección de FAQ visibles; el Rich Results Test detecta `BreadcrumbList`, `ItemList` y `FAQPage`.

8. **Breadcrumbs semánticos.**
   Reescribir el `<nav>` de `ProductCard.tsx:146-169` para usar `<nav aria-label="Ruta de navegación"><ol><li>` en vez de `<span>` sueltos con separadores de texto. Reutilizar el mismo patrón visual (no el mismo componente, por las distintas rutas) en categoría y marca, mostrando Inicio → Categoría/Marca actual.
   *Verificación:* inspección visual sin cambios de apariencia; el marcado usa `<ol>/<li>`.

9. **Páginas huérfanas y de bajo valor de indexación.**
   - `aviso-de-privacidad/page.tsx` y `terminos-y-condiciones/page.tsx`: agregar `export const metadata` propio (title, description) en vez de heredar "Dipemsa | Bienvenidos" del layout raíz.
   - `carrito-de-compra/page.tsx` y las tres páginas `compra/pago-{exitoso,fallido,pendiente}`: agregar `robots: { index: false, follow: true }` a su `metadata` existente (o crearla en pago-fallido/pago-pendiente, que hoy no tienen).
   - `app/(public)/resultados/[slug]/page.tsx` (hoy devuelve `<></>`  con 200): cambiar a `notFound()` de `next/navigation`, o eliminar la ruta si no está enlazada desde ningún lado (confirmar antes de borrar).
   *Verificación:* `curl -I` sobre `/carrito-de-compra` y `/compra/pago-exitoso` muestra `X-Robots-Tag: noindex` o el meta `robots` correspondiente en el HTML; `/resultados/cualquier-cosa` responde 404.

10. **`app/sitemap.ts`.**
    Quitar la entrada de `https://www.dipemsa.com.mx/logoDipemsa.jpg` (línea 13, una imagen listada como si fuera una página). Agregar `/aviso-de-privacidad` y `/terminos-y-condiciones`. Diferenciar `priority`: home 1.0, categorías/marcas 0.8, páginas institucionales (`/contacto`, `/soy-mayorista`, páginas legales) 0.5.
    *Verificación:* `curl https://www.dipemsa.com.mx/sitemap.xml | grep -c '.jpg'` da 0; el conteo de `<url>` sube en 2.

11. **`app/llms.txt/route.ts`.**
    Route handler nuevo, `export const revalidate = 3600`, que arma un documento Markdown plano con: qué es Dipemsa (una frase), las dos sucursales con dirección y horario (mismos datos que el JSON-LD `LocalBusiness` del paso 5, para no mantener el texto en dos lugares — se puede leer del mismo bloque de datos usado ahí o duplicar los literales si separar la fuente resulta más simple en la implementación), la regla de envío desde `src/config/envio.ts`, la lista de las 14 categorías y 14 marcas con su URL (de `marcas.ts` y `productos.ts`), y un enlace a `/products.xml` para el catálogo completo. Responde con `Content-Type: text/plain; charset=utf-8`.
    *Verificación:* `curl https://www.dipemsa.com.mx/llms.txt` devuelve 200 y contenido legible con las 28 URLs de categoría/marca.

12. **Corregir alts detectados en la auditoría.**
    - `src/shared/components/cart/ProductComponent.tsx:48`: reemplazar el `alt="Lija de agua"` hardcodeado por `alt={item.descripcion}` (o el campo equivalente del item del carrito), igual que ya hace `ProductCard.tsx`.
    - `src/shared/components/ProductCard.tsx:173`: cuando `producto.descripcion` esté vacío, usar un fallback genérico (`"Producto Dipemsa"`) en vez de `alt=""`.
    - `src/shared/components/footer/Footer.tsx:48-54`: corregir los `aria-label` de Facebook, Instagram y YouTube, que hoy dicen los tres "cuenta de tiktok de Dipemsa".
    *Verificación:* inspección del HTML: ningún producto del carrito muestra "Lija de agua" salvo que sea ese producto; los tres íconos sociales tienen `aria-label` distintos y correctos.

13. **Cierre.**
    Correr `npm run lint` y `npm run build` con Node ≥ 20.9 (`nvm use 22` si hace falta).
    *Verificación:* ambos comandos terminan sin error.

## Criterios de aceptación

- [ ] Ningún producto emite `aggregateRating` ni `review` en su JSON-LD `Product`.
- [ ] La URL de `image` del JSON-LD `Product` responde 200 (coincide con la imagen real en `/fotos/webp/`).
- [ ] El `BreadcrumbList` de la ficha de producto muestra el nombre real de la marca y de la categoría, no los literales "Marca"/"Producto".
- [ ] La home tiene exactamente un `<h1>` visible con prosa nueva de ~80-100 palabras.
- [ ] `curl` sobre la home y sobre las 6 páginas que antes tenían canonical relativo (`/productos`, `/marcas`, `/contacto`, `/soy-mayorista`, `/carrito-de-compra`) muestra `<link rel="canonical">` con URL absoluta.
- [ ] El JSON-LD de la home incluye un `Store` con dos `LocalBusiness` (uno por sucursal) y un `WebSite` con `SearchAction`.
- [ ] Cada una de las 14 páginas de categoría y 14 de marca tiene un `<h1>`, un párrafo de intro (≥100 palabras) y una sección de FAQ visible.
- [ ] El JSON-LD de cada página de categoría/marca incluye `BreadcrumbList`, `ItemList` y `FAQPage`.
- [ ] Solo existe un `robots.txt` servido por el sitio; declara `sitemap.xml`, `products.xml` y `feed.xml`; incluye bloques `Allow` para GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot y meta-externalagent.
- [ ] `/llms.txt` responde 200 con las 14 categorías y 14 marcas listadas con su URL.
- [ ] `sitemap.xml` no contiene ninguna URL de imagen; incluye `/aviso-de-privacidad` y `/terminos-y-condiciones`.
- [ ] El `shippingDetails` del JSON-LD de producto y el `g:shipping` de `feed.xml` declaran el mismo costo de envío, ambos derivados de `src/config/envio.ts`.
- [ ] `/carrito-de-compra` y las tres páginas `/compra/pago-*` emiten `noindex`.
- [ ] `/resultados/[slug]` ya no devuelve 200 con contenido vacío.
- [ ] `aviso-de-privacidad` y `terminos-y-condiciones` tienen su propio `<title>`, distinto de "Dipemsa | Bienvenidos".
- [ ] El breadcrumb de la ficha de producto usa `<nav aria-label><ol><li>`.
- [ ] Ningún producto del carrito muestra el `alt` hardcodeado "Lija de agua" salvo que sea ese producto exacto; los tres íconos sociales del footer tienen `aria-label` correctos y distintos.
- [ ] `npm run lint` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** eliminar `aggregateRating`/`review` en vez de reemplazarlos por datos reales. No existe ninguna tabla de reseñas ni mecanismo de captura; construirla es un proyecto propio (schema, moderación, UI) que merece su propio spec. Mientras tanto, mostrar cero valoración es honesto; mostrar una inventada es un riesgo de penalización activo sobre todo el dominio.
- **No:** conectar `existencias` a `availability`/`g:availability`. La auditoría no evaluó si esa columna refleja el stock real hoy; conectarla sin esa garantía podría anunciar como agotado un producto disponible (perdiendo ventas) o como disponible uno agotado (peor para confianza y para Google Merchant). Se deja como está — es el mismo comportamiento de hoy, documentado explícitamente como fuera de alcance en vez de dejarlo como un descuido.
- **Sí:** la regla de envío vive en un archivo de constantes (`src/config/envio.ts`), no en variables de entorno ni en base de datos. Mismo criterio que `src/config/descuentos.ts` en SPEC 07: no hay infraestructura de configuración en este proyecto, y un archivo de constantes es cero infraestructura nueva.
- **Sí:** los 28 textos de `contenidoSeo.ts` se redactan en este mismo trabajo, no se dejan como plantilla vacía. Un archivo de estructura sin contenido no mueve la aguja en buscadores de IA — el objetivo del spec es tener pasajes citables, y eso requiere que existan. El cliente los corrige después si alguna afirmación no es exacta; corregir un texto ya escrito es más rápido que escribirlo desde cero.
- **Sí:** `llms.txt` generado dinámicamente (route handler) en vez de un archivo estático en `public/`. Ni Google ni OpenAI documentan soporte oficial hoy — es una apuesta de bajo costo, no un requisito — pero generarlo desde la base de datos evita que quede desactualizado la primera vez que cambie una marca o categoría, con el mismo patrón de `revalidate` que ya usan `feed.xml` y `products.xml`.
- **No:** tocar la duplicación entre `/` y `/marcas` (la home renderiza `MarcasPage` completo). Es una decisión de diseño de la home, no un defecto de SEO por sí sola — Google no penaliza que un componente se reutilice en dos URLs cuando cada una tiene su propio canonical (que este spec sí corrige). Cambiarla es un rediseño de la home fuera del alcance de esta auditoría.
- **Sí:** el `BreadcrumbList` de producto corrige los *nombres* de marca/categoría pero mantiene las URLs actuales (marca → `/marca/{slug}`, categoría → `/categoria/{slug}`). Cambiar la estructura de navegación del breadcrumb (por ejemplo, insertar ambos niveles) es una decisión de UX que no se pidió; el error detectado es que el texto no corresponde al dato real, no que falte un nivel.
- **No:** agregar validación de build que exija que las 28 entradas de `contenidoSeo.ts` existan. El helper tolera slugs sin entrada (devuelve `undefined`) para que una categoría nueva en el futuro no rompa el sitio con un runtime error; se pierde la garantía de que "toda categoría tiene intro", que se acepta a cambio de no bloquear despliegues por un texto pendiente.
- **Sí:** unificar los tres literales de envío (`cartStore.ts`, JSON-LD, `feed.xml`) contra una sola constante. Hoy declaran tres valores distintos (300 fijo, 0 fijo, y la regla real de $5,000); un comprador o un LLM que lea el `feed.xml` vería "envío gratis siempre" mientras el checkout cobra $300 por debajo del umbral — inconsistencia que además contamina Google Merchant Center.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Los 28 textos de `contenidoSeo.ts` contienen una afirmación comercial imprecisa (ej. "distribuidor autorizado de X") | Se redactan a partir de datos objetivos del catálogo (qué productos vende, qué mide, qué usos tiene), evitando afirmaciones de relación comercial no verificadas. El cliente revisa antes de considerarlas definitivas. |
| Quitar `aggregateRating`/`review` hace que las fichas de producto pierdan las estrellas en los resultados de Google mientras no exista un sistema de reseñas reales | Es el costo de dejar de mostrar un dato falso. Documentado como fuera de alcance el sistema de reseñas reales — es la vía correcta para recuperar el rich result de estrellas. |
| El `Google-Extended` y otros tokens de crawler de IA en `robots.txt` no bloquean nada por definición del propio spec (todo es `Allow`), así que agregarlos no cambia el comportamiento real, solo lo hace explícito | Aceptado: el objetivo es documentar y confirmar intención, no cambiar el acceso (que ya era abierto). |
| `llms.txt` no tiene estándar ni soporte confirmado por ningún proveedor de IA a la fecha de este spec | Costo de implementación bajo (un route handler más, mismo patrón que los feeds existentes); si el estándar no prospera, el archivo queda inerte sin afectar nada más. |
| Cambiar `<h2>` a `<h1>` en categoría/marca coincide con el `<h1>` que ya existe en la ficha de producto — nunca hay dos `<h1>` en la misma página porque son rutas distintas | Verificado en la auditoría: cada tipo de página (home, categoría, marca, producto) es una ruta separada; no hay compuertas donde coexistan. |
| Eliminar `app/(public)/robots.txt` sin verificar cuál de los dos gana hoy en producción podría no ser el que se pensaba | Antes de eliminar, confirmar con `curl https://www.dipemsa.com.mx/robots.txt` cuál contenido se sirve actualmente (Next.js prioriza el archivo estático en `app/` sobre grupos de rutas: se espera que `app/robots.txt`, fuera del grupo, sea el servido). |

## Lo que **no** está en este spec

- Sistema de reseñas reales (tabla, formulario, moderación, cálculo de `aggregateRating` desde datos reales).
- Conectar `existencias` a `availability`/`g:availability`.
- Blog o centro de contenidos editorial.
- Internacionalización / `hreflang`.
- Core Web Vitals y optimización de imágenes más allá de la actual.
- Headers de seguridad (HSTS, CSP, X-Content-Type-Options).
- Autenticación del grupo `app/(admin)/`.
- Limpieza de datos sucios en `productos_` (ej. precios con doble `$`).
- Migrar `app/robots.txt` de archivo estático a `robots.ts` generado.
- Rediseño de la home para eliminar la duplicación de contenido con `/marcas`.
- Google Business Profile, directorios externos, estrategia de backlinks.

Cada uno, si se hace, va en su propio spec.
