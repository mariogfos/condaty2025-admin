# QR Dinámico — Guía de pruebas manuales de la Plataforma Admin

Rama a desplegar: **`test`** de condaty-admin + **`test`** de condaty-api (ya incluyen todo). Estas pruebas son **de pantalla** (la plataforma web); las pruebas de API por Postman están en la guía del backend (`docs/qr-dinamico/PRUEBAS_POSTMAN.md` del repo del API, colección `postman_qr_dinamico.json` — sus escenarios 16-18 cubren los endpoints nuevos que usa esta épica).

## Preparación (una sola vez)

1. **Usuarios**: un usuario FOS, un administrador de condominio y un residente con la app.
2. **Datos**: una cuenta bancaria del condominio con la categoría de expensas apuntando a ella; un residente con al menos 2 deudas pendientes.
3. **Banco de pruebas**: credenciales del proveedor QR de prueba (las mismas de la épica del backend).
4. La forma más fácil de generar QRs para probar el admin es **desde la app del residente** (o con la colección Postman del API, request "Generar QR por deudas").

## Matriz de escenarios

| # | Escenario | Pasos | Resultado esperado | HU |
|---|-----------|-------|--------------------|-----|
| 1 | Configurar QR de una cuenta (FOS) | Entrar como FOS → Cuentas bancarias → editar una → sección "QR Dinámico (solo FOS)" → activar, elegir banco, cargar API key/usuario/contraseña/referencia → Guardar → cerrar y reabrir | Guardado exitoso; al reabrir: usuario tapado con puntitos, "Credenciales configuradas", campos de credenciales VACÍOS | DES-20, 21 |
| 2 | La config no existe para el admin | Entrar como admin de condominio → editar la misma cuenta | La sección de QR dinámico NO aparece | DES-20 |
| 3 | Guardado parcial | Como FOS, cambiar SOLO la referencia y guardar | Solo cambia la referencia; las credenciales siguen intactas ("Credenciales configuradas" no cambia) | DES-21 |
| 4 | Desactivar sin perder | Como FOS, apagar el interruptor y guardar; volver a encenderlo | Al reactivar, las credenciales siguen configuradas — no hubo que recargarlas | DES-20 |
| 5 | Deuda en espera | Generar un QR desde la app del residente por 2 deudas → en el admin abrir el detalle de una de esas deudas | Aviso amarillo "En espera de confirmación de QR Dinámico" con monto, vencimiento (hora de Bolivia) e "Incluye 2 deudas"; texto "verificando con el banco…" un instante | DES-22, 23 |
| 6 | Pago detectado al abrir | Pagar el QR en el banco de pruebas SIN que llegue webhook (o simular que no llegó) → abrir el detalle de la deuda en el admin | La deuda se actualiza a pagada sola, aparece el botón "Ver pago" y el aviso de espera desaparece | DES-23 |
| 7 | Banco caído | Con un QR pendiente y el banco de pruebas apagado → abrir el detalle de la deuda | Mensaje del tipo "no pudimos consultar…"; la deuda NO cambia de estado; el aviso de espera se mantiene | DES-23, 32 |
| 8 | Historial de la deuda | En la deuda del QR: regenerar el QR desde la app (reemplazo) y luego pagarlo → abrir el detalle → "Historial de QR dinámicos" | Los DOS QR: el nuevo Pagado y el viejo Reemplazado, cada uno con fechas, monto y su vínculo de reemplazo | DES-24, 27 |
| 9 | Ingreso con origen QR | Abrir el ingreso generado por el pago QR | Bloque "Origen: QR Dinámico" con nº de transacción, hora de confirmación, cuenta y deudas pagadas; "Ver auditoría completa" muestra generado/vencía/categoría/reemplazos/última consulta | DES-25, 26, 27 |
| 10 | Ingreso QR manual | Registrar a mano un ingreso con método "Pago QR" y abrirlo | SIN bloque de origen: un QR manual no es un QR dinámico | DES-25 |
| 11 | Métricas | Módulo QR Dinámico → pestaña Métricas; probar filtros de fechas, cuenta y estado | Los números cuadran con lo hecho en 5-9; cada filtro recorta de verdad | DES-28 |
| 12 | Métricas por actor | La misma pestaña como FOS y como admin de condominio | El filtro de condominio SOLO existe para FOS; el admin ve únicamente su condominio | DES-28 |
| 13 | Aviso en tiempo real | Con el admin abierto en cualquier pantalla, pagar un QR por webhook | Llega el aviso "Se confirmó un pago por QR dinámico" | DES-29 |
| 14 | Aviso sin duplicados | Repetir el mismo webhook 2-3 veces | UN solo aviso en el admin | DES-29 |
| 15 | Pantalla que se actualiza sola | Dejar abierto el detalle de una deuda en espera → pagar su QR por webhook | El aviso de espera desaparece solo y la deuda queda pagada, sin recargar la página | DES-30 |
| 16 | Pago ajeno no molesta | Con el detalle de una deuda SIN QR abierto, pagar el QR de OTRA deuda | La pantalla abierta no parpadea ni se recarga | DES-30 |
| 17 | Flujo manual intacto | Registrar un ingreso manual completo (método, comprobante, aplicar a deuda) | Funciona exactamente igual que antes de la épica | DES-31 |
| 18 | Sin botones prohibidos | Recorrer el módulo QR Dinámico y el detalle de deudas/ingresos | NO existe ningún botón de "Generar QR" ni "Anular QR" | DES-31 |

## Qué reportar como BUG (los "está mal si")

- Una credencial bancaria visible en claro en cualquier pantalla, respuesta de red o consola del navegador.
- La sección de configuración QR visible para un administrador de condominio.
- Un QR reemplazado que figure como "Anulado" (o cualquier estado que no coincida con la realidad).
- Con el banco caído, una deuda que cambie de estado o aparezca pagada.
- El mismo pago avisando dos o más veces.
- Un botón para generar, regenerar o anular un QR en cualquier pantalla del admin.
- Un error que muestre SQL, códigos internos o texto técnico.
- La pantalla de config pidiendo datos en bucle (spinner que parpadea sin fin).

## Notas

- El aviso en tiempo real del admin es genérico (sin monto): es lo esperado en esta entrega.
- El indicador "en espera" se ve al ABRIR la deuda, no en la lista: también esperado.
- Estados de un QR: Pendiente → Pagado / Reemplazado / Expirado / Anulado. El detalle completo de reglas está en `EPICA_ADMIN.md`.
