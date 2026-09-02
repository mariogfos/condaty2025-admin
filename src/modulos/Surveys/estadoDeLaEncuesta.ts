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

/**
 * Las letras que guardaba `surveys.status` antes del flip de api#444.
 *
 * ⚠️ Se siguen aceptando a propósito. El aviso de cambio de estado lo emite
 * OTRO admin, y nada garantiza que las dos pestañas tengan el mismo build: la
 * que emite puede ser un deploy viejo que todavía manda la letra. Es la misma
 * ventana que abre `desdeLoQuePideElCliente()` del API.
 */
const LETRAS_VIEJAS: Record<string, SurveyStatus> = {
  D: SurveyStatus.Draft,
  V: SurveyStatus.Visible,
  S: SurveyStatus.Scheduled,
  A: SurveyStatus.Active,
  P: SurveyStatus.Paused,
  C: SurveyStatus.Closed,
  X: SurveyStatus.Disabled,
};

/**
 * El estado que viaja dentro del aviso de InstantDB, resuelto al enum.
 *
 * 🔴 El payload entra sin tipo y el mismo campo aparece como `5` o como `"5"`
 * según por dónde pasó. Devuelve `null` para lo que no sepa traducir: es lo
 * que hace que el llamador no muestre un aviso inventado.
 */
export const estadoDelAviso = (valor: unknown): SurveyStatus | null => {
  if (typeof valor === "number") {
    return SurveyStatus[valor] === undefined ? null : (valor as SurveyStatus);
  }

  const texto = String(valor ?? "").trim().toUpperCase();
  if (texto === "") return null;

  if (/^\d+$/.test(texto)) {
    const numero = Number(texto);
    return SurveyStatus[numero] === undefined ? null : (numero as SurveyStatus);
  }

  return LETRAS_VIEJAS[texto] ?? null;
};

/**
 * 🔴🔴 EL AVISO DE «PAUSADA / CERRADA / REANUDADA» NO SALÍA NUNCA.
 *
 * `Surveys/notifications.ts` decidía así:
 *
 * ```ts
 * if (["A", "P", "C"].includes(payload?.status)) {
 *   if (payload.status === "P") sub = `${term} pausada`;
 *   …
 * ```
 *
 * Y el `payload.status` lo pone el propio admin al emitir: `SurveyStatusActions`
 * manda `status: targetStatus` y `AssemblyDetail` manda `status: status`, los
 * dos valores de `SurveyStatus`, que es un enum NUMÉRICO desde 1
 * (`surveys.status` es `tinyint`). Un `includes` de letras contra un `4`, `5` o
 * `6` es siempre falso, así que el `if` entero no entraba: **ningún admin veía
 * el aviso de que otro pausó, cerró o reanudó la encuesta**.
 *
 * ⚠️ El `dispatch` está FUERA del `if`, así que el listado sí refrescaba. Por
 * eso el defecto no se nota mirando la pantalla: los datos llegan, y lo único
 * que falta es el aviso que explica por qué cambiaron.
 *
 * Devuelve `null` cuando el estado no es ninguno de los tres —un borrador o una
 * programada no anuncian nada— y el llamador no muestra toast.
 *
 * ⚠️ `ACTIVE` es siempre "reanudada" y no "iniciada": el arranque viaja por
 * `new-survey`, que es otro evento.
 */
export const subtituloDelCambioDeEstado = (
  termino: string,
  valor: unknown,
): string | null => {
  switch (estadoDelAviso(valor)) {
    case SurveyStatus.Paused:
      return `${termino} pausada`;
    case SurveyStatus.Closed:
      return `${termino} cerrada`;
    case SurveyStatus.Active:
      return `${termino} reanudada`;
    default:
      return null;
  }
};
