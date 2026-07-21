# Plan de pruebas rAdmin — Finanzas y Reservas

**Alcance:** App Administrador rAdmin. Cubre el menú actual de Finanzas (`Balance`, `Ingresos`, `Egresos`, `Expensas`, `Morosos`, `Deudas`, `Cuentas bancarias`, `Pagos parciales`) y `Reservas`.

**Estados:** ⬜ Pendiente · ✅ Funciona · ❌ Falla · ⚠️ Funciona con observaciones

## Datos base

Usar un condominio con: unidades ocupadas y vacías, al menos una unidad morosa, áreas sociales gratis y pagadas, área con aprobación requerida, área con restricción por mora, categorías/subcategorías de ingresos y egresos, cuenta bancaria principal, cuenta para expensas y cuenta para reservas.

## Finanzas — Expensas y deudas

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Crear expensa para todas las unidades | Se generan deudas del periodo con vencimiento, monto de unidad, descripción opcional y totales correctos | ⬜ |
| 2 | Crear expensa por ocupación o selección manual | Solo se asigna a unidades ocupadas, no ocupadas o seleccionadas, según corresponda | ⬜ |
| 3 | Crear expensa con periodo repetido | El sistema evita duplicados o informa claramente que ya existe | ⬜ |
| 4 | Crear expensa con vencimiento anterior al periodo | La acción se bloquea con validación | ⬜ |
| 5 | Revisar detalle de expensa | Muestra unidades al día, por pagar, vencimiento, cobrado, multa, mantenimiento si aplica y saldo a cobrar | ⬜ |
| 6 | Crear deuda individual | Guarda unidad, categoría, subcategoría, monto, fechas, interés y flags avanzados aplicables | ⬜ |
| 7 | Crear deuda compartida | Distribuye correctamente a todas las unidades o solo a las seleccionadas, con monto/tipo de distribución correcto | ⬜ |
| 8 | Validar fechas y montos de deuda | Bloquea vencimiento menor/igual al inicio, monto no positivo o campos obligatorios faltantes | ⬜ |
| 9 | Registrar pago desde detalle de deuda | Cambia acciones/estado de la deuda según pago: por cobrar, parcial, por confirmar, cobrada o condonada | ⬜ |
| 10 | Condonar deuda | La deuda queda condonada, no vuelve a cobrarse y se refleja en detalle/listas | ⬜ |

## Finanzas — Ingresos, pagos y cuentas

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Registrar pago total de expensa | Permite seleccionar una o varias deudas; el total incluye deuda, multa y mantenimiento; la deuda queda cobrada | ⬜ |
| 2 | Registrar pago total de reserva | El ingreso queda asociado a la deuda/reserva y actualiza estado de reserva y saldo | ⬜ |
| 3 | Registrar pago directo | Requiere unidad, categoría, subcategoría, monto, fecha y método; impacta ingresos sin crear deuda | ⬜ |
| 4 | Registrar pago sin deudas pendientes | Bloquea pagos de expensas/reservas cuando la unidad no tiene deuda pendiente | ⬜ |
| 5 | Registrar comprobante y respaldo | Guarda archivos permitidos, número de respaldo alfanumérico y observaciones sin exceder límites | ⬜ |
| 6 | Aprobar o rechazar pago por confirmar | Al aprobar pasa a cobrado; al rechazar queda rechazado y no descuenta deuda | ⬜ |
| 7 | Anular ingreso cobrado | Solicita motivo, marca anulado y restaura deuda/saldo/balance relacionado | ⬜ |
| 8 | Registrar pago parcial | Solo permite una deuda, monto mayor a cero y menor al subtotal; actualiza saldo pendiente | ⬜ |
| 9 | Registrar varios pagos parciales | Acumula pagos, mantiene saldo pendiente correcto y cierra la deuda al completar | ⬜ |
| 10 | Registrar pago parcial inválido | Bloquea monto igual/mayor al subtotal, deuda no seleccionada o datos obligatorios faltantes | ⬜ |
| 11 | Crear cuenta bancaria | Guarda QR, banco, tipo, número, moneda, saldo inicial, titular, CI/NIT y alias | ⬜ |
| 12 | Usar cuentas por tipo de movimiento | Expensas, reservas, directos y egresos usan la cuenta asignada o la principal como respaldo | ⬜ |

## Finanzas — Egresos, balance y morosidad

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Crear egreso | Requiere fecha, categoría, subcategoría, cuenta, método, monto, concepto y comprobante cuando aplique | ⬜ |
| 2 | Crear egreso inválido | Bloquea campos obligatorios, monto inválido y subcategoría sin categoría | ⬜ |
| 3 | Anular egreso | Solicita motivo, cambia estado a anulado y revierte el impacto en balance | ⬜ |
| 4 | Filtrar ingresos, egresos y pagos parciales | Filtros por periodo, estado, método, categoría y rango personalizado devuelven datos correctos | ⬜ |
| 5 | Validar rangos personalizados | Bloquea fecha inicio mayor a fin y, donde aplica, rangos de años distintos | ⬜ |
| 6 | Revisar balance general | Total = saldo inicial + ingresos - egresos; cambia correctamente entre ingresos, egresos y ambos | ⬜ |
| 7 | Exportar reportes financieros | Exporta/abre reporte de balance, ingresos, egresos y listados sin datos cruzados incorrectos | ⬜ |
| 8 | Revisar morosos | Lista solo unidades con deuda vencida; totales de expensa, multa, mantenimiento y total son correctos | ⬜ |
| 9 | Pagar deuda morosa | La unidad sale de morosos o actualiza saldo/multa según el pago aplicado | ⬜ |
| 10 | Presionar guardar dos veces | No duplica ingresos, egresos, expensas, deudas ni pagos parciales | ⬜ |

## Reservas

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Crear reserva rápida | Guarda área, fecha, unidad, responsable, turno, costo y observación; aparece en la lista | ⬜ |
| 2 | Crear reserva sin titular en la unidad | Bloquea la creación e informa que la unidad no tiene titular/responsable | ⬜ |
| 3 | Crear reserva en día/turno no disponible | Bloquea fechas reservadas, mantenimiento, fuera de horario o sin disponibilidad | ⬜ |
| 4 | Crear reserva de área pagada | Genera deuda de reserva y estado de pago pendiente según configuración | ⬜ |
| 5 | Crear reserva de área gratuita | Queda reservada sin deuda de pago cuando corresponde | ⬜ |
| 6 | Crear reserva que requiere aprobación | Queda en espera y aparece en `Reservas Pendientes` | ⬜ |
| 7 | Aprobar solicitud pendiente | Cambia al estado correspondiente y conserva auditoría de aprobación | ⬜ |
| 8 | Rechazar solicitud pendiente | Exige motivo, marca rechazada y muestra el motivo en el detalle | ⬜ |
| 9 | Pagar reserva | El pago queda asociado; la reserva pasa de pago pendiente/por confirmar a reservada pagada al aprobarse | ⬜ |
| 10 | Cancelar reserva | Exige motivo, marca cancelada, libera disponibilidad y genera multa/deuda si la política aplica | ⬜ |
| 11 | Reserva vencida por tiempo de pago | Muestra límite de pago y cancela automáticamente o refleja el estado automático esperado | ⬜ |
| 12 | Reserva en mantenimiento | Se muestra como mantenimiento administrativo y bloquea el calendario/turno correspondiente | ⬜ |
| 13 | Revisar detalle de reserva | Muestra área, solicitante, unidad, fecha, horario, personas, precio, estado, pago y motivos | ⬜ |
| 14 | Filtrar/exportar reservas | Filtros por fecha, estado y rango personalizado muestran/exportan solo reservas correctas | ⬜ |
| 15 | Presionar reservar dos veces | Solo se crea una reserva y no se duplica deuda ni turno ocupado | ⬜ |

## Validaciones transversales

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Permisos de usuario | Usuarios sin permiso no ven acciones de crear, aprobar, anular, cancelar o exportar | ⬜ |
| 2 | Consistencia entre módulos | Expensas, reservas, pagos, parciales, egresos, deudas, morosos y balance muestran el mismo saldo final | ⬜ |
| 3 | Listado vs detalle | Todo registro creado/anulado/aprobado coincide entre tabla, detalle, filtros y exportación | ⬜ |
| 4 | Archivos adjuntos | Imágenes, PDF y documentos permitidos se guardan, se abren y respetan límite de cantidad/tamaño | ⬜ |
| 5 | Moneda y redondeo | Los montos se muestran en Bs, con redondeo consistente en subtotales, totales y saldo pendiente | ⬜ |
