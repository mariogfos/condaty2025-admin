/**
 * En qué está un pedido.
 *
 * 🔴 `others.status` pasó de `char(1)` a enum numérico el 2026-08-30 (api#…).
 * Con las letras, las tres comparaciones de `RenderView` dejaban de matchear:
 * un pedido anulado no decía "Anulado", uno vencido no decía "Vencido", y el
 * botón "Registrar Entrada" **aparecía también en los anulados**.
 *
 * ⚠️ Son CUATRO estados, no dos. `Salio` no lo nombraba ningún archivo del
 * front ni del back: lo escribe el API al cerrar el acceso, y en producción son
 * **105 filas** — el 12% de los pedidos.
 */
export const ORDER_STATUS = {
  ESPERANDO: 1,
  INGRESO: 2,
  SALIO: 3,
  CANCELADO: 4,
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * ⚠️ Normaliza antes de comparar: el sobre puede traer el número como string, y
 * `4 === "4"` es `false`.
 */
export const esEstadoDePedido = (
  valor: unknown,
  estado: OrderStatus,
): boolean => Number(valor) === estado;
