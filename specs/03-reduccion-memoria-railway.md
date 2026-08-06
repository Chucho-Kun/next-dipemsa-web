# SPEC 03 — Reducción de consumo de memoria en Railway

> **Status:** Approved
> **Depends on:** Ninguno
> **Date:** 2026-08-05
> **Objective:** Reducir el consumo de memoria en producción del servicio `next-dipemsa-web` en Railway ajustando caché de Next.js, optimización de imágenes y queries sin caché, sin cambiar funcionalidad visible para el usuario.

## Diagnóstico

Datos de costos de Railway (mes de 31 días): memoria $4.70 (67% del costo total, 20,320 GB-min), CPU $0.05 (113.63 vCPU-min, prácticamente nulo), egress $2.20, volumen $0.03. La gráfica de "Memory usage" por servicio confirma que el consumo es casi en su totalidad del servicio `next-dipemsa-web` (Postgres es plano/despreciable en esa gráfica), con un patrón de piso creciente (~200MB → ~400-500MB) intercalado con picos repetidos hasta 1.0-1.1GB.

Hallazgos de la investigación del código:

1. **Causa principal probable:** el 26 may se agregó a `next.config.ts` un fix explícito (`cacheHandler: undefined`, `cacheMaxMemorySize: 0`) con el comentario "Solución temporal para el LRUCache" — deshabilitaba el caché en memoria (Full Route Cache / Data Cache) de Next.js. El 13 jul, en el commit "new products", esas líneas quedaron comentadas (revertidas) sin explicación clara — el usuario reporta que coincidió con logs de "cierre inesperado en la consulta a la base de datos", pero ese problema ya tiene su propio mitigante (`pool.on('error')` en `src/shared/db/index.ts`), sin evidencia de relación causal con el caché. El caché LRU en memoria está activo de nuevo hoy, lo que coincide con el patrón de piso creciente en la gráfica de memoria.
2. **Optimización de imágenes sin restricción:** `next.config.ts` tiene `remotePatterns: { hostname: '**' }`, pero ninguna imagen en el código usa una URL remota — todas vienen de `/public/fotos/` (1056 imágenes, 35MB), `/public/icons/` y assets estáticos. El patrón `'**'` deja abierto el optimizador de imágenes (`sharp`, en runtime) a cualquier host externo sin necesidad real, y el array `qualities: [75, 85, 90, 100]` amplía innecesariamente las combinaciones de caché cuando en el código solo se usa `85` explícitamente (`ProductCard.tsx:179`) además del valor por defecto.
3. **Queries sin caché en rutas de feeds:** `app/feed.xml/route.ts` y `app/products.xml/route.ts` llaman a `getAllProductosXML()` (sin `limit`, sin paginar) en cada request, sin ningún `revalidate`. La tabla `productos_` es pequeña (437 filas, 400KB), así que esto no es la causa principal de memoria, pero cada hit de un bot/crawler dispara una query nueva y construcción de XML sin necesidad.
4. **Descartado como causa:** el pool de PostgreSQL (`src/shared/db/index.ts`) está bien configurado (`max: 8`, `idleTimeoutMillis`, listener de error) — no hay evidencia de fuga ahí. No se encontraron `setInterval`/`addEventListener` sin limpiar ni cachés module-level (`Map` global) en el código de la aplicación.
5. **Configuración de Railway:** el usuario confirmó 1 sola réplica del servicio, siempre activa (sin "sleep on idle"), lo que — dado el CPU casi nulo — implica pagar memoria base 24/7 aunque el tráfico real sea bajo.

## Scope

**In:**

- Re-habilitar el control de tamaño de caché en memoria de Next.js (`cacheMaxMemorySize`) en `next.config.ts`, revirtiendo el comentario del 13 jul y volviendo al valor ya probado en producción (`0`), que deshabilita el caché LRU en memoria (Full Route Cache / Data Cache) forzando disco.
- Eliminar `remotePatterns: { hostname: '**' }` en `next.config.ts`. Ninguna imagen en el código usa una URL remota — todas vienen de `/public/fotos/`, `/public/icons/` y assets estáticos locales — así que este patrón solo deja abierto el optimizador de imágenes a cualquier host externo sin necesidad real.
- Reducir el array `qualities` en `next.config.ts` a los valores realmente usados en el código (`75` por defecto implícito, `85` explícito en `ProductCard.tsx`), quitando `90` y `100`.
- Agregar `revalidate` a las rutas `app/feed.xml/route.ts` y `app/products.xml/route.ts`, que hoy ejecutan `getAllProductosXML()` (consulta completa, sin límite) en cada request sin ningún control de caché — cada hit de un bot/crawler dispara una query nueva.
- Documentar como recomendación operativa (fuera de código) el ajuste en el dashboard de Railway: activar "sleep on idle" para el servicio `next-dipemsa-web`, dado que el CPU promedio es prácticamente 0 con 1 sola réplica siempre activa.

**Out of scope (for future specs):**

- Cambios al pool de PostgreSQL (`src/shared/db/index.ts`) — ya está bien configurado (`max: 8`, `idleTimeoutMillis`, listener de error); no hay evidencia de que sea causa del problema.
- Revisión de `deviceSizes`/`imageSizes` de `next/image` — requeriría medir los anchos reales renderizados (`sizes` prop) por componente; queda para un spec de imágenes más profundo si el problema persiste.
- Migrar a `output: 'standalone'` — afecta sobre todo tamaño de build/imagen, no memoria en runtime; sin evidencia de que sea causa del problema actual.
- Investigar a fondo los logs de "cierre inesperado en la consulta a la base de datos" — ya existe `pool.on('error')` en `src/shared/db/index.ts` que evita el crash; no hay evidencia de relación causal con el caché de Next.js revertido.
- Cambiar número de réplicas o límite de memoria del servicio en Railway — el usuario confirmó 1 sola réplica; no se toca sin evidencia adicional.

## Data model

Este spec no introduce estructuras de datos nuevas. Todos los cambios son de configuración (`next.config.ts`) y de control de caché en dos route handlers existentes (`app/feed.xml/route.ts`, `app/products.xml/route.ts`). No se modifica el schema de Drizzle ni `productos_`.

## Implementation plan

1. En `next.config.ts`, descomentar `cacheHandler: undefined` y `cacheMaxMemorySize: 0` (líneas revertidas el 13 jul). Verificación manual: `npm run build && npm run start` local, navegar el catálogo (`/`, `/productos`, `/producto/[id]/[slug]`) y confirmar que carga igual, ahora con caché en disco en vez de memoria.
2. En `next.config.ts`, quitar el bloque `remotePatterns` (no se usa ninguna imagen remota en el código). Verificación: `npm run build` sin errores; las imágenes de producto en `/productos`, `/marca/[slug]` y `/categoria/[slug]` siguen cargando igual.
3. En `next.config.ts`, reducir `qualities` a `[75, 85]`. Verificación: la imagen con `quality={85}` en `ProductCard.tsx:179` sigue renderizando sin error de "quality not allowed".
4. En `app/feed.xml/route.ts` y `app/products.xml/route.ts`, agregar `export const revalidate = 3600;` (el catálogo solo cambia vía importación CSV manual, no en tiempo real). Verificación: `curl localhost:3000/feed.xml` y `curl localhost:3000/products.xml` en local devuelven XML válido con los mismos productos.
5. **(Fuera de código, dashboard de Railway)** Activar "sleep on idle" para el servicio `next-dipemsa-web`, dado que el CPU promedio es ~0. Verificación: confirmar en Railway que el servicio entra en reposo tras el período de inactividad configurado y despierta correctamente al recibir tráfico — **antes de activarlo, tener en cuenta que la documentación oficial de Railway ([docs.railway.com/deployments/serverless](https://docs.railway.com/deployments/serverless)) admite que la primera request tras dormir puede devolver un 502 Bad Gateway** (no garantiza que se encolen, a diferencia de lo que sugiere el texto del toggle en el dashboard). El checkout llama directamente y de forma síncrona a `/api/mercadopago/process-payment` desde el navegador (no hay webhook de Mercado Pago de por medio), así que un 502 ahí sería un fallo visible para el cliente en plena compra. Ver detalle en la sección Risks.

## Acceptance criteria

- [ ] `next.config.ts` tiene `cacheHandler: undefined` y `cacheMaxMemorySize: 0` activos (no comentados).
- [ ] `next.config.ts` ya no contiene `remotePatterns` con `hostname: '**'`.
- [ ] `next.config.ts` tiene `qualities: [75, 85]`.
- [ ] `app/feed.xml/route.ts` y `app/products.xml/route.ts` exportan `revalidate = 3600`.
- [ ] `npm run build` completa sin errores.
- [ ] Las páginas `/`, `/productos`, `/producto/[id]/[slug]`, `/marca/[slug]` y `/categoria/[slug]` cargan sus imágenes de producto correctamente en local tras el cambio.
- [ ] El flujo de checkout con Mercado Pago sigue funcionando igual que antes del cambio.
- [ ] `/feed.xml` y `/products.xml` devuelven XML válido con el mismo conteo de productos que antes del cambio.
- [ ] (Verificación post-deploy, 7 días) La gráfica de "Memory usage" de `next-dipemsa-web` en Railway ya no muestra picos sostenidos por encima de 1 GB bajo tráfico normal.

## Decisions

- **Sí:** re-aplicar `cacheMaxMemorySize: 0` — el valor exacto ya probado en producción entre el 26 may y el 13 jul — en vez de un valor intermedio (ej. 25MB). Es el único valor con historial real en este proyecto; uno intermedio sería una hipótesis nueva sin validar.
- **No:** usar un `cacheHandler` personalizado (ej. respaldado por Redis) en vez de deshabilitar el caché en memoria. Agregaría un servicio adicional en Railway para un problema resoluble sin costo extra; se puede reconsiderar si el tráfico crece mucho.
- **Sí:** eliminar `remotePatterns` por completo en vez de restringirlo a hosts específicos. No hay ningún uso real de imágenes remotas en el código — no hace falta permitir ningún host externo.
- **No:** tocar `deviceSizes`/`imageSizes` en este spec. Requiere medir los anchos renderizados reales por componente (`sizes` prop), es una auditoría aparte no cubierta por los hallazgos actuales.
- **Sí:** agregar `revalidate = 3600` a las rutas de feeds en vez de un caché más elaborado (ej. revalidación on-demand enganchada al script de importación CSV). Es el cambio mínimo que resuelve el problema — query sin caché en cada request — sin acoplar los feeds al pipeline de importación.
- **No:** modificar `src/shared/db/index.ts` (pool de PostgreSQL). Ya está bien configurado y no hay evidencia de fuga ahí.
- **No:** migrar a `output: 'standalone'` en este spec. No hay evidencia de que afecte memoria en runtime; es un cambio de build que amerita su propia validación por separado.
- **Sí:** documentar "sleep on idle" en Railway como recomendación, pero tratarlo como el paso de **mayor** riesgo operativo del plan (no bajo riesgo, pese a no tocar código). El usuario confirmó 1 réplica siempre activa con CPU casi nulo, pero un servicio dormido podría retrasar la confirmación de pagos de Mercado Pago si no despierta a tiempo al recibir el webhook.

## Risks

| Risk | Mitigation |
|---|---|
| `cacheMaxMemorySize: 0` fuerza el caché a disco, lo que podría aumentar levemente la latencia de páginas al perder el caché rápido en memoria. | Ya estuvo así en producción ~7 semanas (26 may–13 jul) sin reportes de lentitud. Monitorear tiempos de respuesta tras el deploy. |
| Quitar `remotePatterns` rompe si en el futuro se agrega una imagen remota (ej. CDN externo) sin actualizar `next.config.ts`. | `next/image` lanza un error claro en build/desarrollo indicando el host no permitido — fácil de detectar y volver a agregar. |
| `revalidate = 3600` en los feeds retrasa hasta 1 hora que un producto nuevo (agregado vía `npm run import:csv`) aparezca en `/feed.xml` y `/products.xml` (Google Merchant Center, sitemap). | Aceptable porque las importaciones son manuales y no urgentes; si se necesita reflejo inmediato, bajar el `revalidate` o disparar una revalidación manual después del import. |
| "Sleep on idle" en Railway: el checkout **no usa webhooks de Mercado Pago** — `MercadoPagoBrick` llama directamente y de forma síncrona a `POST /api/mercadopago/process-payment` desde el navegador del cliente, y el correo de confirmación (Resend) se dispara ahí mismo si el pago resulta exitoso. Si el servicio está dormido, esa llamada síncrona cae en un cold start. La [documentación oficial de Railway](https://docs.railway.com/deployments/serverless) es más cauta que el texto del toggle del dashboard: no garantiza que las requests se encolen, dice explícitamente que **"la primera solicitud puede devolver un error 502 Bad Gateway"**. Un 502 en `process-payment` sería un fallo directo y visible para el cliente en medio de su compra, no un webhook perdido que se reintenta solo. | El servicio duerme solo tras 10 min sin tráfico *saliente*; el pool de Postgres (`idleTimeoutMillis: 12000`) cierra clientes inactivos a los 12s, así que no hay tráfico saliente artificial manteniéndolo despierto — el sleep debería activarse de forma normal en horas sin tráfico. Aun así, no activar sin antes confirmar con pruebas propias (o soporte de Railway) el comportamiento exacto en `process-payment`, y monitorear de cerca los primeros pagos tras activarlo, con plan de revertir rápido si aparece algún 502 en checkout. |

## What is **not** in this spec

- Cambios al pool de PostgreSQL (`src/shared/db/index.ts`).
- Revisión de `deviceSizes`/`imageSizes` de `next/image`.
- Migración a `output: 'standalone'`.
- Investigación a fondo de los logs de "cierre inesperado en la consulta a la base de datos".
- Cambios al número de réplicas o al límite de memoria del servicio en Railway.

Cada uno de estos, si se necesita, va en su propio spec.
