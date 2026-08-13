# Reservas — el API que consume

Cada endpoint que toca el módulo, con qué params le manda y qué espera de
vuelta. Medido contra la rama `refactor/mk2-reservations` de `condaty-api` el
2026-08-12.

## La base

```
NEXT_PUBLIC_API_URL   →  http://127.0.0.1:8000/api      (ya termina en /api)
+ reservationsApi.base →  /v3/reservations
= la URL real          →  http://127.0.0.1:8000/api/v3/reservations
```

🔴 **Los paths del front NUNCA llevan el prefijo `/api`.** Lo trae el
`baseURL` del `AxiosInstanceProvider`. Un path que arranca con `/api/` sale a
`/api/api/...` → *"The route api/api/v3/reservations could not be found"*.

Todas las URLs del módulo salen de `api.ts`. Si hace falta una nueva, va ahí y
no en el componente.

---

## `GET /v3/reservations` — el listado

Quién lo llama: `useCrud`, desde `useReservas`.

### Params

| param | qué es | lo que manda este módulo |
|---|---|---|
| `page` | página | `1` inicial |
| `perPage` | filas por página, **tope 100** | `20` |
| `fullType` | `L` listado · `DET` detalle · `EXTRA` datos del alta | `L` |
| `searchBy` | **un solo término libre** | lo que escriba el usuario |
| `filterBy` | `nombre:valor\|nombre:valor` | `date_at:…` y/o `status_reservation:…` |
| `sortBy` | campo de orden | — (lo fija la columna que se toca) |
| `orderBy` | `asc` / `desc` | — |
| `relations` | lista blanca de relaciones a cargar | *no se manda* |
| `extraData` | pide los datos auxiliares | lo maneja `useCrud` |
| `_debug`, `_export` | diagnóstico y export | los maneja `useCrud` |

⚠️ `cols` y `joins` **ya no existen**: el API los ignora. El módulo no los manda.

### `searchBy`

Un solo término. El API lo busca, con OR entre las tres, en `areas.title`, el
nombre del residente (cuatro columnas, AND entre palabras) y `dptos.nro`.

Ya **no** se manda `campo:operador:valor`.

### `filterBy` — los filtros declarados

| nombre | tipo | valores | cómo lo aplica el API |
|---|---|---|---|
| `status` | int | 1..11 | `where reservations.status = ?` |
| `status_reservation` | int | 1..11 | `CallbackFilter` que además mira el reloj |
| `date_at` | período | `d ld w lw m lm y ly` o `desde,hasta` | `PeriodFilter::onDate` |

🔴 **Un filtro que no esté en esa lista no filtra, y nadie avisa.** No hay 4xx,
no hay log: la pantalla muestra todo. Ver `reservas-contrato.md`.

`status_reservation` no es `where status = ?` para cinco de los once estados:
"Pendiente de pago", "Reservado sin/con pago" y "Completado" dependen de si el
fin de la reserva ya pasó, comparado contra `now('America/La_Paz')`.

`date_at` usa `onDate` y no `on` porque `reservations.date_at` es `DATE`, un día
calendario y no un instante.

### `sortBy` — los campos ordenables

`id`, `created_at`, `updated_at`, `date_at`, `date_end`, `start_time`,
`end_time`, `status`, `amount`, `people_count`.

⚠️ El orden que manda el front se **suma** al que fija el `beforeList` del API
(`reservations.created_at desc`), no lo reemplaza.

### Respuesta

```jsonc
{
  "data": [ /* filas: ver ReservationListItem en Type/ReservaType.ts */ ],
  "message": { "total": 128 }
}
```

Cada fila trae `area`, `owner`, `dpto`, `periods` y `debt_dpto` cargados.

🔴 **Esta doc estaba bien y el API estaba mal.** Hasta el 2026-08-12,
`ReservationController::afterList` devolvía el total **pelado** (`"message": 128`)
en sus tres salidas. Eso es lo que colgaba el scroll infinito: `useCrud` no
encontraba el total, caía al largo de su propia lista y después comparaba esa
lista contra sí misma — siempre verdadero, cortaba en la página 1.

Se arregló en los dos lados y **los dos arreglos se quedan**:

- **El API** devuelve el objeto (`ReservationSobreDelListadoTest` pinea las tres
  salidas).
- **El front** tolera las dos formas (`getEnvelopeTotal`, `useCrud.tsx:271`),
  porque *una lista que promete "hay más" y no pide está rota venga lo que venga
  del API*. `HomeOwner` e `Invitation` todavía mandan el entero pelado.

⚠️ El total vale **0** cuando el listado no pagina (`perPage=-1`) o cuando el
request lleva `noCount=1`. Y `perPage` **1 y -1 son sentinelas** del motor: con
`1` el API devuelve un modelo suelto, con `-1` devuelve todo sin contar. Paginar
de verdad empieza en **2**.

---

## `GET /v3/reservations?fullType=DET&searchBy={id}&page=1&perPage=1` — el detalle

Quién lo llama: `useReservationDetail`.

Sí, el detalle se pide por `searchBy` sobre el listado, no por `/{id}`. Es la
forma que viene de mk1 y que el back sigue soportando.

### Respuesta

```jsonc
{
  "data": {
    "reservation": { /* ReservationDetailItem */ },
    "timeLimit": "El residente tiene 3 horas 20 minutos para completar su pago…"
  }
}
```

`timeLimit` sólo se muestra cuando el estado derivado es "Pago pendiente"
(`shouldShowReservationPaymentTimeLimit`). El texto llega armado y el front lo
normaliza en `formatReservationPaymentTimeLimitMessage`.

La fila del detalle trae además `approved_user`, `canceled_user`, `approved_at`,
`canceled_at`, `is_approved`, `reason` y `obs`.

---

## `PUT /v3/reservations/{id}` — aprobar, rechazar y cancelar

El mismo endpoint hace las tres cosas según qué campos lleguen. Todos los
campos son opcionales (`sometimes` en `ReservationUpdateRequest`).

### Aprobar

```jsonc
{ "approved_at": "2026-08-12 09:14:00", "is_approved": 2, "obs": "Aprobado" }
```

### Rechazar

```jsonc
{ "is_approved": 3, "reason": "El área está en obra" }
```

### Cancelar

```jsonc
{ "status": 7, "reason": "El residente se arrepintió" }
```

### Validación del API

| campo | regla | mensaje si falla |
|---|---|---|
| `is_approved` | `integer` + `in:1,2,3` | *"is_approved debe ser numérico (1=PENDING, 2=APPROVED, 3=REJECTED)"* |
| `status` | `integer` + `in:1..11` | *"status debe ser numérico: la columna reservations.status es TINYINT desde 2026-06-29"* |
| `reason` | `nullable string` | — |
| `obs` | `nullable string` | — |
| `approved_at` | `nullable date` | *"approved_at debe ser una fecha válida"* |
| `people_count` | `integer min:0` | — |

🔴 Mandar un char da **422**, no 500 ni un guardado silencioso. Es la decisión
del proyecto: fallar fuerte antes que convertir en silencio.

### Autorización

`is_approved` sólo lo puede mandar quien pase el `Gate::allows('approve')`.
Antes de la Policy del API un residente podía aprobar su propia reserva.

### Respuesta

```jsonc
{ "success": true, "message": "…" }
```

⚠️ Sólo el flujo de **cancelar** mira `success`. Aprobar y rechazar sólo
capturan la excepción. Está listado como pendiente en `reservas-contrato.md`.

---

## `GET /v3/payments/debts/{debtId}/resolved-payment` — el pago de una reserva

No es del módulo Reservas: es del módulo Pagos (`paymentsApi.resolvedPayment`),
y el módulo lo consume desde dos lugares.

Quién lo llama:

- `ReservationStatusBadge`, **sólo** si el estado derivado da "Pago pendiente" y
  la fila no trae el pago.
- `useReservationDetail`, si la reserva tiene deuda.

### Respuesta

```jsonc
{ "success": true, "data": { "payment_id": 4512, "payment_status": "P" } }
```

⚠️ `utils/reservationPayment.ts` cachea la promesa por `debtId` en un `Map` a
nivel de módulo, para que una lista de 20 filas de la misma deuda no dispare 20
peticiones. **Ese caché no se invalida nunca durante la sesión**: si el pago
cambia de estado en otra pestaña, la lista no se entera hasta recargar.

---

## Endpoints declarados pero que este módulo no llama

Están en `api.ts` porque son del recurso y alguien los va a necesitar:

| endpoint | quién lo usa hoy |
|---|---|
| `GET /v3/reservations/calendar` | el módulo Calendar |
| `POST /v3/reservations/area-blocked` | el módulo Áreas (bloqueo por mantenimiento) |
| `POST /v3/reservations` | el módulo CreateReserva (el alta) |
| `GET /v3/reservations?fullType=EXTRA` | `src/app/create-reservas/page.tsx` |

⚠️ Esos tres módulos tienen sus propias URLs escritas a mano. Unificarlos contra
`reservationsApi` es una tarea aparte, listada en `reservas-contrato.md`.
