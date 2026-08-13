# Reservas — el contrato

Qué le exige este módulo al API, y **qué se rompe si el API cambia**.

Escrito el 2026-08-12 contra `refactor/mk2-reservations` de `condaty-api`.

---

## El contrato está declarado en código

`RESERVATIONS_API_CONTRACT`, en `config/reservas.constants.ts`, es la copia del
lado del front del `ReservationsListConfig` del API:

```ts
{
  filters: ["status", "status_reservation", "date_at"],
  sortableFields: ["id","created_at","updated_at","date_at","date_end",
                   "start_time","end_time","status","amount","people_count"],
  maxPerPage: 100,
  searchableFields: ["area.title", "owner", "dpto.nro"],
  ignoredParams: ["cols", "joins"],
}
```

`__tests__/reservasApiContract.test.ts` compara lo que el módulo manda contra
esa copia.

🔴 **Lo que ese test NO puede hacer** —y hay que decirlo— es verificar que la
copia siga coincidiendo con el PHP. Los dos repos no se compilan juntos. Quien
toque `ReservationsListConfig.php` tiene que actualizar
`RESERVATIONS_API_CONTRACT` en el mismo release.

---

## Lo que el módulo le exige al API

### 1. La base es `/api/v3/reservations`

Y el front escribe `/v3/reservations`, porque el `baseURL` ya trae `/api`.

**Si el API mueve el prefijo** (por ejemplo a `/v4/`), se cambia
`RESERVATIONS_V3_BASE` en `api.ts` y no hay nada más que tocar en el módulo.
Ése es todo el punto de que ese archivo exista.

**Si cambia `NEXT_PUBLIC_API_URL`** y deja de terminar en `/api`, se rompe
TODO el front, no sólo este módulo.

### 2. `reservations.status` es numérico, 1..11

Se compara contra `ReservationStatus`, se manda como número en `filterBy` y en
el `PUT` de cancelar.

**Si el API vuelve a chars**: el badge de estado muestra "Estado desconocido" en
todas las filas, los filtros devuelven vacío y cancelar responde 422. Ruidoso y
visible.

**Si el API agrega un estado 12**: el badge cae a "Estado desconocido" para esas
filas, y el filtro no lo ofrece. No rompe: degrada. Hay que agregarlo al enum,
a `RESERVATION_STATUS_CONFIG` y a `RESERVATION_STATUS_OPTIONS`, y darle una
clase CSS.

### 3. `reservations.is_approved` es numérico, 1..3

**Si el API cambia esos valores**, aprobar y rechazar dejan de funcionar en
silencio del lado del usuario (422 con mensaje, que el módulo muestra en el
cuadro de error del detalle).

### 4. Los tres filtros con nombre existen

`status`, `status_reservation`, `date_at`.

🔴 **Si el API saca uno, no pasa nada visible: deja de filtrar.** Sin 4xx, sin
log, sin diferencia de aspecto. La pantalla muestra la lista entera y el usuario
cree que ése es el resultado.

Ya pasó exactamente eso: la pestaña de "Reservas pendientes" mandaba
`filterBy=status:1` contra un back que no conocía el filtro, y listaba todas las
reservas. Esa pestaña se borró —estaba muerta— pero el modo de fallar sigue
siendo el mismo para cualquier filtro.

### 5. `sortBy=created_at` es ordenable

Si el API lo saca de `sortableFields()`, el orden que manda el módulo se ignora
y la lista sale en el orden del `beforeList` (`created_at desc`). **Tampoco
avisa.**

### 6. `perPage` tiene tope 100

El módulo pide 20. Si alguien sube ese número por encima de 100, el API lo
recorta **en silencio** y la paginación queda descuadrada.

⚠️ Y **1 y -1 son sentinelas del motor**, no tamaños de página: con `1` el API
devuelve un modelo suelto en vez de una lista, con `-1` devuelve todo sin contar.
Paginar de verdad empieza en **2**.

### 6 bis. El total del listado viene en `message`, como objeto

`{ "message": { "total": 128 } }`. Lo lee `getEnvelopeTotal` (`useCrud.tsx:271`).

🔴 **Este es el que ya se rompió.** El API mandaba el entero pelado
(`"message": 128`) hasta el 2026-08-12: `useCrud` no encontraba el total, caía al
largo de su propia lista y después comparaba esa lista contra sí misma — siempre
verdadero. **El scroll infinito cortaba en la página 1** y no pedía la siguiente.

Arreglado en los dos lados, y los dos arreglos se quedan: el API devuelve el
objeto y `getEnvelopeTotal` sigue tolerando las dos formas, porque otros módulos
del API todavía mandan el entero pelado.

⚠️ El total vale **0** cuando el listado no pagina o cuando lleva `noCount=1`. Un
0 no significa "lista vacía": significa "no se contó".

### 7. `searchBy` es un término libre

Si el API vuelve a la forma `campo:operador:valor`, la búsqueda del módulo deja
de encontrar cosas.

### 8. El detalle se pide con `fullType=DET&searchBy={id}`

y responde `{ data: { reservation, timeLimit } }`.

**Si el API mueve el detalle a `GET /v3/reservations/{id}`** (que es lo que el
`apiResource` ya expone), hay que cambiar `useReservationDetail` — y sería una
mejora, porque hoy se pide un listado de una fila para traer una fila.

**Si cambia la forma de la respuesta**, `reservationDetail` cae al `item` que
vino de la lista, que no trae `approved_user`, `canceled_user` ni `timeLimit`.
El modal se ve, pero incompleto. **Degrada en silencio**: es el riesgo más feo
de esta lista.

### 9. `GET /v3/payments/debts/{id}/resolved-payment` responde
`{ success, data: { payment_id, payment_status } }`

Es del módulo Pagos. Si cambia, el botón "Ver pago" no aparece y el estado
derivado se queda en el de la columna.

### 10. El `PUT` responde `{ success, message }`

Sólo cancelar lo mira.

---

## Lo que el módulo NO le exige (y conviene que siga así)

- No manda `cols` ni `joins`.
- No manda `relations`: deja que el `beforeList` del API elija los eager loads.
- No pide proyecciones.
- No depende de `LEGACY_REJECTED` (11) para nada más que mostrarlo.

---

## Pendientes conocidos

Lo que quedó fuera de esta migración, con su motivo.

### 1. Las URLs de reservas escritas a mano en otros módulos

`CreateReserva`, `Calendar/CalendarPage` y `Areas/MaintenanceModal` arman
`/v3/reservations`, `/v3/reservations/calendar` y `/v3/reservations/area-blocked`
por su cuenta. `api.ts` ya las declara; falta que esos módulos las importen.

Son 4 archivos y ~10 call sites. No se tocaron porque son otros módulos.

### 2. ~~Aprobar y rechazar no miran `data.success`~~ — resuelto

Los tres (aprobar, rechazar, cancelar) miran `data.success` desde
`1aa916ec`: un `{ success: false }` con HTTP 200 muestra el mensaje de error
en vez de cerrar el modal como si hubiera funcionado.

### 3. El detalle se pide como un listado de una fila

Ver punto 8. Migrarlo a `GET /v3/reservations/{id}` es una tarea del back y del
front a la vez.

### 4. Los compares char del dominio deuda/pago

`utils/reservationStatus.ts` compara `debtStatus` y `paymentStatus` contra
`"P"`, `"S"`, `"A"`, `"M"`, `"I"`, `"E"`. Hoy están inertes porque el API
entrega `reservations.status` ya resuelto. Se migran en el slice de
string-stragglers sistémicos, que es transversal a varios módulos.

### 5. El caché del pago resuelto no se invalida

`utils/reservationPayment.ts` guarda un `Map` por `debtId` a nivel de módulo que
vive toda la sesión.

### 6. ~~Faltan cinco clases CSS de estado~~ — resuelto el 2026-08-13

Ya no falta nada porque ya no hay nada que faltar: `Reserva.module.css` quedó
huérfano al borrarse la pestaña de pendientes (`b5dcc5e9`) y se eliminó, junto
con el campo `class` de `RESERVATION_STATUS_CONFIG` que nadie leía. Las clases
de estado vivas están en `RenderView/ReservationDetailModal.module.css`.
