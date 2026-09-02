/**
 * Si la unidad puede recibir visitas — `dptos.can_receive_visits`.
 *
 * Es una regla de la PUERTA: la matriz de permisos operativos sólo corre
 * `ACTION_VISIT_APPROVAL` sobre unidades que reciben visitas, y
 * `AccessHomeService` filtra por ella al armar el inicio del guardia. Una
 * unidad marcada como que no recibe visitas no puede invitar ni autorizar a
 * nadie.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 EL `1` SIGNIFICA LO CONTRARIO QUE EN PRODUCCIÓN
 * ────────────────────────────────────────────────────────────────────────
 *
 * En producción la columna es `tinyint(1) NOT NULL DEFAULT 1` y `1` quiere
 * decir **sí recibe visitas**. Acá es un enum numérico desde 1, así que:
 *
 * | valor | producción | `dev` |
 * |---|---|---|
 * | `1` | recibe visitas | **BLOCKED — no recibe** |
 * | `2` | — | ALLOWED — recibe |
 *
 * El parche de producción trae `parseBoolean(item?.can_receive_visits)`, que
 * lee `1` como `true`. Copiarlo deja la regla **dada vuelta para todas las
 * unidades**, sin un solo error: las que no reciben visitas aparecen
 * recibiendo, y viceversa.
 *
 * Es exactamente el mismo caso que documenta `dptoPaymentPlan.ts` para su
 * hermano `has_payment_plan`, y el mismo `is_main == 1` de Bancos.
 *
 * ⚠️ Y el valor viaja como NÚMERO, no como booleano: `Boolean(2)` es `true`,
 * que del lado del API entra al cast del enum como `1` — otra vez el case
 * equivocado.
 */

/** No recibe visitas: no puede invitar ni autorizar a nadie. */
export const DPTO_NO_RECIBE_VISITAS = 1;

/** Recibe visitas, que es el default de la columna. */
export const DPTO_RECIBE_VISITAS = 2;

/**
 * ¿Esta unidad recibe visitas?
 *
 * ⚠️ Acepta el número y su forma en texto porque el sobre del API viaja por una
 * cadena de `any` y un `2` puede llegar como `"2"`. Lo que NO acepta es `true`:
 * un booleano acá es un dato de la época anterior, y tratarlo como "sí" es
 * exactamente el error que este archivo existe para evitar.
 *
 * ⚠️ Ausente cuenta como que SÍ recibe: la columna es `NOT NULL DEFAULT`
 * ALLOWED, así que una unidad sin el dato es una que el API todavía no mandó,
 * no una bloqueada. Bloquear por omisión cerraría la puerta a unidades que hoy
 * la tienen abierta.
 */
export const recibeVisitas = (valor: unknown): boolean =>
  valor === undefined || valor === null
    ? true
    : Number(valor) === DPTO_RECIBE_VISITAS;

/** El valor que se manda al API a partir del interruptor de la pantalla. */
export const desdeElInterruptorDeVisitas = (prendido: boolean): number =>
  prendido ? DPTO_RECIBE_VISITAS : DPTO_NO_RECIBE_VISITAS;
