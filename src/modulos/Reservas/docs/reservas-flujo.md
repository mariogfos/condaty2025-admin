# Reservas — el flujo de la lógica

Qué pasa de punta a punta en cada acción de la pantalla, y dónde vive cada
regla. Escrito el 2026-08-12, sobre el módulo ya migrado a la forma mk2.

## El mapa: qué archivo hace qué

```
src/modulos/Reservas/
├── api.ts                          ÚNICA fuente de URLs
├── Type/ReservaType.ts             enums numéricos + formas del API
├── config/
│   ├── reservas.constants.ts       labels, colores, opciones, contrato del API
│   └── reservas.config.tsx         mod + fields de la lista
├── hooks/
│   ├── useReservas.ts              container de la lista
│   └── useReservationDetail.ts     container del detalle (todas las acciones)
├── utils/
│   ├── reservationStatus.ts        el estado que se VE (derivación)
│   ├── reservationPayment.ts       resolver el pago de una reserva
│   └── reservationFormat.ts        formateadores puros
├── Reserva.tsx                     presentacional (lista)
├── ReservationStatusBadge/         el badge de estado de la lista
├── RenderView/RenderView.tsx       presentacional (detalle)
└── __tests__/
```

La regla de corte: **`hooks/` sabe, los componentes muestran**. Ningún
componente arma una URL, elige un enum ni decide si un botón corresponde.

## 1. Abrir la pantalla `/reservas`

`src/app/reservas/page.tsx` monta `<Reserva />`.

1. `Reserva.tsx` llama a `useReservas()`.
2. `useReservas` pide su configuración a `getReservationsConfig()` y arranca
   `useCrud` con `RESERVATIONS_INITIAL_PARAMS`
   (`perPage: 20, page: 1, fullType: "L", searchBy: ""`).
3. `useCrud` arma la URL como `"/" + mod.modulo` → `/v3/reservations`, y le
   pega el baseURL (`NEXT_PUBLIC_API_URL`, que ya termina en `/api`).
4. Si el usuario no tiene el permiso `reservations` en `R`, el componente
   devuelve `<NotAccess />` antes de mostrar nada. **La verificación es del
   componente, no del API**: el API igual valida.

### El scroll infinito, que se colgaba

Al llegar al fondo, `useCrud` pide la página siguiente **sólo si cree que faltan
filas**, y eso lo decide con el total que viene en `message`.

🔴 **Se colgaba, y sólo en Reservas.** El API mandaba el total como entero pelado
(`"message": 128`) en vez de `{ "total": 128 }`: `getEnvelopeTotal` no lo
encontraba, caía al fallback —el largo de la lista ya cargada— y después
`useCrud` comparaba `listRows.length >= currentTotal` contra ese mismo largo:
**siempre verdadero**. Cortaba en la página 1, sin pedir nada más y sin ningún
error. Abajo quedaba el esqueleto para siempre.

A los otros módulos los salvaba el `-1` que devolvían, porque la guarda pedía
`currentTotal > 0`.

Arreglado en los dos lados el 2026-08-12 y **los dos arreglos se quedan**:
`getEnvelopeTotal` tolera las dos formas —*una lista que promete "hay más" y no
pide está rota venga lo que venga del API*— y el API ya devuelve el objeto.

## 2. Buscar

El buscador manda **un solo término** en `searchBy`. El API lo busca, con OR
entre las tres, en:

- `areas.title`
- el nombre del residente (partido en cuatro columnas, con AND entre palabras:
  "Juan Perez" no trae a todos los Juan)
- `dptos.nro`

⚠️ Ya **no** se manda `campo:operador:valor`. Esa forma murió con la migración
del back a mk2.

## 3. Filtrar

Dos filtros, los dos declarados en `config/reservas.config.tsx` y los dos
existentes en el `ReservationsListConfig` del API:

| filtro | qué filtra | cómo lo resuelve el API |
|---|---|---|
| `date_at` | período sobre la fecha del evento | `PeriodFilter::onDate` |
| `status_reservation` | el estado que se VE | `CallbackFilter` que mira el reloj |

El valor viaja como `filterBy=date_at:lm|status_reservation:5`.

### El caso "Personalizado"

`custom` **no es un período que el API entienda**. `useReservas.handleGetFilter`
lo intercepta:

1. saca `date_at` del mapa de filtros (para que no viaje nada),
2. abre `DateRangeFilterModal`.

Cuando el usuario guarda, `onSaveCustomPeriod` valida con
`validateCustomPeriod` —cuatro reglas: las dos fechas obligatorias, el orden, y
el mismo año— y recién ahí llama a `onFilter("date_at", "desde,hasta")`.

La regla del mismo año no es capricho: el `PeriodFilter` del API arma la ventana
sobre un año calendario.

## 4. El estado que se muestra en la lista

Es la parte menos obvia del módulo. **El estado que se ve no siempre es el de la
columna `reservations.status`.**

`ReservationStatusBadge` (un componente por fila):

1. Llama a `resolveReservationDisplayStatus` con lo que trae la fila.
2. Si el estado es terminal o manual (esperando confirmación, rechazada,
   cancelada, finalizada, mantenimiento), ése es el estado: se muestra y listo.
3. Si no, mira el estado de la DEUDA y del PAGO para decidir entre "Pago
   pendiente", "Por confirmar" y "Reservado (pagado)".
4. Si el resultado da "Pago pendiente" y la fila no trae el pago, **y sólo en
   ese caso**, pide el pago resuelto de la deuda a
   `GET /v3/payments/debts/{debtId}/resolved-payment`. Esa llamada está
   cacheada por `debtId` en `utils/reservationPayment.ts` para que una lista de
   20 filas de la misma deuda no dispare 20 peticiones.

⚠️ Los `debtStatus` / `paymentStatus` de esa derivación son dominio DEUDA/PAGO,
no reserva, y todavía se comparan contra chars (`"P"`, `"S"`, `"A"`…). Son
compares que hoy **no disparan** porque el API ya entrega
`reservations.status` resuelto; se migran en el slice de string-stragglers.

## 5. Abrir el detalle

Al hacer click en una fila, `useCrud` renderea `mod.renderView`, que es
`RenderView/RenderView.tsx`.

`useReservationDetail`:

1. Pide `GET /v3/reservations?fullType=DET&searchBy={id}&page=1&perPage=1`.
   Sí: el detalle se pide por `searchBy`, no por `/{id}`. Es la forma de mk1
   que el back todavía soporta.
2. Si la reserva tiene deuda, pide el pago resuelto (mismo endpoint que la
   lista).
3. Deriva el estado con la misma función que la lista, para que el badge del
   detalle y el de la fila **no puedan** decir cosas distintas.
4. Arma `detailRows` y `detailNotes`: datos planos, sin JSX, que el componente
   sólo recorre.

### Qué botones aparecen, y por qué

| botón | condición | dónde está escrito |
|---|---|---|
| Aprobar / Rechazar | `Number(status) === 1` (AWAITING_APPROVAL) | `canReviewRequest` |
| Cancelar reserva | el estado derivado NO es terminal y NO es "esperando" | `canCancelReservation` |
| Ver pago | hay un `payment_id` resuelto | `canShowPayment` |

🔴 `canReviewRequest` mira la **columna**, no el estado derivado. Una reserva
puede verse como "Pago pendiente" por el estado de su deuda y eso no habilita
aprobarla: lo que se aprueba es la solicitud, y sólo una solicitud que todavía
está esperando decisión.

## 6. Aprobar

```
PUT /v3/reservations/{id}
{ "approved_at": "2026-08-12 09:14:00", "is_approved": 2, "obs": "Aprobado" }
```

`2` es `ReservationApproval.APPROVED`. Al volver: `reLoad()` y `onClose()`.

El API, además de escribir el campo, decide si escribe `approved_by` y
`approved_at` según el rol, y dispara el flujo de deuda cuando el área es paga.
Eso vive del lado del back (`ReservationController::update`).

## 7. Rechazar

Abre un modal que **exige motivo**: sin texto no sale ninguna petición y se
muestra el error debajo del input.

```
PUT /v3/reservations/{id}
{ "is_approved": 3, "reason": "<texto>" }
```

`3` es `ReservationApproval.REJECTED`.

## 8. Cancelar

Mismo patrón, con motivo obligatorio validado por `checkRules`:

```
PUT /v3/reservations/{id}
{ "status": 7, "reason": "<texto>" }
```

`7` es `ReservationStatus.CANCELLED_MANUAL`. Acá la respuesta **sí** se mira:
si `data.success` es verdadero se muestra un toast de éxito y se cierra; si no,
un toast de error y el modal queda abierto.

⚠️ Aprobar y Rechazar **no** miran `data.success`: sólo capturan la excepción.
Es una asimetría que viene de antes y no se tocó en esta migración; está
listada como pendiente en `reservas-contrato.md`.

## 9. Ver pago

Abre `PaymentRenderView` del módulo de Pagos con el `payment_id` resuelto. Al
cerrarlo, recarga el detalle para que el estado se actualice.

## 10. Exportar

El botón de export usa el motor declarativo:

```
mod.exportAsync = {
  type: "reservations",
  supportedFormats: ["pdf", "xlsx", "csv"],
  endpoint: "/v3/reservations",
}
```

🔴 `supportedFormats` y `endpoint` son **una sola cosa**. `useCrud` elige el
botón mirando sólo `supportedFormats`: con el array renderea el `DownloadButton`
y le pasa el `endpoint`; sin el array cae al `AsyncExportButton` legacy, que no
recibe `endpoint` como prop, así que el endpoint no llega nunca. Van juntos o no
va ninguno.

## La pestaña de pendientes — BORRADA (2026-08-12)

Existía `ReservaPending`: la misma lista con `filterBy=status:1` fijo y
`sortBy=created_at&orderBy=asc`. **Estaba muerta**: la única que la renderizaba
era `ReserbationsTab`, y `page.tsx` importaba ese componente pero montaba
`<Reserva />` directo. Nunca llegó a la pantalla.

Se borró el subárbol entero por decisión del dueño: `ReserbationsTab.tsx`,
`ReservationsTab.module.css`, `ReservaPending.tsx`,
`hooks/useReservasPending.ts` y `config/reservasPending.config.tsx`.

⚠️ **Lo que queda vivo y hay que saber**: el filtro `status` del API sigue
declarado en su `ListConfig`, con sus tests. Esta pantalla ya no lo usa —la
lista principal filtra por `status_reservation`, el estado que se VE—, pero es
una capacidad del API que funciona y que otro consumidor puede pedir.

🔴 Y el motivo por el que estaba rota vale igual: hasta la migración del back,
`filterBy=status:1` caía en un `default: break` y **la lista devolvía todo**. Un
filtro que el API no declara no falla: deja de filtrar. Eso lo pinea hoy
`__tests__/reservasApiContract.test.ts`.
