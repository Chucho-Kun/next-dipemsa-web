# SPEC 10 — Fecha y hora reales de la compra en el correo de confirmación

> **Estado:** Approved
> **Depende de:** SPEC 06 (tabla `ordenes`, usada solo para verificar)
> **Fecha:** 2026-10-23
> **Objetivo:** Mostrar en la línea "Fecha:" del correo de confirmación el instante real del pago convertido a hora de Ciudad de México, sin depender de la zona horaria ni del reloj del servidor.

## Por qué existe este spec

La línea `Fecha:` del correo se arma en `app/api/send-email/route.ts:61` con `new Date().toLocaleString('es-MX')`.
Esa llamada no declara `timeZone`, así que `Intl` usa la zona del proceso.
En Railway el proceso corre en UTC, por lo que un pago hecho a las 18:45 en Ciudad de México se muestra como 00:45 del día siguiente.
El correo se dispara en segundo plano desde `src/shared/components/cart/MercadoPagoBrick.tsx:164-180`, justo después de que `POST /api/mercadopago/process-payment` responde con un pago aprobado o pendiente.
Mercado Pago ya devuelve el instante real del pago en `PaymentResponse.date_created` (ISO 8601 con offset), pero `process-payment/route.ts` no lo reenvía al cliente.
El ISO con offset representa un instante absoluto: se convierte a CDMX tal cual, sin sumar ni restar horas al string.

## Alcance

**Dentro:**

- Nuevo helper `src/utils/formatDate.ts` con la función `formatearFechaHoraCDMX`, que formatea cualquier instante en la zona IANA `America/Mexico_City` y devuelve el string `"dd/mm/aaaa, HH:mm hrs (CDMX)"`.
- `app/api/mercadopago/process-payment/route.ts:135-139`: agregar `date_created` a la respuesta JSON, tomado de `response.date_created` (fallback `response.date_approved`).
- `src/shared/components/cart/MercadoPagoBrick.tsx:164-180`: incluir `createdAt: result.date_created ?? null` dentro de `orderData` del payload que se manda a `/api/send-email`.
- `app/api/send-email/route.ts:61`: normalizar `orderData.createdAt` (si viene vacío, ausente o no es string, usar `Date.now()`) y renderizar `formatearFechaHoraCDMX(fechaPago)`.
- El correo sigue enviándose en segundo plano, sin bloquear la respuesta del pago (`keepalive: true` se mantiene).

**Fuera de alcance (para specs futuros):**

- Cambiar la zona horaria del contenedor o de Railway; el formateo es explícito y no depende del entorno.
- Modificar `ordenes.createdat`, su valor por defecto en PostgreSQL o cualquier migración.
- Mostrar la fecha en otras pantallas (página de pago exitoso, dashboard, WhatsApp) — hoy ninguna muestra fecha.
- El botón de prueba comentado en `WhatsAppButton.tsx:35-92` y la llamada comentada en `PagoExitosoContent.tsx:54`; no se reactivan.
- Agregar un runner de tests (`jest`/`playwright` siguen sin configuración activa).
- Mover el envío del correo al servidor (`process-payment`) o hacer que `send-email` consulte el pago por `paymentId`. Se mantiene el flujo fire-and-forget actual (ver *Decisiones*).
- El límite de ~64 KB de `keepalive: true` en el POST del correo; es un riesgo pre-existente y un carrito grande podría excederlo.

## Modelo de datos

Esta spec no introduce tablas, columnas ni migraciones. Agrega un campo al payload del correo y una función pura:

```ts
// Payload POST /api/send-email (createdAt es el campo nuevo)
{
  orderData: {
    paymentId: string,
    /** ISO 8601 con offset, tal como lo devuelve Mercado Pago, ej. "2026-10-23T22:45:12.000-04:00" */
    createdAt?: string | null,
    items: Array<{ id, titulo, descripcion, cantidad, precio }>,
    subtotal: number,
    shipping: number,
    total: number,
  },
  customerEmail: string,
  deliveryData: { nombre, apellidos, direccion, entreCalles, ciudad, cp, telefono },
}
```

```ts
// src/utils/formatDate.ts
const ZONA_CDMX = 'America/Mexico_City';
const formatterCDMX = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_CDMX,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// formatearFechaHoraCDMX('2026-10-23T22:45:12.000-04:00') → "23/10/2026, 20:45 hrs (CDMX)"
// formatearFechaHoraCDMX(null)                             → "—"
// formatearFechaHoraCDMX('2026-10-23 22:45:12')            → "—" (sin offset, ambiguo)
export function formatearFechaHoraCDMX(
  valor: string | number | Date | null | undefined
): string;
```

Reglas del helper:

- `null`, `undefined`, `''`, strings de solo espacios y fechas inválidas devuelven `"—"` (nunca `Invalid Date`).
- Un string ISO **sin** designador de zona (`Z` o `±hh:mm`) devuelve `"—"`. `new Date()` lo interpretaría en la zona del proceso y en Railway (UTC) produciría un error de 6 horas.
- Acepta `Date` y `number` (epoch ms) además de string ISO con offset.
- Usa el `formatterCDMX` de nivel de módulo, no uno nuevo por llamada.
- Compone el string con `formatToParts` para fijar el orden `dd/mm/aaaa, HH:mm` y evitar variantes de ICU.
- No muta nada y no depende del navegador ni de la zona del proceso.

## Plan de implementación

1. **Crear `src/utils/formatDate.ts`.** Implementar `formatearFechaHoraCDMX` con el formatter a nivel de módulo, siguiendo el estilo de funciones sueltas de `src/utils/formatPrice.ts`.
   *Verificación:* con `npx tsx -e` (el repo ya usa `tsx` en `npm run import:csv`), comprobar el string exacto y que `TZ=UTC` y `TZ=America/Mexico_City` producen lo mismo; `null`, `''` y `'2026-10-23 22:45:12'` devuelven `"—"`.

2. **Devolver el instante del pago en `process-payment`.** En `app/api/mercadopago/process-payment/route.ts:135-139`, agregar `date_created: response.date_created ?? response.date_approved ?? null` al `NextResponse.json`.
   *Verificación:* un pago de prueba aprobado en `npm run dev` responde con `date_created` en formato ISO con offset; un pago pendiente (`in_process`) también lo incluye; uno rechazado no rompe los `status_detail` que ya maneja el brick.

3. **Propagar `createdAt` al correo.** En `src/shared/components/cart/MercadoPagoBrick.tsx:164-180`, agregar `createdAt: result.date_created ?? null` a `orderData`.
   *Verificación:* en la pestaña Network de DevTools, el `POST /api/send-email` incluye `orderData.createdAt` con el ISO del pago.

4. **Formatear en la ruta del correo.** En `app/api/send-email/route.ts:61`, normalizar y renderizar:

   ```ts
   const fechaPago = typeof orderData.createdAt === 'string' && orderData.createdAt.trim()
     ? orderData.createdAt
     : Date.now();
   ```

   La línea queda como `Fecha: ${formatearFechaHoraCDMX(fechaPago)}`.
   *Verificación:* `npm run dev` con `TZ=UTC npm run dev`, comprar con tarjeta de prueba aprobada, y confirmar que el correo muestra la hora de Ciudad de México, no UTC ni UTC+1 día. Repetir con el payload sin `createdAt` y confirmar que no aparece `"—"`.

5. **Pasar build y lint.** `npm run build` y `npm run lint` sin errores nuevos.
   *Verificación:* ambos comandos terminan en 0.

## Criterios de aceptación

- [ ] `src/utils/formatDate.ts` existe y exporta `formatearFechaHoraCDMX`.
- [ ] `formatearFechaHoraCDMX('2026-10-23T22:45:12.000-04:00')` devuelve exactamente `"23/10/2026, 20:45 hrs (CDMX)"`.
- [ ] El mismo ISO produce el mismo string ejecutando el proceso con `TZ=UTC` y con `TZ=America/Mexico_City`.
- [ ] `formatearFechaHoraCDMX(null)`, `(undefined)`, `('')`, `('   ')` y `('no-es-fecha')` devuelven `"—"`.
- [ ] `formatearFechaHoraCDMX('2026-10-23 22:45:12')` devuelve `"—"` (string sin offset no se interpreta).
- [ ] `formatearFechaHoraCDMX(Date.now())` devuelve un string con el formato `dd/mm/aaaa, HH:mm hrs (CDMX)`.
- [ ] La respuesta de `POST /api/mercadopago/process-payment` incluye `date_created` con el ISO 8601 de Mercado Pago.
- [ ] Un pago pendiente (`in_process`) también responde con `date_created` y su correo muestra la fecha del pago, no la de aprobación.
- [ ] El `POST /api/send-email` disparado desde el checkout incluye `orderData.createdAt`.
- [ ] La línea `Fecha:` del correo de una compra aprobada coincide (margen ±1 minuto) con la hora de Ciudad de México de la fila correspondiente en `ordenes`, **cuando la fila existe**:

  ```sql
  SELECT createdat AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City'
  FROM ordenes
  WHERE mp_payment_id = '<payment_id>';
  ```

- [ ] Si `orderData.createdAt` llega ausente, vacío o inválido, el correo se envía igual, muestra el instante de envío formateado en CDMX y nunca muestra `"—"`.
- [ ] `npm run build` y `npm run lint` pasan.
- [ ] No se ejecutan migraciones ni se altera la tabla `ordenes`.

## Decisiones tomadas y descartadas

- **Sí:** usar `date_created` de Mercado Pago como fuente de la fecha. Es el instante autoritativo del pago y responde a "la hora en que se generó la compra"; no depende del reloj del servidor ni del navegador. Si falta, `date_approved`, luego `Date.now()`.
- **Sí:** convertir siempre desde el instante ISO (que trae offset), nunca ajustar el string sumando o restando horas. Mercado Pago puede devolver el offset `-04:00` de sus servidores aunque la compra sea en México; el instante absoluto sigue siendo correcto.
- **Sí:** rechazar strings sin designador de zona (`Z` o `±hh:mm`). `new Date()` los interpreta en la zona del proceso y en Railway (UTC) daría 6 horas de error silencioso.
- **Sí:** nombrar el campo `createdAt` y no `fechaPago`. `orderData` ya usa `paymentId`/`subtotal`/`shipping`/`total` y `orderSnapshot.ts` ya usa `createdAt`; el payload queda consistente.
- **Sí:** pasar la fecha desde `process-payment` hacia el brick y de ahí al correo. El brick ya recibe la respuesta del pago y el correo ya viaja con `orderData`; no hace falta consultar la API ni la BD de nuevo.
- **Sí:** zona IANA `America/Mexico_City` en vez de un offset fijo `-06:00`. Ciudad de México abandonó el horario de verano en 2022, pero la zona IANA resuelve correctamente fechas históricas y cambios futuros sin tocar código.
- **Sí:** helper reutilizable en `src/utils/formatDate.ts` en vez de formatear inline en la ruta. Sigue el patrón de `src/utils/formatPrice.ts` y sirve para el siguiente punto que necesite fecha (ticket, página de éxito, dashboard).
- **Sí:** un solo `Intl.DateTimeFormat` a nivel de módulo. Crear el formatter por llamada no aporta nada y repetirlo en cada correo es trabajo gratuito.
- **Sí:** formato `"23/10/2026, 20:45 hrs (CDMX)"`. Es 24 h, sin segundos (irrelevantes en un recibo) y la etiqueta CDMX elimina la ambigüedad para el comprador.
- **Sí:** `hourCycle: 'h23'` y `formatToParts`. Evita que ICU devuelva `"24:00"` a medianoche o reordene las partes según la versión de Node.
- **Sí:** fallback a `Date.now()` solo si Mercado Pago no devuelve una fecha válida. El correo sale segundos después del pago, así que el margen de error es mínimo y nunca se rompe el envío.
- **No:** cambiar `TZ` del contenedor en Railway. Sería una dependencia invisible del entorno y afectaría todo el proceso, no solo el correo.
- **No:** usar `date-fns`/`dayjs`. No están instalados y `Intl` con `timeZone` cubre el caso sin dependencias nuevas.
- **No:** leer `ordenes.createdat`. Implicaría una consulta extra desde la ruta del correo y esa ruta hoy no toca la BD a propósito; además `createdat` se registra en el servidor, no en Mercado Pago.
- **No:** mover el envío del correo a `process-payment` ni hacer que `send-email` consulte el pago por `paymentId`. Mantiene el flujo fire-and-forget actual y evita una llamada extra a Mercado Pago; el costo es que la fecha viaja por el cliente y un cliente modificado podría falsearla (riesgo aceptado en un correo de confirmación).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Mercado Pago devuelve un timestamp sin offset | El helper devuelve `"—"` y la ruta usa el instante de envío; nunca se interpreta en la zona del servidor. |
| Una versión de Node sin ICU completo formatea distinto | Node ≥ 20.9 (requisito del repo) trae ICU completo; el criterio de aceptación fija el string exacto esperado. |
| Mercado Pago no devuelve `date_created` en algún método de pago | Fallback `date_approved`, luego `Date.now()`; el correo nunca se queda sin fecha. |
| Cliente con bundle viejo tras un deploy (payload sin `createdAt`) | El fallback usa el instante de envío formateado en CDMX; el correo sale correcto durante la ventana de transición. |
| El correo de prueba comentado envía un payload sin `createdAt` | El fallback a `Date.now()` formateado en CDMX cubre ese caso. |
| La fila de `ordenes` no existe porque `registrarOrden` se traga errores | La verificación contra BD se hace solo cuando la fila existe; si no, se compara contra la fecha del pago en el dashboard de Mercado Pago. |
| Cambio de horario futuro en México | La zona IANA actualiza el offset con la base tzdata del runtime. |

## Qué **no** está en este spec

- Migraciones, columnas nuevas o cambios a `ordenes.createdat`.
- Cambiar la zona horaria del servidor o de Railway.
- Mostrar fecha en páginas de compra, dashboard o WhatsApp.
- Reactivar los envíos de prueba comentados.
- Configurar un runner de tests automatizados.
- Mover el envío del correo al servidor o validar el pago contra Mercado Pago dentro de `send-email`.
- El límite de ~64 KB del `keepalive` en el POST del correo.

Cada uno de estos, si se necesita, va en su propio spec.
