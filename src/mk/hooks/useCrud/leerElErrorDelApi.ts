import { getFieldErrorMessage } from "@/mk/components/forms/ControlLabel";

/**
 * Lo único que se puede decir cuando el API no dijo nada aprovechable.
 *
 * Está acá y no suelto en `useCrud` para que el test pueda afirmar el genérico
 * sin copiarse el literal: un genérico copiado se desincroniza en silencio.
 */
export const MENSAJE_GENERICO_DE_GUARDADO =
  "No se pudo guardar. Intenta nuevamente.";

/**
 * Rastros de que el texto es del MOTOR y no para el usuario (CDT-94).
 *
 * 🔴 Es defensa en profundidad, no la defensa. El API ya sanitiza desde CDT-93
 * (`App\Mk\Controller::mensajeSeguroDe()` devuelve un texto escrito por
 * nosotros)… salvo cuando `app.debug` está encendido, que devuelve
 * `$e->getMessage()` CRUDO. O sea que un entorno con debug prendido —y los de
 * testers lo tienen— le manda el SQL al front tal cual. El front no puede
 * confiar en la sanitización del otro lado.
 *
 * Los cuatro primeros son literalmente los que pinea el test del API
 * (`UnaDeudaSinUnCampoObligatorioDiceCualFaltaTest::un_error_de_base_sigue_sin_devolver_el_sql`).
 * `incorrect ... value` es el 1366 de MySQL que originó CDT-60 y que ya viajó
 * entero una vez.
 *
 * ⚠️ Ninguno matchea contra los siete mensajes en castellano de
 * `DebtDptoController::checkValidationRules()` —verificado uno por uno—: el
 * acento de «Excepción» rompe el `\bexception\b`, y ningún mensaje nuestro
 * nombra una tabla ni un verbo SQL.
 */
const RASTROS_TECNICOS: RegExp[] = [
  /SQLSTATE/i,
  /\bSQL:/i,
  /\binsert\s+into\b|\bdelete\s+from\b|\bselect\s+.+\s+from\b|\bupdate\s+\S+\s+set\b/i,
  /\bdatabase:/i,
  /\.php\b/i,
  /(?:App|Illuminate|Symfony|Doctrine)\\/,
  /\bstack trace\b/i,
  /\bexception\b/i,
  /\bcall to (?:a member function|undefined)\b/i,
  /\bundefined (?:index|variable|property|method|array key)\b/i,
  /\bincorrect \w+ value\b/i,
  /\bon line \d+\b/i,
  /^#\d+\s/m,
];

/** Si el texto tiene pinta de venir del motor y no de una regla de negocio. */
export const esTextoTecnico = (texto: string): boolean =>
  RASTROS_TECNICOS.some((rastro) => rastro.test(texto));

export type ErrorDelApi = {
  /** El texto para el toast. Nunca vacío: cae al genérico. */
  mensaje: string;
  /** Los errores por campo, ya filtrados, o `null` si no hay ninguno usable. */
  errores: Record<string, any> | null;
};

/** El sobre sólo sirve si es un objeto plano: `[]` y `null` no traen nada. */
const comoSobre = (valor: any): Record<string, any> | null =>
  valor && typeof valor === "object" && !Array.isArray(valor) ? valor : null;

/**
 * Saca de una respuesta fallida lo que el usuario tiene que leer.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 QUÉ SE ROMPÍA (CDT-94)
 * ────────────────────────────────────────────────────────────────────────
 *
 * `useCrud.onSave` leía sólo `response?.message`, y ante CUALQUIER no-2xx axios
 * rechaza: `response` queda `null` y el toast caía siempre al genérico. El API
 * **sí** dice qué campo falta —`checkValidationRules()` valida con siete
 * mensajes escritos en castellano— y ninguno llegaba a la pantalla. Le pasaba a
 * las ~40 pantallas del kernel, no sólo a Deudas.
 *
 * ⚠️ El sobre NO se pierde en `useAxios`: su catch lo guarda en
 * `error.data` (`err.response?.data || {}`). Por eso el arreglo es acá y no
 * allá — ver el porqué en el comentario de `onSave`.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Las dos formas de sobre que llegan, medidas en el API
 * ────────────────────────────────────────────────────────────────────────
 *
 * - **422 de validación** (CDT-93): lo arma el handler de Laravel, no
 *   `sendError`, así que **no trae `success`**:
 *   `{ message: "La unidad es obligatoria.", errors: { dpto_id: [...] } }`.
 * - **500 del motor**: `sendError()` →
 *   `{ success: false, message: <genérico>, errors: [], debugMsg: [] }`.
 *   🔴 Ahí `errors` es un ARRAY vacío, no un objeto: por eso se descarta con
 *   `comoSobre`, si no `setErrors([])` pisaba los errores locales del form.
 * - **rechazo de negocio**: HTTP 200 con `success: false`. Ese llega por
 *   `response`, con `err` en `null`, y por eso se miran los dos.
 * - **sin sobre** (red caída, timeout, CORS): `err.data` es `{}`. No hay nada
 *   que mostrar y el genérico es lo correcto.
 *
 * @param response El sobre de una respuesta 2xx, o `null` si axios rechazó.
 * @param err El error de transporte de `useAxios`, con el sobre en `.data`.
 */
export const leerElErrorDelApi = (
  response: any,
  err: any,
  generico: string = MENSAJE_GENERICO_DE_GUARDADO,
): ErrorDelApi => {
  const sobre = comoSobre(err?.data) ?? comoSobre(response);

  const porCampo = comoSobre(sobre?.errors);
  let errores: Record<string, any> | null = null;
  if (porCampo) {
    const limpios: Record<string, any> = {};
    for (const campo of Object.keys(porCampo)) {
      // Se reusa el normalizador que YA pinta el error debajo del input
      // (`ControlLabel`): así lo que se filtra acá es exactamente el texto que
      // se vería, y no una aproximación que se despega de él.
      const texto = getFieldErrorMessage(porCampo, campo);
      if (texto && !esTextoTecnico(texto)) limpios[campo] = porCampo[campo];
    }
    if (Object.keys(limpios).length > 0) errores = limpios;
  }

  // ⚠️ `message` NO siempre es un string: los listados del kernel devuelven
  // `message: { total: 0 }`. Sin este typeof, un sobre raro le pasaba un objeto
  // a `showToast` y el usuario leía «[object Object]».
  const crudo = sobre?.message;
  if (typeof crudo === "string" && crudo.trim() && !esTextoTecnico(crudo)) {
    return { mensaje: crudo.trim(), errores };
  }

  // Sin `message` usable pero con campos marcados, el primero es mejor que el
  // genérico: nombra lo que hay que corregir. Hoy el 422 de Laravel siempre
  // manda `message`, así que es la red de abajo de la red de abajo.
  if (errores) {
    const primero = getFieldErrorMessage(errores, Object.keys(errores)[0]);
    if (primero) return { mensaje: primero, errores };
  }

  return { mensaje: generico, errores };
};
