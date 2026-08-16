/**
 * El plan de pagos de una unidad — `dptos.has_payment_plan`.
 *
 * Cuando un residente se atrasa, la administración puede acordar con él un
 * plan de pagos. Desde ese momento su deuda deja de bloquearlo: sigue
 * debiendo, pero no cae en la mora que le impide reservar, invitar o ver su
 * inicio con normalidad.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 POR QUÉ NO SE COPIÓ EL PARCHE DE PRODUCCIÓN
 * ────────────────────────────────────────────────────────────────────────
 *
 * El hotfix `6396d47a` trae esto:
 *
 * ```ts
 * const parseBoolean = (value: any) =>
 *   value === true || value === 1 || value === "1" || value === "Y" || …;
 * ```
 *
 * En producción la columna es booleana y `1` significa **sí tiene plan**. Acá
 * es un enum numérico desde 1, así que **`1` es `SIN_PLAN`** — el valor
 * OPUESTO. Copiar ese `parseBoolean` deja el interruptor prendido para las
 * 2.888 unidades que no tienen ningún plan, y apagado para la única que sí:
 * la regla entera dada vuelta, sin un solo error.
 *
 * Es el mismo `(int) $v === 1` que ya había que desarmar al traer la matriz de
 * permisos operativos, y el mismo `is_main == 1` de Bancos.
 *
 * ⚠️ Y el valor viaja como número, no como booleano. `Boolean(2)` es `true`,
 * que del lado del API entra al cast del enum como `1` — otra vez el case
 * equivocado.
 */

/** Sin plan de pagos: su deuda la bloquea como a cualquiera. */
export const DPTO_SIN_PLAN_DE_PAGOS = 1;

/** Con plan de pagos vigente: su deuda no la bloquea. */
export const DPTO_CON_PLAN_DE_PAGOS = 2;

/**
 * ¿Esta unidad tiene un plan de pagos vigente?
 *
 * ⚠️ Acepta el número y su forma en texto porque el sobre del API viaja por
 * una cadena de `any` y un `2` puede llegar como `"2"`. Lo que NO acepta es
 * `true`: un booleano acá es un dato de la época anterior y tratarlo como
 * "sí" es exactamente el error que este archivo existe para evitar.
 */
export const tienePlanDePagos = (valor: unknown): boolean =>
  Number(valor) === DPTO_CON_PLAN_DE_PAGOS;

/** El valor que se manda al API a partir del interruptor de la pantalla. */
export const desdeElInterruptor = (prendido: boolean): number =>
  prendido ? DPTO_CON_PLAN_DE_PAGOS : DPTO_SIN_PLAN_DE_PAGOS;
