/**
 * Si la unidad es socia — `dptos.has_membership`.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 ES LA OTRA MITAD DE `requires_membership` DE ÁREAS
 * ────────────────────────────────────────────────────────────────────────
 *
 * La visibilidad de un área por membresía se decide con DOS columnas, y cada
 * una vive en su módulo:
 *
 * | pregunta | columna | dueño |
 * |---|---|---|
 * | ¿el área pide membresía? | `areas.requires_membership` | Áreas |
 * | ¿la unidad la tiene? | `dptos.has_membership` | HomeOwner |
 *
 * El interruptor del área entró en admin#794. **Éste no existía**, así que un
 * área marcada como "sólo para socios" no la veía NADIE: no había forma de
 * marcar una unidad como socia, y `HomeOwnerParaOtrosModulosService:138`
 * filtra con `->where('has_membership', DptoMembership::ACTIVE->value)`.
 *
 * Medido el 2026-09-02: `has_membership` aparecía **cero veces** en todo
 * `condaty-admin`, mientras el API la aplicaba entera.
 *
 * ⚠️ Los NÚMEROS del enum, no booleanos. `NONE = 1`, `ACTIVE = 2` — o sea que
 * un `Boolean(1)` es `true` y significa lo contrario. Misma trampa que
 * `dptoPaymentPlan.ts` y `dptoVisitReception.ts`; los tres hermanos comparten
 * la misma tabla y la misma forma de romperse.
 */

/** Sin membresía: no ve las áreas que la piden. */
export const DPTO_SIN_MEMBRESIA = 1;

/** Con membresía vigente. */
export const DPTO_CON_MEMBRESIA = 2;

/**
 * ¿Esta unidad es socia?
 *
 * ⚠️ Acepta el número y su forma en texto porque el sobre del API viaja por una
 * cadena de `any`. Lo que NO acepta es `true`: un booleano acá es un dato de la
 * época anterior, y tratarlo como "sí" le abriría las áreas de socios a
 * unidades que no lo son.
 *
 * ⚠️ Ausente cuenta como SIN membresía, al revés que `recibeVisitas`: acá la
 * omisión tiene que ser la opción CERRADA. Abrir por omisión daría acceso a
 * todas las unidades de las que el API todavía no mandó el dato, que es
 * exactamente lo que la columna existe para impedir.
 */
export const tieneMembresia = (valor: unknown): boolean =>
  Number(valor) === DPTO_CON_MEMBRESIA;

/** El valor que se manda al API a partir del interruptor de la pantalla. */
export const desdeElInterruptorDeMembresia = (prendido: boolean): number =>
  prendido ? DPTO_CON_MEMBRESIA : DPTO_SIN_MEMBRESIA;
