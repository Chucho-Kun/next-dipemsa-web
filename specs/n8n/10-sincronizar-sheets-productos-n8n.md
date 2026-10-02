# SPEC 10 — Sincronizar Google Sheets con `productos_` vía n8n en Railway

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-01
> **Objetivo:** Sincronizar el Google Sheet de 12 columnas con la tabla `productos_` mediante un workflow n8n hospedado en Railway, con disparo manual, actualización solo de ids con cambios e informe dentro de n8n.

## Por qué existe este spec

El catálogo se edita hoy a mano y el `scripts/import-csv.ts` está roto (mapea `precioAnt` camelCase inexistente en el schema) además de hacer solo `INSERT`. Se necesita un camino repetible y auditable: editar el Sheet, pulsar un botón en n8n y que solo las filas cuyo contenido cambió toquen la base, con reporte visible en el propio n8n y sin correo.

## Alcance

**Dentro:**

- Workflow n8n nuevo en `n8n/productos-sync.workflow.json` (importable): `Manual Trigger → Google Sheets Read → Code Normalizar → Postgres SELECT ids+campos → Code Diff → Loop + Postgres UPSERT → Code Resumen`.
- Lectura del Sheet con las 12 columnas exactas del CSV (`id,clave,variante,descripcion,informacion,disponible,marca,categoria,existencias,precioant,precio,destacado`), fila 1 = headers en minúsculas.
- Detección de cambios: `SELECT` de las 12 columnas de `productos_`, comparación campo por campo en nodo `Code`, UPSERT solo de filas nuevas o con al menos un campo distinto.
- UPSERT por `id` con `ON CONFLICT (id) DO UPDATE` tocando solo las 11 columnas no-PK del Sheet; preserva `orden_prod, orden_cat, createdat, related_products, ficha`.
- Conversión de tipos mínima en `Code`: `existencias` a entero (`parseInt || 0`), `destacado` a booleano (`1/TRUE` → true), resto `trim()` o `NULL` si vacío. Precios se guardan **tal cual** vienen del Sheet (sin normalizar `$`).
- Política de errores: continuar con las demás filas y listar las fallidas (id vacío, duplicado en Sheet, fallo SQL) en el reporte.
- Reporte en el nodo final visible en Executions: `leidas, actualizadas, insertadas, sin_cambios, errores + detalle_errores`.
- Guía en `docs/sync-productos-guia.md`: credenciales Google OAuth (Sheets+Drive APIs) y Postgres Railway con SSL, cómo compartir el Sheet, backup previo y primera ejecución.

**Fuera de alcance (para specs futuros):**

- Disparo automático o programado (Schedule / Drive Trigger).
- Envío del reporte por correo (Gmail / Resend).
- DELETEs o marcado de no-disponible para ids ausentes en el Sheet.
- Normalización de precios a formato `"$88.24"` (se guardan tal cual; ver Riesgos).
- Bump automático de `version` en `src/store/cartStore.ts` (queda como paso manual documentado en la guía).
- Cambios en `slugToMarca/slugToCategory`, reglas de descuento o cualquier código de `app/` y `src/`.
- Tabla de auditoría en Postgres (el reporte vive solo en n8n).

## Modelo de datos

Este spec no modifica el schema (`productos_` no cambia) ni crea tablas. Introduce dos archivos nuevos en el repo:

```json
// n8n/productos-sync.workflow.json — workflow importable con 7 nodos:
// ManualTrigger, SheetsRead, CodeNormalizar, PostgresSelect, CodeDiff, LoopUpsert, CodeResumen
// El resumen final tiene esta forma:
{
  "leidas": 2433, "actualizadas": 12, "insertadas": 2,
  "sin_cambios": 2416, "errores": 3,
  "detalle_errores": [{ "id": "", "motivo": "id vacío" }]
}
```

```md
// docs/sync-productos-guia.md — credenciales, backup, ejecución y post-sync
// (bump cartStore, revisión de slugs si hay marcas/categorías nuevas)
```

Convenciones: `id` siempre texto con `trim()`; comparación diff exacta tras `trim()` (sin normalizar acentos/mayúsculas, porque el match de descuentos ya normaliza en lectura).

## Plan de implementación

1. **Crear el esqueleto del workflow.** Nuevo `n8n/productos-sync.workflow.json` con los 7 nodos vacíos y el `Manual Trigger` como único disparo. *Verificación:* el JSON importa en n8n sin errores de schema.
2. **Conectar lectura del Sheet.** Nodo Sheets con OAuth Google, documento/hoja/rango de las 12 columnas. *Verificación:* ejecución manual devuelve ~2433 items con los headers esperados.
3. **Implementar normalización.** Nodo `Code`: trim, `existencias` a int, `destacado` a bool, vacíos a NULL, precios tal cual; filas con `id` vacío o duplicado van a `errores`. *Verificación:* dry-run con 3 filas de prueba (válida, id vacío, duplicada) clasifica cada una correctamente.
4. **Implementar diff.** Nodo Postgres `SELECT` de las 12 columnas + nodo `Code` que compara campo por campo y emite solo `cambiadas + nuevas`. *Verificación:* segunda ejecución sin tocar el Sheet da `sin_cambios = leidas, actualizadas = 0`.
5. **Implementar UPSERT en loop.** `Loop Over Items` (lote 50) + `Execute Query` con `ON CONFLICT (id) DO UPDATE` de las 11 columnas, `onError: continue`. *Verificación:* contra tabla clon `productos__test`: 1 update, 1 insert y 1 error se aplican y reportan correctamente.
6. **Cerrar con resumen y guía.** Nodo `Code Resumen` con los 6 contadores + crear `docs/sync-productos-guia.md` (credenciales, backup `CREATE TABLE ... AS SELECT`, ejecución, post-sync manual). *Verificación:* `npm run lint` pasa; la guía permite a un tercero ejecutar el sync sin preguntar nada.

## Criterios de aceptación

- [ ] El JSON importa en el n8n de Railway sin errores.
- [ ] Ejecución manual contra `productos__test` con 1 update real cambia solo esa fila.
- [ ] Una fila con `id` nuevo en el Sheet inserta una fila nueva con `related_products='[]'` y órdenes en 0.
- [ ] Una segunda ejecución sin cambios reporta `actualizadas=0` e `sin_cambios=leidas`.
- [ ] Una fila con `id` vacío no detiene el flujo y aparece en `detalle_errores`.
- [ ] Un `id` en DB ausente en el Sheet queda intacto (sin UPDATE ni DELETE).
- [ ] `orden_prod, orden_cat, createdat, related_products, ficha` conservan su valor tras un UPDATE.
- [ ] El reporte final muestra los 6 campos (`leidas, actualizadas, insertadas, sin_cambios, errores, detalle_errores`).
- [ ] `docs/sync-productos-guia.md` existe y cubre credenciales, backup, ejecución y post-sync (bump cartStore).
- [ ] `npm run lint` pasa y ningún archivo de `app/` o `src/` fue modificado.

## Decisiones tomadas y descartadas

- **Sí:** disparo manual. Evita syncs a medias mientras se sigue editando el Sheet.
- **Sí:** `SELECT + compara en Code` para detectar cambios. Transparente y depurable frente a hash; además da el conteo `sin_cambios` gratis y clasifica update vs insert para el reporte.
- **Sí:** precios tal cual (pedido explícito). Cero transformación = cero sorpresas en el sync; el costo es posible inconsistencia de formato (`88.24` vs `$88.24`) que hoy ya existe en la tabla.
- **No:** normalizar precios a `"$X.XX"`. Descartado por decisión del usuario en Fase 2; si la inconsistencia molesta, va en otro spec.
- **Sí:** continuar ante errores y reportar. Un sync de 2433 filas no debe abortarse por una fila mala.
- **No:** DELETEs ni marcado de disponibles para ids ausentes. Protección contra borrados accidentales por un filtrado del Sheet.
- **Sí:** lote 50 en el loop. ~49 iteraciones evitan timeouts de Railway y permiten reanudar desde el lote fallido.
- **Sí:** entregable `n8n/ + docs/` (JSON importable + guía). Sin guía el workflow no es operable por un tercero.
- **No:** reporte por correo. Solo Executions de n8n, cero credenciales extra.
- **Sí:** bump de `cartStore` solo documentado, no automatizado. El workflow no toca el repo; el implementador no debe mezclar dominios.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Precios tal cual generan formatos mixtos (`88.24` vs `$88.24`) que `formatMoney`/`parsePrecio` muestran distinto | La guía exige formato con `$` en el Sheet; la inconsistencia se acepta y un spec futuro puede normalizar |
| `SELECT` completo de ~2433 filas en cada ejecución | Son solo 12 columnas de texto; cabe en memoria del nodo Code sin paginación. Si el catálogo crece 10x, paginar por `id` |
| Edición concurrente del Sheet durante la ejecución | Disparo manual + recomendación en guía de no editar durante los ~2 min del run; ejecuciones quedan registradas en Executions |
| Credencial Postgres con permisos de más | Guía pide usuario con solo `SELECT+INSERT+UPDATE` sobre `productos_` y SSL requerido |
| Primera ejecución contra producción sin red | Backup obligatorio (`CREATE TABLE productos__backup_yyyymmdd AS SELECT * FROM productos_`) + dry-run previo contra `productos__test` |

## Lo que **no** está en este spec

- Disparo automático o programado.
- Reporte por correo.
- Borrado o desactivado de productos ausentes en el Sheet.
- Normalización de formato de precios.
- Bump automático de versión del carrito.
- Cambios en código de la tienda, descuentos, slugs o SEO.
- Tabla de auditoría en Postgres.

Cada uno de estos, si se hace, va en su propio spec.
