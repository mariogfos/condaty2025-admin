/**
 * CDT-56: a dónde vuelve el botón "atrás" del detalle de una unidad.
 *
 * El detalle de una unidad (`/units/[id]`) se abre desde TRES orígenes y no
 * tiene historial propio: `HeaderBack` es un `onClick` plano, así que
 * `router.back()` no es opción (rompería el caso de `ProfileModal`, que lo
 * abre desde un modal y volvería a la pantalla con el modal cerrado).
 * El origen viaja en el query string `?returnTo=`.
 *
 * 🔴 El destino y la etiqueta viven en la MISMA entrada a propósito. El bug
 * original (Morosos volvía a `/units`) ya estaba anunciado en la etiqueta —
 * decía "Volver a lista de unidades" antes de que nadie lo apretara — porque
 * eran dos `if` separados que se podían desincronizar. Un origen nuevo agrega
 * su clave acá y nada más.
 */
export type BackTarget = { href: string; label: string };

export const BACK_TARGETS: Record<string, BackTarget> = {
  owners: { href: "/owners", label: "Volver a residentes" },
  defaulters: { href: "/defaulters", label: "Volver a morosos" },
};

export const DEFAULT_BACK_TARGET: BackTarget = {
  href: "/units",
  label: "Volver a lista de unidades",
};

export const getBackTarget = (returnTo?: string | null): BackTarget =>
  (returnTo && BACK_TARGETS[returnTo]) || DEFAULT_BACK_TARGET;
