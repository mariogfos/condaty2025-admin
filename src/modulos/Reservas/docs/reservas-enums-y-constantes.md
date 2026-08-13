# Reservas — enums y constantes

Todos los valores del módulo, qué significa cada uno, y **cuáles son numéricos**.

Estado al 2026-08-12.

## Lo primero: el flip

Este proyecto migró sus enums de `char(1)` a `tinyint` numérico empezando en 1.
Las columnas de reservas (`reservations.status`, `reservations.is_approved`) son
TINYINT desde junio de 2026.

🔴 Un char donde va un número **no falla, miente**. MariaDB convierte `"A"` a
`0` y sigue sin chistar: el filtro devuelve vacío, o devuelve las filas
equivocadas, y nadie se entera. Por eso el API de reservas ahora valida
`integer` + `Rule::in(...)` y responde 422: falla fuerte antes que convertir en
silencio.

---

## `ReservationStatus` — NUMÉRICO

`Type/ReservaType.ts`. Espeja `App\Modules\Reservations\Enums\ReservationStatus`
del API (`enum ReservationStatus: int`).

| valor | nombre | etiqueta en pantalla | char legacy | significado |
|---|---|---|---|---|
| 1 | `AWAITING_APPROVAL` | Esperando confirmación | `W` | el residente pidió, el admin todavía no decidió |
| 2 | `PENDING_PAYMENT` | Pago pendiente | `A` | aprobada, esperando que el residente pague |
| 3 | `PAYMENT_SUBMITTED` | Por confirmar | `Q` | el residente subió comprobante, falta confirmarlo |
| 4 | `RESERVED_UNPAID` | Reservado (sin pago) | `N` | reservada; el área es gratuita |
| 5 | `RESERVED_PAID` | Reservado (pagado) | `L` | reservada y pagada |
| 6 | `REJECTED` | Reserva rechazada | `R` | el admin la rechazó |
| 7 | `CANCELLED_MANUAL` | Cancelada manualmente | `C` | alguien la canceló a mano |
| 8 | `CANCELLED_AUTO` | Cancelada automática | `T` | venció el plazo de pago y el cron la canceló |
| 9 | `COMPLETED` | Finalizada | `F` | el horario ya pasó |
| 10 | `MAINTENANCE` | Mantenimiento | `M` | bloqueo administrativo del área, no es una reserva de un residente |
| 11 | `LEGACY_REJECTED` | Rechazada | `X` | rechazo de la época anterior, **sólo lectura** |

**Los chars de la columna "char legacy" no se mandan ni se comparan en ningún
lado.** Están en la tabla —y como comentario al lado de cada valor del enum—
sólo para poder rastrear código viejo. Si aparece uno en una comparación, es un
bug.

### Estados terminales

`TERMINAL_STATUSES` en `config/reservas.constants.ts`: 6, 7, 8, 9, 11 y 10.
Desde ahí no se puede cancelar.

⚠️ Ojo con una diferencia: el `isTerminal()` del API **no** incluye
MANTENIMIENTO (10); el `TERMINAL_STATUSES` del front **sí**. No es un error de
copia: del lado del front la lista dice "estados desde los que el botón Cancelar
no corresponde", y un bloqueo administrativo se saca por otro camino (el módulo
de Áreas), no con ese botón.

### El estado que se VE vs. el de la columna

`utils/reservationStatus.ts` deriva el estado mostrado a partir de la columna
más el estado de la deuda y del pago. Ver `reservas-flujo.md` §4.

---

## `ReservationApproval` — NUMÉRICO

`Type/ReservaType.ts`. Espeja `App\Modules\Reservations\Enums\ReservationApproval`.

| valor | nombre | significado |
|---|---|---|
| 1 | `PENDING` | en espera; es el valor inicial que escribe el alta |
| 2 | `APPROVED` | aprobada |
| 3 | `REJECTED` | rechazada |

🔴 **Este enum no existía en el front hasta el 2026-08-12**, y ésa es la causa
exacta de uno de los dos bugs vivos del módulo: los botones Aprobar y Rechazar
mandaban `is_approved: "Y"` y `is_approved: "N"` —los chars de antes del flip—.
El `ReservationUpdateRequest` del API valida `integer` + `Rule::in([1,2,3])`,
así que respondía 422 y ninguna reserva se aprobaba ni se rechazaba. El admin
sólo veía que el botón no hacía nada.

El char `'X'` legacy de esa columna era un valor de control de flujo del
controller y **nunca se persistió**: la base sólo tenía `Y` y `N`.

---

## Constantes de presentación

Todas en `config/reservas.constants.ts`.

### `RESERVATION_STATUS_CONFIG`

`Record<ReservationStatus, { label, backgroundColor, color }>`. La tabla
de etiquetas y colores.

⚠️ Las palabras tienen que ser **las mismas** que `ReservationStatus::label()`
del API: esa tabla la usa el motor de reportes. El día que la pantalla y el PDF
digan cosas distintas para la misma reserva, nadie lo va a notar hasta que un
residente reclame. (Ya pasó: el reporte tenía su propia tabla escrita a mano en
SQL con 9 de los 11 casos, y el 55% de las filas de un condominio salía
"Desconocido".)

El campo `class` que acompañaba a cada entrada se **eliminó el 2026-08-13**:
ningún render lo leía, y las clases a las que apuntaba vivían en
`Reserva.module.css`, que quedó huérfano cuando se borró la pestaña de
pendientes (`b5dcc5e9`) y también se eliminó. Las clases de estado que sí se
usan (`statusW`…`statusM` del detalle) viven en
`RenderView/ReservationDetailModal.module.css`, con su propio switch.

### `RESERVATION_STATUS_OPTIONS`

Las opciones del filtro de estado. **El `id` es el número del enum pasado a
string**, porque el `Select` compara por igualdad estricta de string.

- `"ALL"` (`FILTER_ALL`) es el centinela que el motor del API descarta sin
  filtrar. No es un estado.
- `LEGACY_REJECTED` (11) queda **fuera** a propósito: es de sólo lectura,
  ninguna reserva nueva puede llegar ahí.

🔴 Nunca un char acá. Un `"A"` llega al API como `(int) "A"` = 0,
`ReservationStatus::tryFrom(0)` devuelve `null` y el filtro **no filtra nada**:
el usuario ve la lista entera y le cree. Hay un test que lo guarda
(`reservasApiContract.test.ts`).

### `RESERVATION_PERIOD_OPTIONS`

Los períodos del filtro de fecha. Los ids son los del `PeriodFilter` del API:

| id | significado |
|---|---|
| `ALL` | sin filtro |
| `d` | hoy |
| `ld` | ayer |
| `w` | esta semana |
| `lw` | semana anterior |
| `m` | este mes |
| `lm` | mes anterior |
| `y` | este año |
| `ly` | año anterior |
| `custom` | **no viaja al API**: abre un modal y se traduce a `desde,hasta` |

`CUSTOM_PERIOD_ID` es la constante de ese último caso.

### `REASON_LABELS`

Cómo se titula el campo "motivo" según por qué la reserva llegó a ese estado:
"Motivo del rechazo", "Motivo de la cancelación", "Motivo del mantenimiento".

### `RESERVATIONS_COPY` y `RESERVATION_DETAIL_COPY`

Los textos de la pantalla y del detalle, en un solo lugar.

### `CUSTOM_PERIOD_ERRORS`

Los cuatro mensajes de validación del período personalizado.

### `RESERVATIONS_API_CONTRACT`

No es presentación: es el espejo declarado del `ReservationsListConfig` del API.
Ver `reservas-contrato.md`.

---

## ¿Queda algún resto de la época de los char?

Sí, tres, y ninguno es del dominio reserva:

1. **`utils/reservationStatus.ts`** compara `debtStatus` y `paymentStatus`
   contra `"P"`, `"S"`, `"A"`, `"M"`, `"I"`, `"E"`. Son estados de **deuda y de
   pago**, no de reserva. Hoy esos compares **no disparan** —el API ya entrega
   `reservations.status` resuelto— así que están inertes. Se migran en el slice
   de string-stragglers, no en éste.
2. **`ReservationDebtDpto.status` y los `*_status`** en `Type/ReservaType.ts`
   están tipados `string | null` por lo mismo.
3. **`ReservationListItem.status`** admite `string` en el tipo porque el listado
   se puede pintar con datos de un `localStorage` viejo o de un mock. El front
   siempre lo normaliza con `Number()` antes de comparar
   (`normalizeReservationStatus`). Lo que nunca hace es compararlo contra un
   char.

Lo que **sí** se limpió en esta migración: el `form.options` del campo
`status_reservation` traía los ids `"A"` / `"X"` / `"M"` con las etiquetas
"Disponible" / "No disponible" / "En mantenimiento" —chars, y encima del dominio
ÁREA, no reserva—. Nunca se vieron, porque el alta la renderea `CreateReserva`,
que arma su propio payload. Se sacaron en vez de inventarles una traducción
numérica que nadie midió.
