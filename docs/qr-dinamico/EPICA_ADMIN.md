# Épica DES-19 · QR Dinámico: Administrador — Entrega del front

**Estado: front del admin completo.** Las 13 historias (DES-20 … DES-32) están implementadas en la rama `qr-admin-hotfix` de condaty-admin, contra el backend de la épica DES-1 ya mergeado en `test` del API. Suite del módulo: 17 pruebas automáticas verdes; `tsc` sin un solo error nuevo sobre la línea base.

## 1. Qué ve cada actor

| Actor | Ve |
|-------|----|
| **FOS Admin** | Configuración de QR dinámico dentro de la edición de cada cuenta bancaria (activar, proveedor, referencia, credenciales write-only) + todo lo del admin + filtro de condominio en métricas |
| **Admin de condominio** | Módulo "QR Dinámico" del menú (órdenes, conciliación, métricas de su condominio), el estado QR en el detalle de cada deuda y el origen QR en cada ingreso. **No ve** la sección de configuración, y **no puede** generar ni anular QR |
| **Residente / guardia** | Nada del admin (el backend además responde 403) |

## 2. Cumplimiento historia por historia

| HU | Historia | Cómo se cumple |
|----|----------|----------------|
| DES-20 | Configurar por cuenta | Sección QR en la **edición** de la cuenta bancaria, solo FOS; guarda por el endpoint dedicado (el CRUD genérico descarta esos campos). Activar no toca el QR manual; desactivar no borra credenciales. Nota: al **crear** la cuenta todavía no existe su id — flujo: crear → editar → configurar |
| DES-21 | Ver estado de config | Activo/inactivo, proveedor, referencia, "tiene credenciales" y usuario enmascarado. Las credenciales guardadas **jamás** se muestran ni se precargan; para cambiar una se escribe un valor nuevo (los campos vacíos no viajan) |
| DES-22 | Deuda con QR pendiente | Banner "En espera de confirmación de QR Dinámico" en el detalle de la deuda, con monto, vencimiento (hora Bolivia) y cuántas deudas comparten el QR. El dato viene del backend, el front no calcula nada |
| DES-23 | Revalidar al abrir | Al abrir el detalle con QR pendiente se dispara UNA verificación contra el banco. Pagado → la deuda se recarga sola y el ingreso queda disponible. Banco caído → se muestra el mensaje del backend y no se toca nada |
| DES-24 | Info QR en la deuda | Historial completo de la deuda: todos sus QR (reemplazados, expirados, anulados) con estado, fechas, monto aportado y linaje. Ninguno se presenta como activo |
| DES-25 | QR en el ingreso | Bloque "Origen: QR Dinámico" en el detalle del ingreso con transacción, confirmación, cuenta y deudas pagadas. El método sigue siendo "Pago QR"; un ingreso QR **manual** no muestra el bloque |
| DES-26 | Auditoría | Auditoría completa expandible en el mismo bloque: generado, vencimiento, categoría, montos, linaje, última consulta al banco. Sin credenciales |
| DES-27 | Historial de reemplazo | Linaje en ambas direcciones (reemplazó a / reemplazado por) con el estado de cada QR, tanto en la deuda como en el ingreso |
| DES-28 | Métricas | Pestaña "Métricas" del módulo: totales, monto generado y pagado, conteo por los 5 estados; filtros de fechas, cuenta y estado. El filtro de condominio existe **solo para FOS** |
| DES-29 | Notificación | El pago QR confirmado llega por el canal de administradores en tiempo real y muestra un aviso. Dedup en tres capas: el backend emite solo la primera acreditación, la infraestructura deduplica por registro y el handler filtra por tipo de aviso |
| DES-30 | Actualización en vivo | El aviso dispara un evento interno; una deuda abierta se refresca sola: el indicador de espera desaparece y el ingreso queda disponible sin recargar la aplicación |
| DES-31 | Flujo manual intacto | Cero cambios en el registro manual de ingresos, métodos de pago y comprobantes. El admin no tiene ninguna acción para generar QR (se **eliminó** el modal de generación y los botones de anular que existían en código muerto) |
| DES-32 | Errores y permisos | 403 → la acción/sección no se muestra; 404 → nada o mensaje genérico; 422 → se muestra el `message` del backend tal cual; nunca SQL ni detalles técnicos; ningún error altera estados locales |

## 3. Decisiones tomadas

1. **El módulo existente se reescribió, no se parcheó**: estaba construido contra un modelo viejo de 3 estados donde el valor 3 significaba "Anulado" — con el backend nuevo 3 es "Reemplazado". Sin esta corrección, todo QR reemplazado se habría mostrado como anulado.
2. **Se eliminó la generación y anulación de QR del admin** (RN-ADM-04), incluida la config vieja por condominio que apuntaba a rutas retiradas del backend.
3. La config QR aparece **al editar** la cuenta (no al crear): la configuración necesita que la cuenta exista.
4. El aviso en tiempo real del admin es **genérico** ("Se confirmó un pago por QR dinámico"): el canal no transporta monto ni unidad. Si se quiere el monto en el aviso, es un cambio chico del backend.
5. El indicador "en espera" vive en el **detalle** de la deuda. Mostrarlo también en el listado requiere un dato nuevo en el backend (anotado como mejora futura).

## 4. Guía rápida para el tester

1. **Config (FOS)**: editar una cuenta → sección "QR Dinámico (solo FOS)". Guardar credenciales → reabrir: usuario enmascarado, campos vacíos. Con un admin de condominio: la sección NO existe.
2. **Deuda con QR**: generar un QR desde la app del residente → abrir esa deuda en el admin: banner de espera + "verificando con el banco…". Pagar el QR (banco de pruebas) → reabrir: la deuda pagada, botón "Ver pago".
3. **Tiempo real**: con la deuda abierta en pantalla, pagar el QR por webhook → el banner desaparece solo y llega el aviso. Repetir el webhook: **un solo** aviso.
4. **Ingreso**: abrir el ingreso generado → bloque "Origen: QR Dinámico" con transacción; abrir un ingreso QR manual → sin bloque.
5. **Métricas**: los números deben cuadrar con lo hecho; con admin de condominio no existe el filtro de condominio.
6. **Está MAL si**: una credencial se ve en claro en cualquier pantalla o respuesta de red; aparece un botón de generar/anular QR; un QR reemplazado figura "Anulado"; el mismo pago avisa dos veces; un error muestra SQL o texto técnico.
