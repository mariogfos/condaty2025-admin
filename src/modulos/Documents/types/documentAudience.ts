/**
 * A quién va dirigido un documento del condominio — `documents.for_to`.
 *
 * ```
 * 'A' → 1  Todos        el guardia y el residente lo ven
 * 'O' → 2  Residentes
 * 'G' → 3  Guardias
 * ```
 *
 * 🔴 **Antes esto eran tres letras sueltas repartidas en tres archivos**: el
 * `id` de las opciones del formulario, las claves del mapa `DocDestiny` del
 * detalle, y el filtro del listado. Con la columna numérica, `DocDestiny['A']`
 * pasa a ser `DocDestiny[1]` — y un mapa con las claves viejas devuelve
 * `undefined`: la "Segmentación" del detalle sale **en blanco, sin un solo
 * error**.
 *
 * ⚠️ Los valores arrancan en **1**. El `Select` compartido de este admin
 * auto-elige la opción cuyo `id` es `0`, porque `0 == ""` es `true`.
 *
 * Sincronizado con el backend `App\Modules\Documents\Enums\DocumentAudience`
 * y con `enums-ssot.json`.
 */
export const DOCUMENT_AUDIENCE = {
  TODOS: 1,
  RESIDENTES: 2,
  GUARDIAS: 3,
} as const;

export type DocumentAudience =
  (typeof DOCUMENT_AUDIENCE)[keyof typeof DOCUMENT_AUDIENCE];

/** Las opciones del formulario y del filtro, en el orden en que se muestran. */
export const lOptionsFortoDocument: { id: number; name: string }[] = [
  { id: DOCUMENT_AUDIENCE.TODOS, name: "Guardias y residentes" },
  { id: DOCUMENT_AUDIENCE.RESIDENTES, name: "Residentes" },
  { id: DOCUMENT_AUDIENCE.GUARDIAS, name: "Guardias" },
];

/**
 * El nombre de una audiencia, para el detalle.
 *
 * ⚠️ Normaliza con `Number()` porque el valor puede llegar como string desde
 * el sobre JSON: `"2"` y `2` tienen que dar lo mismo.
 */
export const nombreDeAudiencia = (valor: unknown): string =>
  lOptionsFortoDocument.find((o) => o.id === Number(valor))?.name ?? "";
