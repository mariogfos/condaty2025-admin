# Plan de pruebas rAdmin — Crons, schedules y procesos automáticos

**Alcance:** rAdmin actual + procesos detectados en `BackendLaravel` que se ejecutan por Laravel Schedule, endpoints tipo cron, comandos Artisan o automatismos por consulta/acción.

**Referencias revisadas:** `BackendLaravel/routes/console.php`, `BackendLaravel/routes/api.php`, `BackendLaravel/app/Http/Controllers/CronController.php`, comandos de `BackendLaravel/app/Console/Commands` y módulos `Surveys`, `Assemblies`, `QrDinamico`.

**Estados:** ⬜ Pendiente · ✅ Funciona · ❌ Falla · ⚠️ Funciona con observaciones

## Inventario real detectado

| Tipo | Proceso | Frecuencia/disparo | Qué hace |
| ---- | ------- | ------------------ | -------- |
| Schedule Laravel | `surveys:process-lifecycle` | Cada minuto | Activa encuestas programadas y cierra encuestas expiradas |
| Schedule Laravel | `financial:process-notifications` | Diario 08:00 `America/La_Paz`, si está habilitado | Encola avisos de expensas: por vencer, vencidas, mora y bloqueo |
| Endpoint cron | `GET /dailycron` | Externo/servidor | Rechaza reservas vencidas pendientes, marca mora, aplica multas, UFV y avisos financieros |
| Endpoint cron | `GET /hourlycron` | Externo/servidor | Rechaza accesos sin respuesta, finaliza reservas vencidas y cancela reservas impagas |
| Endpoint cron | `GET /monthlycron` | Externo/servidor | Crea expensas mensuales automáticas para condominios activos |
| Endpoint admin | `GET /setmultas` | Manual desde rAdmin | Actualmente no aplica multas: solo loguea y retorna resultado vacío |
| Endpoint admin | `POST /send-welcome-emails/{client_id}` | Manual | Actualmente cuenta propietarios elegibles; no se observa envío real de email |
| Comando Artisan | `qr:transactions --days=N` | Manual/no schedule detectado | Consulta transacciones QR del banco y muestra resumen |
| Automatismo por consulta | Asambleas `syncStatuses()` | Al abrir dashboard/listado/detalle | Pasa asambleas de programada a en curso al llegar la hora |
| Automatismo por acción | Votaciones de asamblea | Al registrar voto | Cierra la votación si todos los habilitados votaron |
| No encontrado | `/events-automatic` | Llamado comentado en frontend | No se encontró ruta backend activa; validar que no esté expuesto |

## Datos base

Preparar un condominio de prueba con: cliente activo e inactivo, unidades con expensas al día/vencidas/morosas, pagos en estados `P` y `S`, reservas con y sin pago, accesos pendientes, encuestas programadas/activas/expiradas, asambleas programadas y configuración de mora/reservas editable.

Usar zona horaria `America/La_Paz`. Para no esperar demasiado, configurar fechas cercanas: `payment_time_limit = 1`, encuestas a pocos minutos, accesos con más de 1 hora y vencimientos en el borde del día.

## Validación de schedules registrados

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Listar schedule de Laravel | Aparecen `surveys:process-lifecycle` cada minuto y `financial:process-notifications` a las 08:00 cuando la config está habilitada | ⬜ |
| 2 | Avisos financieros deshabilitados | Si `services.financial_notifications.enabled=false`, no se agenda ni procesa el schedule financiero | ⬜ |
| 3 | Zona horaria | Los schedules financieros corren con `America/La_Paz`, sin adelantar/atrasar fecha | ⬜ |
| 4 | No solapamiento | `financial:process-notifications` no genera dos ejecuciones concurrentes por `withoutOverlapping()` | ⬜ |

## Expensas, mora, UFV y avisos financieros

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Ejecutar `GET /dailycron` con expensas vencidas | Deudas `A` vencidas pasan a `M` y aparecen consistentes en morosos/deudas/balance | ⬜ |
| 2 | Multa porcentual | `penalty_type=1` calcula `amount * percent/100` solo al superar `penalty_limit` | ⬜ |
| 3 | Multa fija | `penalty_type=2` aplica el monto fijo una sola vez por deuda elegible | ⬜ |
| 4 | Multa personalizada tipo 3 | Aplica primer monto después de vencimiento y segundo monto después del fin de mes correspondiente | ⬜ |
| 5 | Multa personalizada tipo 4 | Aplica primer/segundo monto según `penalty_limit` y `penalty_limit + 1` | ⬜ |
| 6 | Pagos protegidos | Deudas con pago o detalle de pago en estado `P` o `S` no reciben mora/multa automática | ⬜ |
| 7 | Deudas anuladas/pagadas/condonadas | No vuelven a mora ni reciben `penalty_amount` | ⬜ |
| 8 | Mantenimiento UFV | Si `has_maintenance_value` está activo y existe UFV, calcula `maintenance_amount` correcto | ⬜ |
| 9 | UFV no disponible | El cron no falla y deja trazabilidad clara sin calcular mantenimiento | ⬜ |
| 10 | Repetir `dailycron` | No duplica multas, UFV, notificaciones ni cambios de estado | ⬜ |
| 11 | Aviso por vencer +3 días | `financial:process-notifications` encola push/mail correcto para expensa con vencimiento en 3 días | ⬜ |
| 12 | Aviso mañana/hoy/vencida | Encola `due_tomorrow`, `due_today` y `overdue` solo para deudas elegibles | ⬜ |
| 13 | Aviso mora/bloqueo | Encola `expense_in_mora` y `expense_blocked` según estado `M` y hard limit | ⬜ |
| 14 | Dedupe de avisos | Reejecutar el job no crea nuevos registros si ya están `queued` o `sent` | ⬜ |
| 15 | `GET /setmultas` | Confirmar comportamiento actual: retorna vacío y no cambia multas; marcar observación si rAdmin espera que aplique multas | ⬜ |

## Expensas mensuales automáticas

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Ejecutar `GET /monthlycron` | Crea expensas del mes actual para todos los clientes activos con vencimiento último día del mes | ⬜ |
| 2 | Cliente inactivo | No crea expensas para condominios inactivos | ⬜ |
| 3 | Duplicado de periodo | Segunda ejecución salta duplicados o responde `skipped` sin duplicar deuda/unidad | ⬜ |
| 4 | Datos creados | Expensa queda con `type=1`, `category_id=1`, `asignar=T` y descripción automática | ⬜ |
| 5 | Consistencia rAdmin | Expensas aparecen en Expensas, Deudas, Morosos si aplica y Balance con los mismos totales | ⬜ |

## Reservas y accesos por `hourlycron`

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Acceso pendiente mayor a 1 hora | Cambia a rechazado con `confirm=N`, `status=N` y observación automática | ⬜ |
| 2 | Acceso confirmado o ingresado | No se modifica aunque tenga más de 1 hora | ⬜ |
| 3 | Reserva aprobada finalizada por hora | Reservas `N` o `L` con fecha/hora final pasada cambian a `F` | ⬜ |
| 4 | Reserva impaga vence `payment_time_limit` | Reserva `A` pasa a `T`, `is_canceled=Y`; deuda pasa a `X` con motivo automático | ⬜ |
| 5 | Pago protegido antes del vencimiento | Si existe pago/deposit detail `P` o `S`, la reserva no se cancela | ⬜ |
| 6 | Área gratuita o con otra regla | No entra a cancelación de pago si el área no cumple `requires_approval=X` e `is_free=X` | ⬜ |
| 7 | Turno liberado | Luego de cancelación automática, el turno queda disponible en calendario rAdmin | ⬜ |
| 8 | Repetir `hourlycron` | No duplica cancelación, motivo, deuda anulada ni contadores | ⬜ |

## Reservas vencidas por `dailycron`

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Reserva pendiente vencida | Reserva con `status=W` y `date_at` anterior a hoy pasa a `X` e `is_approved=N` | ⬜ |
| 2 | Reserva pendiente de hoy | No se rechaza antes de terminar el día | ⬜ |
| 3 | Reserva ya aprobada/rechazada/cancelada | No se reprocesa ni pisa motivo manual | ⬜ |

## Encuestas programadas

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Encuesta programada futura | Permanece `Scheduled` antes de `scheduled_at` | ⬜ |
| 2 | Llegada de `scheduled_at` | `surveys:process-lifecycle` la pasa a `Active`, setea `published_at` y notifica audiencia | ⬜ |
| 3 | Encuesta activa expirada | Al pasar `expires_at`, cambia a `Closed` y setea `closed_at` | ⬜ |
| 4 | Notificaciones duplicadas | Ejecutar el comando varias veces no duplica notificaciones de activación | ⬜ |
| 5 | Audiencia segmentada | Solo pueden ver/responder los destinatarios definidos, incluyendo filtros por mora si aplica | ⬜ |
| 6 | Encuesta cancelada/cerrada manualmente | El schedule no la reactiva | ⬜ |

## Asambleas y votaciones automáticas

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Asamblea programada antes de hora | Permanece `S` al abrir dashboard/listado | ⬜ |
| 2 | Asamblea llega a `start_time` | Al abrir dashboard/listado/detalle cambia de `S` a `P` | ⬜ |
| 3 | Asamblea llega a `end_time` | No se cierra automáticamente; cierre `P -> C` sigue siendo manual | ⬜ |
| 4 | Cierre manual de asamblea | Cierra encuestas/votaciones vinculadas según regla del módulo | ⬜ |
| 5 | Todos los habilitados votan | La votación se cierra automáticamente y no acepta más votos | ⬜ |
| 6 | Voto parcial | La votación sigue activa y muestra abstenciones/pendientes correctos | ⬜ |

## Comandos y endpoints no scheduleados

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | `qr:transactions --days=1` | Consulta y muestra transacciones sin mutar pagos ni confirmar deudas por sí solo | ⬜ |
| 2 | `qr:transactions --days=0` o `--days>30` | Normaliza rango entre 1 y 30 días sin fallar | ⬜ |
| 3 | `POST /send-welcome-emails/{client_id}` | Retorna conteo esperado; marcar observación si negocio espera envío real de correos | ⬜ |
| 4 | `/events-automatic` | Confirmar que no está visible en rAdmin; si se llama manualmente, documentar 404 o ausencia de ruta backend | ⬜ |

## Validaciones transversales

| # | Casuística | Qué validar | Estado |
| - | ---------- | ----------- | ------ |
| 1 | Idempotencia general | Repetir cada proceso no duplica deudas, multas, reservas canceladas, avisos, emails ni logs críticos | ⬜ |
| 2 | Concurrencia | Dos ejecuciones casi simultáneas dejan un único resultado consistente | ⬜ |
| 3 | Corte 23:59/00:00 | Mora, reserva vencida y avisos financieros respetan día Bolivia | ⬜ |
| 4 | Permisos | Endpoints admin requieren sesión; endpoints públicos tipo cron deben estar protegidos por infraestructura o secret externo | ⬜ |
| 5 | Colas | Jobs encolados se ejecutan y registran `sent`, `failed` o `skipped` de forma auditable | ⬜ |
| 6 | Auditoría | Cambios automáticos guardan motivo, fecha o log suficiente para rastrear origen | ⬜ |
| 7 | UI rAdmin | Listas, detalle, calendario, deudas, morosos, balance y reportes muestran el mismo estado final | ⬜ |
| 8 | Error parcial | Si un cliente falla, el proceso continúa con otros y deja resumen/log de `skipped` o error | ⬜ |
| 9 | Limpieza | Al terminar pruebas, no quedan deudas falsas, reservas ocupadas, accesos pendientes ni encuestas activas | ⬜ |
