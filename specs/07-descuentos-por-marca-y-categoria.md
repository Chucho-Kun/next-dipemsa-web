# SPEC 07 — Descuentos por marca y categoría

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-09-08
> **Objetivo:** Aplicar en la capa de datos un descuento porcentual configurable por marca o por categoría, de modo que el precio con descuento reemplace al de la base en todo el sitio y las fichas muestren el precio original tachado junto al nuevo.

## Por qué existe este spec

Hoy el precio de un producto se lee de `productos_.precio` — un `varchar(30)` con formato `"$1,110.25"` (`src/shared/db/schema/productList.ts:15`) — y viaja sin transformarse por toda la aplicación: fichas, buscador, carrito (`cartStore.ts`), preferencia y cobro de Mercado Pago, correo de confirmación, tabla `ordenes`, eventos GA4 y los feeds XML. No existe ningún concepto de descuento en el schema ni en el código. El único mecanismo de "promoción" actual es indirecto: si la columna `precioant` tiene valor, `GroupCard.tsx:73-77` pinta el badge "PROMOCIÓN" y `GroupCard.tsx:139` / `ProductCard.tsx:238` muestran ese `precioant` tachado.

El cliente pidió poder **activar un 5% de descuento en todos los productos de la marca "Cempanel"**, y que el sistema sea general: asignar un porcentaje a una marca o a una categoría, y que al activarlo las fichas muestren el precio anterior y el nuevo.

La observación que define el diseño: como `handleAddToCart` (`ProductCard.tsx:104-114`), `toGA4Item` (`src/utils/gtm.ts:55-72`), el cuerpo del correo y los payloads de Mercado Pago leen todos el mismo campo `producto.precio`, si el descuento se aplica **una sola vez, en la capa de datos** — la consulta devuelve `precio` ya descontado y `precioant` con el precio de lista — toda la cadena hereda el precio nuevo sin tocar ningún componente de presentación, y el tachado + badge aparecen solos por la lógica que ya existe.

Nota: "Cempanel" existe en la base de datos tanto en la columna `marca` como en la columna `categoria` (mismo valor en ambas para esos SKUs). Las dos clases de regla lo cubren, así que la precedencia entre marca y categoría es una decisión real desde el primer día.

## Alcance

**Dentro:**

- Archivo nuevo `src/config/descuentos.ts` con el tipo `ReglaDescuento` y el arreglo `reglasDescuento`, cargado con una regla: marca `Cempanel`, 5%, activa.
- Archivo nuevo `src/utils/aplicarDescuento.ts` con el helper que calcula y aplica el descuento, reutilizando `parsePrecio` y `formatMoney` de `src/utils/formatPrice.ts`.
- `src/shared/db/queries.ts`: aplicar el descuento en `getProductsByGroupsofTrademarks` (37), `getProductsByGroupsofCategories` (79), `getProductById` (127), `getRecomendedProducts` (137), `getAllProductosXML` (143), `getRelatedProducts` (165) y `getProductVariants` (150).
- `getProductVariants` proyecta hoy solo `id, clave, descripcion, precio` (`queries.ts:153-158`): agregar `marca`, `categoria` y `precioant` para poder evaluar la regla.
- `src/shared/db/resultados.ts`: ampliar `VariantOptionType` (34-38) con `marca`, `categoria` y `precioant`.
- `app/api/search/route.ts`: agregar `categoria` a la proyección (13-20) y aplicar el descuento a los resultados antes de responder.
- `app/api/admin/productos/route.ts`: aplicar el descuento a la lista que consume el panel interno `/productos/relacionados`.
- `src/store/cartStore.ts`: agregar `version: 1` y `migrate` al bloque `persist` (104-111) para invalidar los carritos ya guardados en `localStorage` con precios anteriores.
- `src/shared/components/ProductCard.tsx:238`: el precio tachado también se multiplica por la cantidad seleccionada, igual que el precio principal de la línea 236.

**Fuera de alcance (para specs futuros):**

- Pantalla de administración para crear, editar o activar reglas. La configuración vive en un archivo del repo; cambiar un porcentaje o activar una regla es un commit + deploy en Railway.
- Guardar las reglas en la base de datos o en una tabla de settings (no existe ninguna hoy).
- Vigencia por fechas (inicio / fin). La regla solo tiene `activo: true | false`.
- Línea de "Descuento" desglosada en `ResumenCompra.tsx`, en el HTML del correo (`app/api/send-email/route.ts`) o como columna nueva en la tabla `ordenes`. El carrito, el resumen y el correo usan el precio ya descontado, sin mostrar cuánto se descontó.
- Descuentos por producto individual, por `clave`, por volumen / cantidad, o por cupón.
- Validar en el servidor que el `transaction_amount` que manda el cliente (`app/api/mercadopago/process-payment/route.ts:18`) coincida con el precio de la base de datos. Ese hueco ya existe hoy y merece su propio spec.
- Arreglar el orden de variantes por precio en `queries.ts:66` y `:114` (`parseFloat("$1,110.25")` devuelve `NaN`, así que el `sort` no reordena nada).
- Arreglar el cruce de `orden_cat` / `orden_prod` entre las vistas de marca y categoría (`queries.ts:45,71` vs `:87,119`).
- Unificar los cuatro componentes que imprimen el string crudo de precio (`RecommendedProducts.tsx:82,86`, `RelatedProducts.tsx:73,77`, `RecentViewProducts.tsx:54,58`, `header/SearchBar.tsx:138,142`) con los que ya pasan por `formatPrecio`.
- Versionar el store `dipemsa-recent-products` (`src/store/recentProductsStore.ts`).
- Agregar el badge "PROMOCIÓN" a las superficies que hoy no lo tienen (detalle, recomendados, relacionados, recientes, buscador).
- Autenticación del grupo de rutas `app/(admin)/`.

## Modelo de datos

Este spec no introduce cambios de schema ni toca la base de datos. Agrega dos estructuras, ambas en el repositorio.

### `src/config/descuentos.ts`

```ts
export type ReglaDescuento = {
  tipo: 'marca' | 'categoria';
  valor: string;       // valor tal como aparece en la columna productos_.marca / .categoria
  porcentaje: number;  // se ignora si <= 0 o >= 100
  activo: boolean;
};

export const reglasDescuento: ReglaDescuento[] = [
  { tipo: 'marca', valor: 'Cempanel', porcentaje: 5, activo: true },
];
```

### `src/utils/aplicarDescuento.ts`

Expone tres funciones:

- `porcentajeDescuento(marca: string | null, categoria: string | null): number` — recorre `reglasDescuento`, se queda con las reglas `activo: true` cuyo `valor` normalizado coincide exacto con el `marca` o `categoria` normalizado del producto, y devuelve el **mayor** `porcentaje` de entre ellas. Devuelve `0` si ninguna aplica.
- `aplicarDescuento<T extends { marca?: string | null; categoria?: string | null; precio?: string | null; precioant?: string | null }>(producto: T): T` — devuelve una copia del producto con `precio` descontado y `precioant` igual al precio de lista original.
- `aplicarDescuentoLista<T>(productos: T[]): T[]` — mapea `aplicarDescuento` sobre un arreglo.

Reglas de cálculo:

- **Normalización de la coincidencia:** `trim()` + `normalize('NFD')` sin diacríticos + `toLowerCase()`, en los dos lados de la comparación. Es coincidencia **exacta tras normalizar**, no subcadena: una regla con `valor: 'Panel'` no debe alcanzar a un producto de marca `'Cempanel'`. La normalización protege contra los espacios sobrantes que ya existen en la base (el SPEC 05 documentó filas de `productos_` con espacios al final).
- **Fórmula:** `nuevo = Math.round(parsePrecio(precio) * (100 - porcentaje)) / 100`. Dos decimales. Nunca `.toFixed(2)` a mano (regla de CLAUDE.md).
- **Formato de salida:** el `precio` resultante se re-emite como `'$' + formatMoney(nuevo)`, ej. `"$1,054.74"`. Es el mismo formato `varchar` con `$` y coma de miles que ya guarda la base, así que los cuatro componentes que imprimen el string crudo lo siguen mostrando bien.
- **`precioant` de salida:** el `precio` de lista original, re-emitido con el mismo `'$' + formatMoney(parsePrecio(precio))`. Se pisa cualquier `precioant` que la fila tuviera en la base mientras la regla esté activa.
- **Casos que se devuelven intactos:** `porcentajeDescuento` es `0`; o `parsePrecio(precio)` es `0` (campo vacío o no numérico).
- **Reglas ignoradas:** `activo: false`, `porcentaje <= 0`, `porcentaje >= 100`.

### Cambio de tipos

`VariantOptionType` en `src/shared/db/resultados.ts:34-38` pasa de `Pick<ResultadosType, 'id' | 'clave' | 'descripcion' | 'precio'>` a incluir también `'marca' | 'categoria' | 'precioant'`.

### Versionado del carrito

`src/store/cartStore.ts`, bloque `persist` (104-111): se agrega `version: 1` y `migrate: () => ({ items: [] })`. Cualquier carrito guardado bajo la versión anterior (sin número de versión) se descarta al rehidratar y el comprador vuelve a agregar los productos con el precio vigente. La forma de `CartItem` no cambia.

## Plan de implementación

1. **Crear la configuración.** Nuevo archivo `src/config/descuentos.ts` con el tipo `ReglaDescuento` y el arreglo `reglasDescuento` cargado con la regla de Cempanel al 5%.
   *Verificación:* `npm run lint` pasa.

2. **Crear el helper de descuento.** Nuevo archivo `src/utils/aplicarDescuento.ts` con `porcentajeDescuento`, `aplicarDescuento` y `aplicarDescuentoLista`, importando `parsePrecio` y `formatMoney` de `src/utils/formatPrice.ts`. Sigue el patrón de funciones sueltas del proyecto (no hay capa de servicios).
   *Verificación:* `npm run lint` pasa.

3. **Aplicar en las consultas que ya traen `marca` y `categoria`.** En `src/shared/db/queries.ts`: `getProductById` y `getRecomendedProducts` y `getAllProductosXML` envuelven su resultado con `aplicarDescuento` / `aplicarDescuentoLista`. `getRelatedProducts` igual (ya proyecta `marca` y `categoria` en las líneas 174-175). En `getProductsByGroupsofTrademarks` y `getProductsByGroupsofCategories`, aplicar `aplicarDescuentoLista` sobre `rawProducts` **antes** de la agrupación por nombre base (líneas 48 y 98).
   *Verificación:* con `npm run dev`, `/marca/cempanel` y `/categoria/cempanel` muestran cada producto con el precio de lista tachado, el precio con 5% menos, y el badge "PROMOCIÓN".

4. **Ampliar `getProductVariants` y su tipo.** En `queries.ts:150-162` agregar `marca: productos.marca`, `categoria: productos.categoria` y `precioant: productos.precioant` a la proyección, y envolver el resultado con `aplicarDescuentoLista`. Ampliar `VariantOptionType` en `resultados.ts` con esos tres campos.
   *Verificación:* en la ficha de detalle de un producto Cempanel con variantes, el `<select>` y el precio mostrado usan el precio con descuento; `npm run lint` pasa.

5. **Aplicar en las rutas de API.** En `app/api/search/route.ts` agregar `categoria: productos.categoria` a la proyección (13-20) y pasar `results` por `aplicarDescuentoLista` antes del `Response.json`. En `app/api/admin/productos/route.ts` hacer lo mismo con la lista que devuelve (ya proyecta `marca` y `categoria`).
   *Verificación:* buscar un producto Cempanel en el buscador del header muestra el precio de lista tachado y el precio con descuento; el panel `/productos/relacionados` muestra los precios con descuento.

6. **Versionar el carrito.** En `cartStore.ts`, agregar `version: 1` y `migrate: () => ({ items: [] })` al bloque `persist`.
   *Verificación:* con un carrito con productos agregado antes de este cambio, al recargar la página el carrito queda vacío; agregar un producto nuevo funciona normal.

7. **Corregir el tachado por cantidad en la ficha de detalle y cerrar.** En `ProductCard.tsx:238`, cambiar `formatPrecio(producto.precioant)` por `totalxcantidad(producto.precioant ?? '', quantity)` para que el tachado escale con la cantidad igual que el precio principal (línea 236). Correr `npm run lint` y `npm run build`.
   *Verificación:* en la ficha de detalle, subir la cantidad hace que el precio con descuento y el precio tachado crezcan proporcionalmente.

## Criterios de aceptación

- [ ] Con la regla activa, todo producto de marca `Cempanel` muestra en `/marca/cempanel` y `/categoria/cempanel` el precio de lista tachado, el precio con 5% menos, y el badge "PROMOCIÓN".
- [ ] La ficha de detalle (`/producto/[id]/[slug]`) de un producto Cempanel muestra el precio tachado y el precio con descuento.
- [ ] El `<select>` de variantes de la ficha de detalle usa precios con descuento para los productos Cempanel.
- [ ] Un producto de cualquier otra marca no cambia de precio ni de apariencia respecto a hoy.
- [ ] Un producto Cempanel que ya tenía `precioant` en la base muestra como tachado su `precio` de lista, no el `precioant` guardado.
- [ ] El buscador del header, el carrusel de recomendados, los relacionados y los vistos recientemente muestran el precio con descuento para los productos Cempanel.
- [ ] Agregar un producto Cempanel al carrito guarda el precio con descuento; el subtotal, el envío y el total de `ResumenCompra` se calculan sobre ese precio.
- [ ] Un pago aprobado con tarjeta de prueba APRO cobra el total con descuento, y la fila registrada en `ordenes` tiene ese mismo total y el precio unitario con descuento en `items`.
- [ ] El correo de confirmación muestra los precios con descuento.
- [ ] `feed.xml` publica `<g:price>` con el precio con descuento, y el JSON-LD `offers.price` de la ficha de detalle también.
- [ ] Cambiar la regla a `activo: false` y recargar devuelve todo el sitio al precio de lista, sin tachado ni badge, en todas las superficies anteriores.
- [ ] Con una regla de categoría del 10% y otra de marca del 5% que caen sobre el mismo producto, el precio mostrado y cobrado aplica 10%, no 15%.
- [ ] Un carrito armado antes de este cambio queda vacío tras recargar la página.
- [ ] `npm run lint` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** aplicar el descuento en la capa de datos (`queries.ts` y las rutas de API que consultan directo), no en cada componente. Hay ocho superficies distintas que pintan precio y varias que lo leen para el carrito, el cobro y GA4; centralizar en el punto de entrada de los datos garantiza que ninguna se olvide y que el precio cobrado siempre coincida con el mostrado.
- **Sí:** que el descuento reemplace al precio real en todo el flujo, incluido el cobro con tarjeta. El cliente paga el precio con descuento. Mostrar un precio y cobrar otro sería engañoso.
- **Sí:** la configuración vive en un archivo del repo (`src/config/descuentos.ts`), no en la base de datos ni en variables de entorno. No hay ninguna tabla de settings en el proyecto y crear una (más su pantalla de administración, más la autenticación que el grupo `(admin)` no tiene) es un proyecto aparte. Un archivo de constantes es cero infraestructura.
- **No:** pantalla de administración en este spec. Depende de resolver antes la autenticación del grupo `app/(admin)/`. Se hace después, en su propio spec.
- **No:** guardar las reglas en la base de datos. Mismo motivo: sin pantalla que las edite, una tabla no aporta nada sobre un archivo de constantes, y sí agrega una consulta por request.
- **Sí:** cuando marca y categoría chocan, gana el mayor porcentaje y nunca se acumulan. Es simple de explicar al comprador y elimina el riesgo de que crear una regla nueva dispare un descuento involuntariamente grande sobre productos que ya tenían otra.
- **Sí:** el descuento se calcula sobre `precio` y pisa el `precioant` de la base mientras la regla esté activa. Solo 31 filas del catálogo tienen `precioant` hoy; respetarlo obligaría a decidir un "descuento sobre descuento" que el cliente no pidió.
- **Sí:** coincidencia exacta tras normalizar (sin mayúsculas, sin acentos, sin espacios). La base ya tiene filas con espacios sobrantes (SPEC 05); una coincidencia exacta cruda dejaría esas filas fuera del descuento sin aviso. Exacta y no subcadena, para que `"Panel"` no alcance a `"Cempanel"`.
- **Sí:** redondeo a dos decimales. Es el formato que ya usa `formatMoney` en todo el sitio y el que Mercado Pago espera como monto.
- **Sí:** el precio con descuento se re-emite como string `"$1,054.74"`, con el mismo formato que la base. Así los cuatro componentes que imprimen el string crudo (`RecommendedProducts`, `RelatedProducts`, `RecentViewProducts`, `SearchBar`) no necesitan cambios.
- **Sí:** versionar `dipemsa-cart` con `version` + `migrate` que lo vacía. El carrito congela el precio al agregar el producto y no lo actualiza nunca; sin versionado, al activar o desactivar una regla un comprador con el carrito abierto pagaría el precio viejo. Vaciarlo es la opción sin lógica de recálculo ni endpoint nuevo. Contrapartida asumida: cada vez que cambie una regla hay que subir el número de versión.
- **No:** recalcular el precio del carrito al rehidratar. Requiere un endpoint nuevo que reconsulte cada producto y expone al comprador a que el precio le cambie sin aviso entre que arma el carrito y paga.
- **Sí:** el descuento también en `feed.xml`, `products.xml`, el JSON-LD y el `generateMetadata` de la ficha. Sale gratis al aplicarlo en la capa de datos, y evita que Google Shopping anuncie un precio distinto al del checkout.
- **Sí:** solo las fichas muestran el desglose (tachado + badge). El carrito, el resumen y el correo usan el precio ya descontado sin una línea "Descuento: -$X". Es el cambio mínimo y no toca el flujo de cobro ni los eventos GA4.
- **No:** línea de "Descuento" en `ResumenCompra`, el correo y `ordenes`. Es lo más transparente pero toca cuatro superficies más y los eventos GA4; se puede hacer después si el cliente lo pide.
- **Sí:** corregir de paso `ProductCard.tsx:238` para que el tachado escale con la cantidad. Hoy el precio principal se multiplica por la cantidad y el tachado no; con solo 31 productos afectados casi no se nota, pero con el descuento activo lo tendrán todos los Cempanel y el descuadre sería visible. Es un cambio de una línea.
- **Sí:** el panel interno `/productos/relacionados` muestra los precios con descuento, igual que el sitio. Quien administra ve lo mismo que el comprador.
- **No:** validar el `transaction_amount` contra la base de datos en `process-payment`. Es un hueco que ya existe hoy (el cliente puede editar `localStorage` y pagar cualquier monto); este spec no lo abre ni lo cierra, y arreglarlo bien merece su propio spec.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Un producto Cempanel visto antes del cambio queda con el precio de lista congelado en `dipemsa-recent-products` | Es solo display en el carrusel de "vistos recientemente", nunca se cobra desde ahí. El store guarda máximo 5 productos, así que se autocorrige tras unas pocas visitas. Versionar ese store queda fuera de alcance. |
| Cada request recalcula el descuento de cada producto | Es aritmética en memoria sobre datos que la consulta ya trajo: no agrega ni una consulta a la base. El catálogo son ~440 filas. |
| Cada cambio de regla obliga a subir `version` del carrito o se cobran precios viejos | Documentado en la decisión de versionado. Es el precio de tener el carrito con precios congelados; la alternativa (recalcular al rehidratar) se descartó por más compleja. |
| El `transaction_amount` sigue viniendo del cliente sin validación | Riesgo preexistente, no introducido aquí. Con el descuento activo la superficie es la misma: un atacante ya podía pagar cualquier monto. Se anota como spec futuro. |
| Una regla mal escrita (`valor: 'cempanel '` con espacio, o acento de más) no coincide | La normalización quita espacios, acentos y mayúsculas de los dos lados, así que `'cempanel '`, `'CEMPANEL'` y `'Cempanel'` coinciden todas con la columna. |
| La agrupación de variantes por precio en `queries.ts:66/114` ya está rota y el descuento cambia los precios que compara | El `sort` hoy no ordena nada (`parseFloat("$…")` es `NaN`); el descuento no lo mejora ni lo empeora. Arreglarlo es un spec aparte. |

## Lo que **no** está en este spec

- Pantalla o endpoint de administración para editar las reglas de descuento.
- Reglas de descuento en la base de datos o en una tabla de settings.
- Vigencia por fechas.
- Línea de "Descuento" desglosada en el resumen del carrito, el correo o la tabla `ordenes`.
- Descuentos por producto, por clave, por volumen o por cupón.
- Validación del monto cobrado contra el precio de la base de datos.
- Unificar el formateo de precio entre los ocho componentes que lo muestran.
- Autenticación del grupo `app/(admin)/`.

Cada uno, si se hace, va en su propio spec.
