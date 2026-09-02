import { SurveyStatus } from "./types/surveys.types";

/**
 * Las decisiones que toma el detalle de una encuesta a partir de su estado.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 EL BOTON «RESPONDER ENCUESTA» NO APARECIA NUNCA
 * ────────────────────────────────────────────────────────────────────────
 *
 * `SurveyDetailModal` decidía así:
 *
 * ```ts
 * const canAnswer = … && initialSurvey.status === "A";
 * buttonText={canAnswer ? "Responder encuesta" : ""}
 * ```
 *
 * `surveys.status` es `tinyint` —medido con `SHOW COLUMNS`— y el enum del API
 * documenta el mapeo: `'A' → 4`. La comparación era siempre falsa, `buttonText`
 * quedaba vacío y **desde ese modal no se podía votar una encuesta ni una
 * votación de asamblea**.
 *
 * La de al lado hacía lo mismo: `isClosed` comparaba contra `"C"` y `"X"`
 * (`'C' → 6`, `'X' → 7`), así que una encuesta cerrada nunca traía sus
 * resultados.
 *
 * ⚠️ `SurveyStatus` **ya estaba importado** en ese archivo —lo usa como tipo
 * para indexar `SURVEY_STATUSES`—. El enum estaba a mano, en el mismo archivo,
 * y las dos comparaciones se quedaron igual en los chars.
 *
 * Viven acá y no adentro del modal para que el test mida las funciones que la
 * pantalla llama, y no una copia parecida: el modal arrastra `useMySurveys` y
 * media docena de componentes de pregunta, y lo que se rompió no fue el render
 * sino la comparación.
 */

/** Cerrada o dada de baja: ya no recibe votos y sólo se miran sus resultados. */
export const estaCerrada = (status: unknown): boolean =>
  status === SurveyStatus.Closed || status === SurveyStatus.Disabled;

/** ¿Se puede votar? Estado activo, permiso del back, y que no haya votado ya. */
export const sePuedeResponder = (
  status: unknown,
  puedeResponder: unknown,
  yaRespondio: unknown,
): boolean =>
  Boolean(puedeResponder) &&
  !yaRespondio &&
  status === SurveyStatus.Active;

/**
 * Qué botones ofrece el listado de encuestas.
 *
 * 🔴 El config decidía con `["C", "X"].includes(item.status)`, y esa forma el
 * barrido de comparaciones **no la ve**: un `includes` no matchea un grep de
 * igualdad. Con `surveys.status` en `tinyint` (`'C' → 6`, `'X' → 7`) el
 * `includes` era siempre falso.
 *
 * ⚠️ Y acá el fallo va en la dirección PERMISIVA, al revés que en Asambleas:
 * la guarda que protege una encuesta cerrada no protegía nada. Una encuesta
 * cerrada **sin votos** se podía editar y borrar; lo único que seguía
 * frenando era `total_voters > 0`.
 */
export const accionesEscondidas = (item: {
  status?: unknown;
  total_voters?: number;
}) => {
  const esconder = estaCerrada(item?.status) || (item?.total_voters || 0) > 0;

  return { hideDel: esconder, hideEdit: esconder };
};
