/**
 * A quién va dirigido un evento — espejo de
 * `App\Modules\Events\Enums\EventDestiny` del API.
 *
 * 🔴 **Era `'T'`/`'D'`/`'G'`/`'R'` y ahora es un número** (api#458).
 *
 * ## Por qué esto no es sólo un cambio de tipo
 *
 * Esta pantalla tenía **dos vocabularios a la vez**: el `Select` ofrecía las
 * letras, y dos cascadas comparaban contra `2`, `3`, `4` y `5`. Ninguna de esas
 * comparaciones dio verdadera jamás — y con el destino ya numérico **pasaban a
 * darla**, asignando listas que el back nunca manda y reventando la pantalla en
 * el `.map()` siguiente.
 *
 * Las cascadas se sacaron con este cambio. Lo que queda es un vocabulario solo,
 * y es éste.
 *
 * ## Por qué desde 1 y no desde 0
 *
 * `0 == ""` es `true` en JavaScript, y el `Select` compartido del admin
 * auto-elige la opción con id 0 como si el usuario la hubiera tocado (CDT-30).
 */

export const EventDestiny = {
  TODOS: 1,
  DEPARTAMENTOS: 2,
  GUARDIAS: 3,
  RESIDENTES: 4,
} as const;

/**
 * Las opciones del formulario, con el id que el API guarda.
 *
 * ⚠️ Reemplaza a `lComDestinies` de `@/mk/utils/utils`, que es **compartido con
 * otros módulos** y sigue en letras: Contenidos y Encuestas no se migraron. Por
 * eso Eventos se lleva su propia lista en vez de tocar la común — cambiarla
 * ahí movería el piso de dos módulos que nadie midió.
 */
export const OPCIONES_DE_DESTINO = [
  { id: EventDestiny.TODOS, name: "Todos" },
  { id: EventDestiny.DEPARTAMENTOS, name: "Departamentos" },
  { id: EventDestiny.GUARDIAS, name: "Guardias" },
  { id: EventDestiny.RESIDENTES, name: "Residentes" },
];

/**
 * 🔴 Compara contra el número **sin importar si llegó como número o como
 * string**: el payload entra sin tipo y el mismo campo viaja de las dos formas.
 */
export const esDestino = (valor: unknown, destino: number): boolean =>
  valor !== null && valor !== undefined && valor !== "" && Number(valor) === destino;

export const etiquetaDeDestino = (valor: unknown): string =>
  OPCIONES_DE_DESTINO.find((o) => esDestino(valor, o.id))?.name ?? "—";
