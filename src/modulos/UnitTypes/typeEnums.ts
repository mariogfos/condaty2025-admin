/**
 * Quién define un tipo de unidad — espejo de
 * `App\Modules\Types\Enums\TypeFixed` del API.
 *
 * 🔴🔴 **La comparación que había acá NUNCA dio verdadera, y no por descuido.**
 *
 * Esta pantalla escondía el botón de borrar y deshabilitaba el nombre con
 * `item.is_fixed === "A"`. La columna guardaba `'X'` (no fijo) e `'Y'` (fijo):
 * `"Y" === "A"` es **false**, siempre.
 *
 * Y el `"A"` no salió de la nada — es el "sí" de las columnas de al lado:
 *
 * | columna | tabla | "no" | "sí" |
 * |---|---|---|---|
 * | `is_fixed` | `types` | `'X'` | **`'Y'`** |
 * | `is_visible` | `type_fields` | `'X'` | **`'A'`** |
 * | `is_editable` | `type_fields` | `'X'` | **`'A'`** |
 * | `is_required` | `type_fields` | `'X'` | **`'A'`** |
 *
 * O sea que era la comparación **correcta de otra columna**, escrita sobre
 * ésta. Las cuatro son numéricas desde el 2026-08-28 (api#…) y esa trampa
 * desaparece.
 *
 * ## Por qué desde 1 y no desde 0
 *
 * `0 == ""` es `true` en JavaScript, y el `Select` compartido del admin
 * auto-elige la opción con id 0 como si el usuario la hubiera tocado (CDT-30).
 * Y en una columna con forma de booleano hay una razón extra: con `0`/`1` un
 * valor heredado sigue siendo válido con el significado contrario, y todo
 * contesta bien contestando mal.
 */

export const TypeFixed = {
  /** Lo creó la administración del condominio: se renombra y se borra. */
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
 * ningún tipo sería del sistema, que es exactamente el estado del que venimos.
 */
export const loDefineElSistema = (isFixed: unknown): boolean =>
  isFixed !== null && isFixed !== undefined && Number(isFixed) === TypeFixed.YES;
