# Guía de sincronización: Google Sheet → `productos_` vía n8n (SPEC 10)

Esta guía deja operar el sync a cualquier persona con acceso al Sheet y al n8n de Railway, sin preguntar nada.

## 1. Qué hace

El workflow `n8n/productos-sync.workflow.json` (disparo **manual**) lee el Google Sheet del catálogo, normaliza las filas,
compara contra la tabla `productos_` y hace UPSERT **solo** de los ids nuevos o con al menos un campo distinto.
Al final deja un reporte en la pestaña **Executions** de n8n con 6 campos:

```json
{ "leidas": 2433, "actualizadas": 12, "insertadas": 2, "sin_cambios": 2416, "errores": 3, "detalle_errores": [...] }
```

Flujo: `ManualTrigger → SheetsRead → CodeNormalizar → PostgresSelect → CodeDiff → LoopUpsert (lote 50) → PostgresUpsert → CodeResumen`.

El UPSERT toca **solo** las 12 columnas del Sheet (`id` + 11 no-PK). Jamás toca
`orden_prod, orden_cat, createdat, related_products` ni `ficha`. Los ids que están en la DB pero no en el Sheet
quedan intactos (no hay DELETEs).

## 2. Requisitos

- Acceso de edición al Google Sheet del catálogo.
- Acceso al n8n hospedado en Railway (URL + usuario del equipo).
- Acceso de lectura a la base Postgres de Railway (para el backup y el dry-run).
- El repo clonado (para importar el JSON y para el post-sync del paso 9).

## 3. Preparar el Google Sheet

1. La **fila 1** debe tener exactamente estos headers en minúsculas, en este orden:
   `id, clave, variante, descripcion, informacion, disponible, marca, categoria, existencias, precioant, precio, destacado`
   (son las mismas 12 columnas de `productos.csv`).
2. Reglas de formato por columna:
   - `id`: texto, **obligatorio y único**. Filas con `id` vacío o duplicado se reportan como error y no se sincronizan.
   - `existencias`: número entero (si va vacío se guarda `0`).
   - `destacado`: `1` o `TRUE` para verdadero; cualquier otra cosa (incluido vacío) es falso.
   - `precio` y `precioant`: **siempre con `$`** (ej. `$88.24`, no `88.24`). El sync guarda los precios tal cual vienen,
     sin normalizar; si les falta el `$`, la tienda los muestra distinto.
   - El resto: texto libre; las celdas vacías se guardan como `NULL`.
3. No dejes filas totalmente vacías entre datos y no reordenes ni renombres las columnas.
4. Comparte el Sheet con la cuenta de Google que usa n8n (permiso **Lector** basta) o con la cuenta de servicio que te indique el equipo.

## 4. Credencial de Google en n8n (una sola vez)

1. En n8n ve a **Credentials → New → Google Sheets OAuth2 API** (sirve también para Drive) y completa el flujo OAuth
   con la cuenta que tiene acceso al Sheet.
2. En el proyecto de Google Cloud habilita **Google Sheets API** y **Google Drive API**.
3. En el nodo `SheetsRead` selecciona esa credencial, el **Document** (el Sheet del catálogo) y la **Sheet**
   (la pestaña principal). Ya viene con `headerRow = 1` y `firstDataRow = 2`; no los cambies.

## 5. Credencial de Postgres en n8n (una sola vez)

1. En Railway abre el servicio de Postgres → pestaña **Connect** y copia host, puerto, usuario, contraseña y base.
2. En n8n crea la credencial **Postgres** con esos datos y activa **SSL** (la conexión de Railway lo exige).
3. Pide al equipo un usuario con permisos mínimos: solo `SELECT`, `INSERT` y `UPDATE` sobre `productos_`
   (y sobre `productos__test` para el dry-run). No uses el superusuario en el workflow.
4. Asigna esa credencial en los nodos `PostgresSelect` y `PostgresUpsert`.

## 6. Backup obligatorio antes de cada sync a producción

Corre esto contra la base (psql, TablePlus o el cliente que uses; cambia la fecha):

```sql
CREATE TABLE productos__backup_20261001 AS SELECT * FROM productos_;
```

Para restaurar (solo si algo salió mal y con el equipo enterado):

```sql
-- Verifica primero cuántas filas trae cada tabla, luego:
TRUNCATE productos_;
INSERT INTO productos_ SELECT * FROM productos__backup_20261001;
```

No borres la tabla de backup hasta que la tienda se haya verificado después del sync.

## 7. Importar y configurar el workflow (una sola vez)

1. En n8n: **Workflows → Import from File** y sube `n8n/productos-sync.workflow.json` del repo.
2. Abre `SheetsRead` y fija credencial, Document y Sheet (paso 4).
3. Abre `PostgresSelect` y `PostgresUpsert` y fija la credencial Postgres (paso 5).
4. Guarda el workflow (puede quedar inactivo; siempre se lanza con **Execute Workflow** manual).

## 8. Dry-run contra `productos__test` (obligatorio la primera vez)

1. Crea el clon (una vez): `CREATE TABLE productos__test (LIKE productos_ INCLUDING ALL);`
2. En los nodos `PostgresSelect` y `PostgresUpsert` cambia temporalmente `productos_` por `productos__test`
   (solo el nombre de la tabla en el `SELECT` y en el `INSERT ... ON CONFLICT`, nada más).
3. Ejecuta el workflow y confirma en Executions:
   - Un `id` nuevo del Sheet aparece en `productos__test` con `orden_prod = 0` y `related_products = []`.
   - Una segunda ejecución sin tocar el Sheet reporta `actualizadas = 0` y `sin_cambios = leidas`.
4. Elimina el clon: `DROP TABLE productos__test;` y regresa los dos nodos a `productos_`.

## 9. Ejecución en producción

1. Avisa al equipo y **no editen el Sheet durante los ~2 min** que dura el run (son ~2433 filas en lotes de 50).
2. En n8n abre el workflow y pulsa **Execute Workflow**.
3. Al terminar, abre la ejecución en **Executions → CodeResumen** y lee el reporte:
   - `leidas`: filas leídas del Sheet. Si es mucho menor a ~2433, revisa que el rango del Sheet esté completo.
   - `actualizadas` / `insertadas`: UPSERTs intentados (update vs insert).
   - `sin_cambios`: filas que ya estaban iguales. Debe cumplirse `actualizadas + insertadas + sin_cambios + errores_norm = leidas`.
   - `errores` y `detalle_errores`: cada entrada trae `id`, `motivo` (`id vacío`, `duplicado en Sheet: X` o `sql: ...`)
     y `fila_sheet` (número de fila del Sheet para corregirla). Los errores **no detienen** el flujo:
     las filas buenas sí se sincronizan.
4. Si `detalle_errores` trae entradas `sql: ...`, repórtalas al equipo antes de reintentar.

## 10. Post-sync manual (no se te olvide)

El workflow no toca el repo; esto lo haces tú después de cada sync con cambios reales:

1. **Carrito**: sube `version` en `src/store/cartStore.ts` (hoy en `1`) y haz commit + redeploy, para que los carritos
   guardados en `localStorage` (`dipemsa-cart`) no cobren precios viejos.
2. **Slugs**: si el Sheet trae marcas o categorías nuevas con formato especial (acentos, mayúsculas raras),
   agrégalas a `slugToMarca` / `slugToCategory` en `src/shared/db/queries.ts`; si no, esas páginas quedan mal ligadas.
3. **Descuentos (SPEC 07)**: si cambiaron precios de marcas/categorías con regla de descuento, verifica que el precio
   resultante en tienda sea el esperado (el descuento se aplica en lectura, no en la DB).

## 11. Errores comunes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `SheetsRead` devuelve 0 filas | Document/Sheet mal seleccionado o sin permiso | Revisa pasos 3–4; confirma que la cuenta de la credencial puede abrir el Sheet |
| `leidas` mucho menor a lo esperado | Fila 1 sin los 12 headers o filas vacías intermedias | Normaliza headers y compacta el Sheet |
| Todo sale `sin_cambios` aunque editaste precios | Precio con formato distinto (`88.24` vs `$88.24`) que sí coincide, o editaste fuera del rango leído | Revisa el `detalle` y el rango de la pestaña |
| `sql: null value in column "id"` | Fila con `id` vacío que pasó como update (no debería) | Repórtala; las demás filas sí se aplicaron |
| Falla la conexión Postgres | SSL apagado o credenciales/usuario sin permisos | Revisa paso 5 |

## 12. Lo que este sync NO hace (a propósito)

Disparo automático o programado, reporte por correo, borrado/desactivado de productos ausentes en el Sheet,
normalización de precios, bump automático del carrito, cambios en código/descuentos/slugs/SEO ni tabla de auditoría.
Cada cosa de esas va en su propio spec.
