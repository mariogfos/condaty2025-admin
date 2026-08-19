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
 * ⚠️ ES LA SEGUNDA LÍNEA, NO LA PRIMERA. La que decide es el código HTTP
 * (`esDelMotor`): un 5xx nunca muestra su mensaje, sin mirar el texto. Una
 * lista negra de expresiones regulares es una carrera que se pierde —siempre
 * falta la próxima—, y el review lo midió: con `app.debug` prendido (como están
 * los servidores de testers) estos tres pasaban el filtro ENTEROS, con usuario
 * de base, IP, host, puerto y rutas del servidor adentro:
 *
 *   Access denied for user 'condaty'@'10.0.0.5' (using password: YES)
 *   cURL error 7: Failed to connect to internal-api port 8000
 *   file_get_contents(/var/www/storage/x): failed to open stream
 *
 * Los tres son 500, así que la regla por código los tapa sin nombrarlos. Esto
 * queda para los **4xx**, donde el mensaje sí está escrito para el usuario pero
 * puede venir contaminado: hay cinco sitios que concatenan un `getMessage()`
 * dentro de un rechazo de negocio —`ExpenseImportService:53` y `:293`,
 * `AreaBlockingService:129`, `SurveyController:725`, `DebtGroupController:145`—.
 *
 * ⚠️ Medido por el review: **cero falsos positivos** sobre 399 mensajes reales
 * del API; en un barrido ancho de 1.130 frases los 22 matches eran SQL de
 * migraciones y ejemplos dentro de docblocks.
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

/**
 * 🔴 LA REGLA QUE MANDA: lo decide el código HTTP, no el texto.
 *
 * - **5xx** — reventó el motor. El mensaje **nunca** está escrito para el
 *   usuario: sale de `$e->getMessage()`, que con `app.debug` prendido viaja
 *   crudo. Siempre el genérico.
 * - **4xx** (422, 400, 403, 404, 409…) — rechazo de negocio. El mensaje lo
 *   escribimos nosotros y es justamente lo que hay que decir.
 * - **0** — no hubo respuesta HTTP (red caída, timeout, CORS). Tampoco hay
 *   sobre, así que igual cae al genérico por falta de `message`.
 *
 * La diferencia con la lista negra es que esto es una regla y aquello una lista
 * de parches: un modo de falla nuevo del motor queda tapado sin que nadie lo
 * tenga que nombrar.
 */
const esDelMotor = (estado: unknown): boolean =>
  typeof estado === "number" && estado >= 500;

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
 * ⚠️ El sobre NO se pierde en `useAxios`: su catch lo guarda en `error.data`
 * (`err.response?.data || {}`) y el código HTTP en `error.status`
 * (`useAxios.tsx:225`, `0` si no hubo respuesta). Por eso el arreglo es acá y no
 * allá — ver el porqué en el comentario de `onSave`.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Las formas de sobre que llegan, medidas en el API
 * ────────────────────────────────────────────────────────────────────────
 *
 * - **422 de validación** (CDT-93): lo arma el handler de Laravel, no
 *   `sendError`, así que **no trae `success`**:
 *   `{ message: "La unidad es obligatoria.", errors: { dpto_id: [...] } }`.
 * - **4xx de negocio**: `sendError($msg, [], 403|404|409)` →
 *   `{ success: false, message, errors: [], debugMsg: [] }`.
 *   🔴 Ahí `errors` es un ARRAY vacío, no un objeto: por eso se descarta con
 *   `comoSobre`, si no `setErrors([])` pisaba los errores locales del form.
 * - **500 del motor**: mismo sobre, y su `message` se descarta entero por
 *   `esDelMotor`.
 * - **rechazo de negocio**: HTTP 200 con `success: false`. Ese llega por
 *   `response`, con `err` en `null`, y por eso se miran los dos.
 * - **sin sobre** (red caída, timeout, CORS): `err.data` es `{}` y
 *   `err.status` es `0`. No hay nada que mostrar y el genérico es lo correcto.
 *
 * ────────────────────────────────────────────────────────────────────────
 * ⚠️ DÓNDE SE USA ESTO, Y POR QUÉ IMPORTA (ensanchado en CDT-47)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Nació para el TOAST de guardado de `useCrud`. CDT-47 lo llevó a dos
 * pantallas de LECTURA que nunca habían mostrado texto escrito por el
 * servidor: el muro (`Reel.tsx`) y el widget «Comunidad» del dashboard
 * (`WidgetContentsResume.tsx`). Las dos renderizan ahora el `message` de
 * cualquier sobre que no sea 5xx.
 *
 * 🔴 Eso mueve el riesgo residual de lugar. Para 5xx y para la red caída la
 * regla por código tapa todo sin mirar el texto. Para los **4xx** el único
 * guardián que queda es `RASTROS_TECNICOS` —una lista de patrones, o sea la
 * carrera que este mismo archivo documenta como perdida de antemano—, y acá
 * abajo están nombrados los cinco call sites del API que concatenan un
 * `getMessage()` adentro de un rechazo de negocio.
 *
 * Es residual y conocido, no un defecto abierto: se prefiere mostrar el
 * mensaje del API en un 4xx antes que un genérico inútil («no tiene permisos»
 * no se arregla reintentando). Pero queda dicho acá porque el que sume la
 * próxima pantalla de lectura tiene que saber qué está aceptando.
 *
 * ⚠️ DEFECTO CONOCIDO, severidad baja, medido por el review de CDT-94: si un
 * campo trae varios mensajes y **uno solo** es técnico, `getFieldErrorMessage`
 * une el array en un texto y el campo entero se descarta — se pierde el mensaje
 * de negocio legítimo que venía al lado. Se prefiere así antes que colar el
 * técnico: el toast sigue diciendo algo y el campo queda sin marcar, no con
 * basura. Si alguna vez pasa de verdad, se filtra elemento por elemento.
 *
 * @param response El sobre de una respuesta 2xx, o `null` si axios rechazó.
 * @param err El error de `useAxios`: el sobre en `.data`, el código en `.status`.
 */
export const leerElErrorDelApi = (
  response: any,
  err: any,
  generico: string = MENSAJE_GENERICO_DE_GUARDADO,
): ErrorDelApi => {
  // 🔴 Primero el código, después el texto. Un 5xx no se mira: no trae errores
  // por campo (su `errors` es `[]`) y su `message` es del motor.
  if (esDelMotor(err?.status)) return { mensaje: generico, errores: null };

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
