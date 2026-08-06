/**
 * Los filtros que apuntan a una columna NUMÉRICA no pueden mandar chars legacy.
 *
 * 🔴 El bug, reportado por Mario el 2026-08-05 sobre Áreas: *"el filtro por
 * estado no me funciona cuando pido activa o inactiva, me llega vacío, solo en
 * todos me trae las áreas"*.
 *
 * La causa es siempre la misma. Varias columnas migraron de `char(1)` a
 * `tinyint` (S2-T2, S17-T8, …) y los controllers meten el valor del filtro
 * CRUDO en el `where`:
 *
 *     $model->where('expenses.status', $value[1]);   // ExpenseController
 *     $model->where('status', $filterValue);          // AreaController
 *
 * Si el front manda `"A"`, MariaDB lo convierte a **0** y sigue sin chistar.
 * El resultado depende de qué signifique el 0 en esa tabla:
 *
 *   - `areas.status`    → ningún registro en 0 → el filtro devuelve VACÍO.
 *   - `expenses.status` → 0 es CANCELLED → el filtro devuelve **los anulados**
 *     tanto en "Pagado" como en "Anulado". Medido: 21 filas en las dos
 *     opciones, y los 1015 pagados invisibles.
 *
 * ⚠️ El segundo caso es el peligroso: no falla, MIENTE. El usuario ve filas y
 * les cree.
 *
 * ⚠️ Y en los dos módulos el render de la lista YA estaba en numérico —Áreas
 * usaba `AreaStatus`, Egresos se había arreglado en S140—. Lo que quedó atrás
 * fue el filtro, las dos veces. Migrar cómo se MUESTRA un estado y olvidarse de
 * cómo se BUSCA es el patrón, no la excepción.
 *
 * ## Qué mide este test
 *
 * Para cada par (archivo, builder de opciones) de la tabla de abajo, que los
 * `id` de las opciones sean NÚMEROS y no strings de una letra. `"ALL"` está
 * permitido: es el centinela que el back saltea sin filtrar.
 *
 * ## Cómo se arma la tabla
 *
 * La fuente de verdad es la BASE, no este archivo. Para agregar un módulo,
 * medir primero el tipo de la columna:
 *
 *     SHOW COLUMNS FROM <tabla> WHERE Field = 'status';
 *
 * Si dice `tinyint`, va en esta tabla. Si dice `char`, NO —hay columnas que
 * siguen siendo char legítimamente (`guards.status`, y los enums string de
 * Asambleas, Contents y Budget) y meterlas acá daría un rojo falso.
 *
 * Estado al 2026-08-05, medido: `areas.status`, `expenses.status`,
 * `expenses.type`, `client_owners.type`, `client_owners.status` y
 * `alerts.level` son numéricas. `guards.status` y `alerts.status` siguen siendo
 * `char(1)`.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const MODULOS_ROOT = path.resolve(__dirname, "../..");

type Caso = {
  archivo: string;
  /** Nombre del array/función que arma las opciones del filtro. */
  builder: string;
  /** Para el mensaje de error: qué columna numérica termina recibiendo esto. */
  columna: string;
};

const CASOS: Caso[] = [
  { archivo: "Areas/Areas.tsx", builder: "options", columna: "areas.status" },
  {
    archivo: "Outlays/Outlays.tsx",
    builder: "getStatusOptions",
    columna: "expenses.status",
  },
];

/**
 * Recorta el array literal que sigue al builder, contando corchetes, y devuelve
 * los valores de cada `id:`.
 */
function idsDeOpciones(src: string, builder: string): string[] {
  const inicio = src.indexOf(builder);
  if (inicio === -1) return [];

  const abre = src.indexOf("[", inicio);
  if (abre === -1) return [];

  let profundidad = 1;
  let i = abre + 1;
  while (i < src.length && profundidad > 0) {
    if (src[i] === "[") profundidad++;
    else if (src[i] === "]") profundidad--;
    i++;
  }

  const bloque = src
    .slice(abre, i)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  return [...bloque.matchAll(/\bid:\s*([^,\n}]+)/g)].map((m) => m[1].trim());
}

describe("filtros sobre columnas numéricas", () => {
  it.each(CASOS)(
    "$archivo no manda chars legacy a $columna",
    ({ archivo, builder, columna }) => {
      const src = fs.readFileSync(path.join(MODULOS_ROOT, archivo), "utf-8");
      const ids = idsDeOpciones(src, builder);

      // Guarda: si el recorte deja de encontrar opciones, el test pasaría vacío.
      expect(
        ids.length,
        `No se encontraron opciones en ${archivo} (${builder}): ` +
          `el test quedó decorativo, revisá el nombre del builder.`,
      ).toBeGreaterThan(1);

      const chars = ids.filter((id) => /^["'][A-Z]["']$/.test(id));

      expect(
        chars,
        `${archivo} manda chars legacy a la columna numérica ${columna}. ` +
          `El controller los mete crudos en el where y MariaDB los convierte ` +
          `a 0: el filtro devuelve vacío, o peor, devuelve las filas del ` +
          `estado 0 haciéndolas pasar por otra cosa. Usá el enum numérico.`,
      ).toEqual([]);
    },
  );
});
