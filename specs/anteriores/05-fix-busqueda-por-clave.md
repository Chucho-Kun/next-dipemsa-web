# SPEC 05 — Fix: búsqueda por clave inconsistente en el buscador del header

> **Estado:** Aprovado
> **Depende de:** —
> **Fecha:** 2026-08-21
> **Objetivo:** Corregir que `SearchBar.tsx` esconda del listado visual productos que la API sí encuentra por `clave` o `marca`, para que buscar por clave funcione de forma consistente para todos los productos.

## Por qué existe este spec

El usuario reportó que el buscador "solo encuentra resultados por descripción" y que, buscando por `clave`, algunos productos aparecen y otros no. La investigación de código y de datos reales (442 filas de `productos_`) descarta las causas más obvias:

1. **`app/api/search/route.ts` ya busca por `clave`, `descripcion` y `marca`** (`or(ilike(...))`, líneas 22-28), con un `ORDER BY CASE` que prioriza coincidencias de `clave` (líneas 29-37). No es un cambio pendiente: se agregó en julio (commits `3974b56` y `cb9d99c`) y ya está en `main`.
2. **No hay `clave` nula ni vacía** en la base de datos real — las 442 filas tienen un valor. Solo 2 filas tienen espacios extra al final, algo que `ILIKE '%término%'` igual matchea sin problema.

La causa real está en el cliente: `SearchBar.tsx` usa `Command.Dialog` de la librería `cmdk` (v1.1.1) sin pasar `shouldFilter={false}`. Por defecto, `cmdk` **vuelve a filtrar** los `Command.Item` ya renderizados comparando el texto escrito contra la prop `value` de cada uno — y ese `value` es `product.descripcion` (`SearchBar.tsx:98`), no `clave` ni `marca`.

Es decir: el servidor sí devuelve el producto cuando la coincidencia fue por `clave`, pero `cmdk` lo esconde de la lista si el texto buscado no aparece también, aunque sea parcialmente, dentro de `descripcion`. Esto explica el síntoma exacto reportado: la clave "funciona" solo cuando por casualidad también coincide con algo del texto de la descripción, y falla en el resto de los casos. El usuario confirmó haber reproducido esto probando claves reales en el buscador del sitio.

Efecto secundario del mismo bug: el mensaje "No se encontraron resultados para X" (`SearchBar.tsx:88-93`) se calcula sobre `results.length` (la respuesta cruda de la API), no sobre lo que `cmdk` termina renderizando — así que hoy es posible ver una lista vacía sin ningún mensaje, cuando `cmdk` esconde todos los resultados que la API sí trajo. Este spec lo corrige como consecuencia directa del fix, sin tocarlo por separado.

## Alcance

**Dentro:**

- `src/shared/components/header/SearchBar.tsx`:
  - Agregar `shouldFilter={false}` a `Command.Dialog` para que se confíe por completo en los resultados y el orden que ya calcula el servidor (`clave` > `descripcion` > `marca`, luego `destacado`), en vez de dejar que `cmdk` los vuelva a filtrar/ordenar en el cliente usando solo `descripcion`.
  - Agregar `clave: string` al tipo `ProductSearch` (línea 11-17).
  - Mostrar la `clave` del producto en cada resultado de la lista, junto al resto de la info (`descripcion`, variante, `marca`, precio).

**Fuera de alcance (explícito):**

- Cualquier cambio en `app/api/search/route.ts` — la búsqueda por `clave`, `descripcion` y `marca` en el servidor ya funciona correctamente y no se toca.
- El mínimo de 3 caracteres para disparar la búsqueda en el backend (`route.ts:9`) y el de 2 caracteres en el frontend (`SearchBar.tsx:28`).
- El límite de 15 resultados (`route.ts:38`).
- Agregar `keywords` a `Command.Item` como alternativa a `shouldFilter={false}` — se evaluó y se descartó (ver Decisiones).
- Cualquier otro componente de búsqueda: `cmdk` solo se usa en este archivo en todo el proyecto (verificado con grep), así que no hay otro lugar con el mismo bug.

## Modelo de datos

Este spec no introduce estructuras nuevas ni cambios de schema. Único cambio de tipos: agregar el campo `clave` (ya devuelto por la API, ya existe en la tabla) al tipo `ProductSearch` en el cliente:

```ts
type ProductSearch = {
  id: string;
  clave: string;
  descripcion: string;
  precioant: string;
  precio: string;
  marca: string;
};
```

## Plan de implementación

1. **Agregar `clave` al tipo `ProductSearch`.** En `SearchBar.tsx:11-17`, añadir `clave: string;` al tipo. La API (`route.ts:14-19`) ya selecciona y devuelve ese campo, así que no requiere ningún cambio de backend.
   *Verificación:* `npm run lint` sin errores de tipos.

2. **Desactivar el re-filtrado de `cmdk`.** En `SearchBar.tsx:54-59`, agregar la prop `shouldFilter={false}` a `Command.Dialog`.
   *Verificación:* con `npm run dev`, abrir el buscador y probar con la clave exacta de un producto tomado directo de la BD (ej. vía `npm run db:studio`) — debe aparecer en la lista. Repetir con una clave parcial (subcadena) y confirmar que también aparece.

3. **Mostrar la clave en cada resultado.** En el bloque de cada `Command.Item` (`SearchBar.tsx:108-128`), agregar la clave del producto visible junto a la descripción/marca/precio ya mostrados.
   *Verificación visual:* cada fila de resultados muestra su clave.

4. **Verificación de regresión y cierre.** Probar en el navegador:
   - Buscar por texto de `descripcion` (como ya funcionaba) — sigue apareciendo el producto correcto.
   - Buscar por `marca` — sigue funcionando.
   - Buscar un término que no matchea nada real — aparece el mensaje "No se encontraron resultados para X" (ya no puede quedar una lista vacía sin mensaje, porque `results.length` y lo renderizado ahora son siempre lo mismo).
   - Navegar la lista de resultados con flechas de teclado y `Enter` — sigue funcionando y sigue navegando al producto correcto.
   - Correr `npm run lint` y `npm run build`.

## Criterios de aceptación

- [ ] Buscar por la clave exacta de cualquier producto de la base real lo muestra en la lista de resultados del buscador.
- [ ] Buscar por una subcadena parcial de una clave también lo encuentra.
- [ ] Buscar por texto de la descripción del producto sigue funcionando igual que antes del cambio.
- [ ] Buscar por marca sigue funcionando igual que antes del cambio.
- [ ] Cada resultado de la lista muestra la clave del producto, además de lo que ya se mostraba.
- [ ] El orden de los resultados (clave > descripción > marca, luego destacados) se mantiene igual que el que ya calcula el servidor.
- [ ] El mensaje "No se encontraron resultados para X" aparece si y solo si la API devuelve 0 resultados — no puede haber una lista vacía sin mensaje.
- [ ] La navegación por teclado (flechas + Enter) y el clic en un resultado siguen llevando al producto correcto.
- [ ] `npm run lint` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** `shouldFilter={false}` en `Command.Dialog`, en vez de agregar `keywords={[product.clave, product.marca]}` a cada `Command.Item`. Es un cambio de una sola línea que elimina el doble filtrado por completo (servidor + cliente), en vez de mantener dos capas de filtrado que hay que mantener sincronizadas. Además preserva exactamente el orden ya calculado por el servidor (`CASE` de `route.ts`), sin que `cmdk` lo recalcule con su propio score de relevancia.
- **Sí:** mostrar la `clave` en cada resultado — confirmado por el usuario, ayuda a verificar visualmente que el producto encontrado es el correcto.
- **No:** tocar el backend (`route.ts`). Ya busca y prioriza correctamente por `clave`; el bug está exclusivamente en el filtrado duplicado del cliente.
- **No:** tocar los umbrales de longitud mínima (2 en frontend, 3 en backend) ni el límite de 15 resultados — el usuario confirmó dejarlos fuera de alcance.
- **No:** arreglar el mensaje de "sin resultados" como un cambio separado — es un efecto secundario directo del mismo bug (usa `results.length`, no lo que `cmdk` renderiza) y se resuelve solo al desactivar el re-filtrado.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `shouldFilter={false}` también desactiva el scoring/orden automático de `cmdk`, no solo el filtrado | Es el comportamiento buscado: el orden ya lo decide el `ORDER BY CASE` del servidor: no se pierde nada, se evita que `cmdk` lo pise con su propio criterio. |
| Algún consumidor interno de `cmdk` (atajos de teclado, accesibilidad) dependa del filtrado automático | La navegación por teclado y el resaltado de `cmdk` operan sobre los `Command.Item` ya renderizados, no sobre su lógica de filtrado — no se ve afectada por `shouldFilter`. Se verifica manualmente en el paso 4 del plan. |
| Mostrar la `clave` cambia el layout visual del resultado y rompe el diseño en pantallas chicas | Cambio visual acotado a una línea de texto adicional; se verifica visualmente en `npm run dev` antes de cerrar. |
