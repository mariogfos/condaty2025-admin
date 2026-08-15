/**
 * Los enums de invitaciones, espejo de los del API.
 *
 * 🔴 **Eran chars y ahora son números.** `invitations.status` y
 * `invitations.type` se migraron a enum numérico desde 1 el 2026-08-15, con su
 * migración de datos sobre 10.682 filas. Este archivo existe para que la
 * comparación esté escrita UNA vez: antes había `=== "G"` suelto en dos
 * componentes y una tabla de etiquetas por char en un tercero.
 *
 * ⚠️ Los valores tienen que coincidir exactamente con
 * `app/Modules/Invitation/Enums/InvitationStatus.php` y `InvitationType.php`.
 * No hay nada que verifique eso automáticamente: el payload llega por HTTP y
 * entra al front como `any`.
 *
 * ## Por qué desde 1 y no desde 0
 *
 * `0 == ""` es `true` en JavaScript, y el `Select` compartido del admin
 * auto-elige la opción con id 0 como si el usuario la hubiera tocado. Ya mordió
 * una vez (CDT-30) y sobrevivió a `tsc`, a eslint y a cinco checks: lo encontró
 * abrir la pantalla.
 */

export const InvitationStatus = {
  ACTIVE: 1,
  INACTIVE: 2,
  USED: 3,
  CANCELLED: 4,
} as const;

export const InvitationType = {
  INDIVIDUAL: 1,
  GROUP: 2,
  FREQUENT: 3,
} as const;

/**
 * ⚠️ Las mismas palabras que imprime `InvitacionesExportConfig` en el back: la
 * lista y el reporte tienen que decir lo mismo.
 */
export const INVITATION_TYPE_LABELS: Record<number, string> = {
  [InvitationType.INDIVIDUAL]: "Individual",
  [InvitationType.GROUP]: "Grupal",
  [InvitationType.FREQUENT]: "Frecuente",
};

/**
 * 🔴 Compara contra el número **sin importar si llegó como número o como
 * string**.
 *
 * El payload entra al front sin tipo —`useAxios` devuelve `data: any`— y el
 * mismo campo aparece como `2` o como `"2"` según por dónde pasó: un JSON del
 * listado lo trae numérico, pero un valor que viajó por la URL de un filtro
 * vuelve como texto. Un `===` pelado contra el número falla en el segundo caso
 * **sin ningún error**: simplemente ninguna fila es grupal.
 */
export const esTipo = (valor: unknown, tipo: number): boolean =>
  valor !== null && valor !== undefined && Number(valor) === tipo;

export const esEstado = (valor: unknown, estado: number): boolean =>
  valor !== null && valor !== undefined && Number(valor) === estado;

/**
 * 🔴 Los predicados con nombre existen para que el enum se nombre UNA vez.
 *
 * `esTipo` y `esEstado` reciben un `number` pelado, así que acá ni siquiera hay
 * la media red que dan los enums de TypeScript en las apps de React Native:
 * `esEstado(x, InvitationType.GROUP)` compila perfecto y compara el estado
 * contra un tipo. Y equivocarse de case dentro del mismo enum compila en
 * cualquier caso.
 *
 * Medido el 2026-08-15 sobre la rama de la migración: cambiar el case en
 * `RenderView.tsx` no ponía **nada** en rojo, porque este archivo no tenía un
 * solo test. Ahora `__tests__/invitationEnums.test.ts` lo fija.
 */
export const esGrupal = (tipo: unknown): boolean =>
  esTipo(tipo, InvitationType.GROUP);

export const esIndividual = (tipo: unknown): boolean =>
  esTipo(tipo, InvitationType.INDIVIDUAL);

export const esFrecuente = (tipo: unknown): boolean =>
  esTipo(tipo, InvitationType.FREQUENT);

export const esAnulada = (estado: unknown): boolean =>
  esEstado(estado, InvitationStatus.CANCELLED);
