# SPEC 09 — Orden de variantes por cantidad en el select de producto

> **Estado:** Implemented
> **Depende de:** —
> **Fecha:** 2026-09-15
> **Objetivo:** Ordenar de menor a mayor, por la cantidad que representan, las opciones del select "variantes disponibles" en la ficha de producto.

## Por qué existe este spec

El select de variantes en `ProductCard.tsx:194-206` se llena con el resultado de `getProductVariants` (`src/shared/db/queries.ts:159-176`), que hoy ordena con `orderBy(asc(productos.descripcion))` — orden alfabético sobre el string completo `"Nombre base | variante"`. Para variantes que representan una cantidad (`"5mm"`, `"25 piezas"`, `"100mm"`), el orden alfabético intercala mal: `"100mm"` queda antes que `"25mm"` porque `"1" < "2"` como caracter.

La columna `variante`/`descripcion` es texto libre y mezcla dos tipos de contenido en la parte después del `|`: cantidades (`"5mm"`, `"550ml (19oz)"`, `"25 piezas"`, `"3 ton"`, `"1/4.in"`, `"1 1/2"`) y variantes no numéricas (colores como `"Naranja"`/`"Amarillo"`/`"Blanco"`, o texto como `"tipo II 3 peldaños"`). No hay una columna separada que indique "esto es una cantidad" — hay que inferirlo del texto en tiempo de lectura.

## Alcance

**Dentro:**

- Nuevo archivo `src/utils/ordenarVariantes.ts` con una función `extraerCantidad` (interna) que intenta leer un número al inicio del texto de la variante (después del `|`), soportando enteros, decimales y fracciones simples (`"1/4"`, `"1 1/2"`), e ignorando cualquier unidad o texto que siga (`mm`, `ml`, `oz`, `ton`, `piezas`, etc.).
- La misma función exporta `ordenarVariantesPorCantidad<T>(variantes: T[]): T[]`, que ordena un arreglo de variantes con un único criterio: las que tienen cantidad extraíble van primero, ascendente por esa cantidad; las que no tienen cantidad extraíble van después, en orden alfabético entre ellas por el texto de la variante. Este único criterio cubre los tres casos posibles sin lógica especial: grupo 100% numérico (queda ascendente), grupo 100% no numérico (queda alfabético, igual que hoy), y grupo mixto (numéricas primero, no numéricas al final).
- `src/shared/db/queries.ts`, función `getProductVariants` (159-176): aplicar `ordenarVariantesPorCantidad` sobre el resultado de `aplicarDescuentoLista`, antes de devolverlo. El `orderBy(asc(productos.descripcion))` de la consulta SQL se mantiene como orden de entrada estable, pero el orden final que ve el select lo define el nuevo helper.
- La extracción de cantidad lee siempre la parte después del `|` (`descripcion.split('|')[1]`), no el nombre base completo — el nombre base puede tener números irrelevantes para el orden (ej. `"Rotomartillo 1/2' 750 W"`).

**Fuera de alcance (para specs futuros):**

- El bug ya anotado en el SPEC 07 sobre `variants.sort` en `getProductsByGroupsofTrademarks`/`getProductsByGroupsofCategories` (`queries.ts:67-70`, `118-120`), que ordena por `parseFloat(precio)` sobre un string tipo `"$1,110.25"` (da `NaN`, no ordena nada). Es un select/listado distinto (tarjetas agrupadas en `/marca/[slug]` y `/categoria/[slug]`), y ordena por precio, no por la cantidad de la variante.
- Cualquier cambio a la columna `variante`/`descripcion` en la base de datos, o a cómo se separan nombre base y variante (`split('|')`).
- Una lista de unidades reconocidas o normalización de unidades (ej. convertir `"1000ml"` y `"1L"` a la misma magnitud). El helper solo lee el número inicial, no interpreta ni convierte unidades.
- Cambios visuales al select en `ProductCard.tsx` — el componente sigue recibiendo el arreglo `variantes` tal cual y renderizándolo en el orden que llega.
- Ordenar por cantidad en cualquier otro listado (buscador, relacionados, recomendados, feeds XML) — ninguno de esos usa `getProductVariants`.

## Modelo de datos

Esta spec no introduce columnas ni tablas nuevas. Agrega una función pura en `src/utils/ordenarVariantes.ts`:

```ts
// extraerCantidad("5mm") → 5
// extraerCantidad("1 1/2") → 1.5
// extraerCantidad("1/4.in") → 0.25
// extraerCantidad("Naranja") → null
function extraerCantidad(texto: string): number | null { /* ... */ }

export function ordenarVariantesPorCantidad<T extends { descripcion?: string | null }>(
  variantes: T[]
): T[] { /* ... */ }
```

`ordenarVariantesPorCantidad` no muta el arreglo recibido; devuelve uno nuevo ordenado.

## Plan de implementación

1. **Crear el helper de orden.** Nuevo archivo `src/utils/ordenarVariantes.ts` con `extraerCantidad` y `ordenarVariantesPorCantidad`, siguiendo el patrón de funciones sueltas del proyecto (como `src/utils/aplicarDescuento.ts`).
   *Verificación:* `npm run lint` pasa. Revisar a mano que `extraerCantidad` da el resultado esperado para los ejemplos reales encontrados en `src/respaldo/productos.csv`: `"5mm"` → `5`, `"25 piezas"` → `25`, `"3 ton"` → `3`, `"1/4.in"` → `0.25`, `"550ml (19oz)"` → `550`, `"Naranja"` → `null`.

2. **Aplicar el helper en `getProductVariants`.** En `src/shared/db/queries.ts:159-176`, envolver el resultado de `aplicarDescuentoLista(...)` con `ordenarVariantesPorCantidad(...)` antes de retornarlo.
   *Verificación:* con `npm run dev`, abrir la ficha de un producto con variantes numéricas (ej. una escalera con variantes de peldaños, o brocas por cantidad de piezas) y confirmar que el select "variantes disponibles" queda ordenado de menor a mayor. Abrir la ficha de un producto con variantes de color (ej. el casco de seguridad `"Naranja"`/`"Amarillo"`/`"Blanco"`) y confirmar que el orden alfabético no cambió.

## Criterios de aceptación

- [ ] `src/utils/ordenarVariantes.ts` existe y exporta `ordenarVariantesPorCantidad`.
- [ ] `extraerCantidad` da el número correcto para: `"5mm"` → `5`, `"25 piezas"` → `25`, `"3 ton"` → `3`, `"1/4.in"` → `0.25`, `"1 1/2"` → `1.5`, `"550ml (19oz)"` → `550`.
- [ ] `extraerCantidad` devuelve `null` para variantes sin número al inicio (ej. `"Naranja"`, `"tipo II 3 peldaños"` — este último empieza con texto, no con número).
- [ ] Un grupo de variantes 100% numéricas queda ordenado ascendente por esa cantidad.
- [ ] Un grupo de variantes 100% no numéricas queda en el mismo orden alfabético que hoy.
- [ ] Un grupo mixto (algunas con número, otras sin) muestra primero las numéricas ascendentes y después las no numéricas en orden alfabético.
- [ ] `getProductVariants` en `queries.ts` devuelve el arreglo ya ordenado por el nuevo criterio, sin que `ProductCard.tsx` necesite cambios.
- [ ] `npm run lint` pasa.
- [ ] Verificación manual en `npm run dev`: al menos un producto con variantes numéricas y uno con variantes de color confirman el comportamiento esperado.

## Decisiones tomadas y descartadas

- **Sí:** ordenar en JS después de traer las filas, no en SQL. Parsear fracciones (`"1/4"`, `"1 1/2"`) y unidades arbitrarias con una expresión Postgres sería frágil e ilegible; ya existe precedente de lógica de datos en JS dentro de `queries.ts` (agrupación por nombre base, `aplicarDescuentoLista`).
- **Sí:** extraer la cantidad solo de la parte después del `|`, no de `descripcion` completa. Evita enganchar números del nombre base que no son la cantidad de la variante (ej. `"750 W"`, `"1/2'"` en el nombre de un rotomartillo).
- **Sí:** un único criterio de orden (`cantidad ascendente, luego alfabético`) para los tres casos (todo numérico, nada numérico, mixto), en vez de tres ramas de lógica separadas. Es el comportamiento más simple que cumple lo pedido y no rompe el caso ya existente de variantes no numéricas.
- **No:** normalizar o convertir unidades (ej. `"1L"` vs `"1000ml"`). Fuera de lo pedido; el catálogo no tiene unidades consistentes por producto como para que la conversión sea confiable.
- **No:** incluir el fix del `variants.sort` por precio roto en `getProductsByGroupsofTrademarks`/`getProductsByGroupsofCategories` (anotado en SPEC 07). Es un listado y un bug distintos — precio, no cantidad de variante — y merece su propio spec.
- **No:** tocar el `orderBy(asc(productos.descripcion))` de la consulta SQL en `getProductVariants`. Se deja como orden de entrada estable; el orden visible lo decide el nuevo helper en JS.

## Qué **no** está en este spec

- El fix del orden roto por precio en las tarjetas agrupadas de `/marca/[slug]` y `/categoria/[slug]` (SPEC 07, fuera de alcance, sigue pendiente para otro spec).
- Normalización o conversión de unidades de medida.
- Cambios visuales o de comportamiento en `ProductCard.tsx` más allá de recibir el arreglo ya ordenado.
- Orden por cantidad en buscador, relacionados, recomendados o feeds XML.

Cada uno de estos, si se necesita, va en su propio spec.
