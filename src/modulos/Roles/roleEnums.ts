/**
 * Quién define un rol — espejo de `App\Modules\Roles\Enums\RoleFixed` del API.
 *
 * 🔴🔴 **La comparación que había acá era INERTE, y el flip la volvía INVERTIDA.**
 *
 * `Roles.tsx` escondía los botones de editar y borrar con
 * `item.is_fixed == "1"`. La columna guardaba `'X'` (no fijo) y `'Y'` (fijo):
 *
 * | cuándo | qué compara | resultado |
 * |---|---|---|
 * | antes del flip | `"Y" == "1"` | **false siempre** — la guarda no escondía nada |
 * | después, sin este archivo | `1 == "1"` | **true para los NO fijos** — esconde justo los que sí se pueden tocar |
 *
 * O sea que la guarda pasaba de no hacer nada a hacer lo contrario, sin un solo
 * error en consola. Por eso este cambio va en el MISMO release que `api#451`.
 *
 * ## Por qué desde 1 y no desde 0
 *
 * `0 == ""` es `true` en JavaScript, y el `Select` compartido del admin
 * auto-elige la opción con id 0 como si el usuario la hubiera tocado (CDT-30).
 * Y en una columna con forma de booleano hay una razón extra: con `0`/`1` un
 * valor heredado sigue siendo válido con el significado contrario, y todo
 * contesta bien contestando mal.
 */

export const RoleFixed = {
  /** Lo creó la administración del condominio: se edita y se borra. */
  NO: 1,
  /** Lo crea el sistema al dar de alta el condominio: no se toca. */
  YES: 2,
} as const;

/**
 * 🔴 Compara contra el número **sin importar si llegó como número o como
 * string**.
 *
 * El payload entra al front sin tipo —`useAxios` devuelve `data: any`— y el
 * mismo campo aparece como `2` o como `"2"` según por dónde pasó. Un `===`
 * pelado contra el número falla en el segundo caso **sin ningún error**:
 * simplemente ningún rol es del sistema, que es exactamente el estado del que
 * venimos.
 */
export const loDefineElSistema = (isFixed: unknown): boolean =>
  isFixed !== null && isFixed !== undefined && Number(isFixed) === RoleFixed.YES;

/**
 * ¿Este rol tiene gente asignada?
 *
 * ⚠️ `is_assigned` **no es una columna**: lo calcula `RoleController::afterList()`
 * y lo manda como `1`/`0`. Hasta el 2026-08-28 el API no lo mandaba y esta
 * comparación era `undefined == "1"` — `false` siempre—, así que el botón de
 * borrar quedaba a la vista en un rol que el back iba a rechazar.
 */
export const tieneGenteAsignada = (isAssigned: unknown): boolean =>
  isAssigned !== null && isAssigned !== undefined && Number(isAssigned) === 1;
