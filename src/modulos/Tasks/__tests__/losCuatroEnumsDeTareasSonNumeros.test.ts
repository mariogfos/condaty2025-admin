import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  STATUS_EN_ORDEN,
  TASK_COMMENT_TYPE,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_VISIBILITY,
  loEscribioElSistema,
  normalizarEstado,
  normalizarPrioridad,
  normalizarTipoDeComentario,
  normalizarVisibilidad,
} from "../taskEnums";

/**
 * 🔴 Los cuatro enums de tareas son números desde el corte 4.
 *
 * El API los pasó de `enum(...)` de MySQL a `TINYINT`. Lo que devuelve es el
 * número; lo que ACEPTA son las dos formas, durante la ventana en la que una
 * pestaña con la pantalla vieja puede seguir mandando `"pending"`.
 */
const SIN_COMENTARIOS = (ruta: string): string =>
  fs
    .readFileSync(ruta, "utf-8")
    // 🔴 REGLA 173: un pin de fuente se satisface con su PROPIO comentario, y los
    // textos de este archivo contienen justamente las formas prohibidas.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const TASKS_TSX = path.resolve(__dirname, "../Tasks.tsx");
const DETAIL_TSX = path.resolve(__dirname, "../TaskDetailModal.tsx");
const TYPES_TS = path.resolve(__dirname, "../types.ts");

describe("los cuatro enums de tareas son números", () => {
  it("🔴 todos empiezan en 1, nunca en 0", () => {
    // ⚠️ `number[]` y no la unión literal: el compilador sabe que ninguno es 0 y
    // rechaza la comparación. Lo que este test mide es lo que quedó ESCRITO en
    // los valores, no lo que el tipo promete.
    const todos: number[] = [
      ...Object.values(TASK_STATUS),
      ...Object.values(TASK_PRIORITY),
      ...Object.values(TASK_VISIBILITY),
      ...Object.values(TASK_COMMENT_TYPE),
    ];

    expect(
      todos.filter((valor) => valor === 0),
      "🔴 Un enum con un 0 hace que el `Select` compartido lo auto-elija, porque `0 == \"\"` es true en JS.",
    ).toHaveLength(0);
    expect(Math.min(...todos)).toBe(1);
  });

  it("el orden de los estados es el que publica el API", () => {
    expect(STATUS_EN_ORDEN).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("🔴 la prioridad numera por PESO: urgente es el más alto", () => {
    // El API ordena con `ORDER BY priority DESC`. Invertir esto acá pintaría
    // «urgente» donde el API puso «baja».
    expect(TASK_PRIORITY.URGENT).toBeGreaterThan(TASK_PRIORITY.HIGH);
    expect(TASK_PRIORITY.HIGH).toBeGreaterThan(TASK_PRIORITY.MEDIUM);
    expect(TASK_PRIORITY.MEDIUM).toBeGreaterThan(TASK_PRIORITY.LOW);
  });

  describe("los normalizadores", () => {
    it("aceptan el número", () => {
      expect(normalizarEstado(3)).toBe(TASK_STATUS.IN_PROGRESS);
      expect(normalizarPrioridad(4)).toBe(TASK_PRIORITY.URGENT);
      expect(normalizarVisibilidad(2)).toBe(TASK_VISIBILITY.PUBLIC);
      expect(normalizarTipoDeComentario(5)).toBe(TASK_COMMENT_TYPE.AUDIT);
    });

    it("🔴 aceptan el número como STRING: el query string no distingue", () => {
      expect(normalizarEstado("3")).toBe(TASK_STATUS.IN_PROGRESS);
      expect(normalizarPrioridad("1")).toBe(TASK_PRIORITY.LOW);
    });

    it("🔴 aceptan el nombre viejo: una pestaña con la pantalla vieja lo manda", () => {
      expect(normalizarEstado("in_progress")).toBe(TASK_STATUS.IN_PROGRESS);
      expect(normalizarEstado("CANCELLED")).toBe(TASK_STATUS.CANCELLED);
      expect(normalizarPrioridad("urgent")).toBe(TASK_PRIORITY.URGENT);
      expect(normalizarVisibilidad("inherit")).toBe(TASK_VISIBILITY.INHERIT);
      expect(normalizarTipoDeComentario("status_change")).toBe(
        TASK_COMMENT_TYPE.STATUS_CHANGE,
      );
    });

    it("🔴 devuelven null y NO un default cuando no reconocen el valor", () => {
      // Un default silencioso pintaría «solicitada» sobre una tarea completada.
      for (const basura of ["archivada", "", null, undefined, 0, 99, {}, []]) {
        expect(normalizarEstado(basura), `estado: ${JSON.stringify(basura)}`).toBeNull();
      }

      expect(normalizarPrioridad("altisima")).toBeNull();
      expect(normalizarVisibilidad(0)).toBeNull();
      expect(normalizarTipoDeComentario("otra_cosa")).toBeNull();
    });
  });

  describe("lo que anotó el sistema", () => {
    it("🔴 un comentario de persona NO es del sistema", () => {
      expect(loEscribioElSistema(TASK_COMMENT_TYPE.COMMENT)).toBe(false);
      expect(loEscribioElSistema("comment")).toBe(false);
    });

    it("la bitácora y los cambios de estado SÍ lo son", () => {
      expect(loEscribioElSistema(TASK_COMMENT_TYPE.AUDIT)).toBe(true);
      expect(loEscribioElSistema(TASK_COMMENT_TYPE.STATUS_CHANGE)).toBe(true);
      expect(loEscribioElSistema(TASK_COMMENT_TYPE.ASSIGNMENT)).toBe(true);
      expect(loEscribioElSistema(TASK_COMMENT_TYPE.RESOLUTION)).toBe(true);
    });

    it("un tipo que no se reconoce no se marca como del sistema", () => {
      // Marcarlo sería decirle al usuario que el sistema escribió algo que en
      // realidad no se pudo interpretar.
      expect(loEscribioElSistema("basura")).toBe(false);
      expect(loEscribioElSistema(null)).toBe(false);
    });
  });

  /**
   * 🔴 El `Select` compartido compara por STRING, y por eso un `id` numérico anda.
   *
   * Medido leyéndolo (`src/mk/components/forms/Select/Select.tsx:374`):
   *
   * ```ts
   * (option: any) => String(option?.[optionValue]) === String(value)
   * ```
   *
   * ⚠️ Y unas líneas antes está la guarda del `0 == ""`, que es el motivo por el
   * que los enums de este proyecto empiezan en 1: con un id 0 el `Select` lo
   * trataría como «sin elegir».
   *
   * Lo que este test pinea es la condición que hace que eso siga siendo cierto:
   * que ningún valor de los cuatro enums se convierta en `""` ni en `"0"`.
   */
  describe("los ids numéricos funcionan en el `Select` compartido", () => {
    it("ningún valor stringifica a vacío ni a cero", () => {
      const todos: number[] = [
        ...Object.values(TASK_STATUS),
        ...Object.values(TASK_PRIORITY),
        ...Object.values(TASK_VISIBILITY),
        ...Object.values(TASK_COMMENT_TYPE),
      ];

      for (const valor of todos) {
        expect(String(valor), `el valor ${valor}`).not.toBe("");
        expect(String(valor), `el valor ${valor}`).not.toBe("0");
      }
    });

    it("el `onChange` del Select puede devolver número o string, y los dos se normalizan", () => {
      // El `Select` llama `handleSelectClickElement(option[optionValue])`, o sea el
      // valor TAL CUAL está en las options —un número—, mientras un `<select>`
      // nativo da siempre string. Los dos caminos existen.
      expect(normalizarEstado(TASK_STATUS.REVIEW)).toBe(TASK_STATUS.REVIEW);
      expect(normalizarEstado(String(TASK_STATUS.REVIEW))).toBe(TASK_STATUS.REVIEW);
    });
  });

  describe("🔴 los pines de fuente: la comparación contra el string no puede volver", () => {
    const LITERALES_PROHIBIDOS = [
      "requested",
      "in_progress",
      "cancelled",
      "urgent",
      "status_change",
    ];

    it.each([
      ["Tasks.tsx", TASKS_TSX],
      ["TaskDetailModal.tsx", DETAIL_TSX],
      ["types.ts", TYPES_TS],
    ])("%s no compara contra los literales viejos", (_nombre, ruta) => {
      const fuente = SIN_COMENTARIOS(ruta);

      for (const literal of LITERALES_PROHIBIDOS) {
        expect(
          fuente.includes(`"${literal}"`),
          `🔴 Volvió un \`"${literal}"\` literal: el enum es numérico y esa comparación da false en silencio. Usá las constantes de \`taskEnums.ts\`.`,
        ).toBe(false);
      }
    });

    it("🔴 el `case` de los colores no puede comparar contra un string", () => {
      const fuentes = [SIN_COMENTARIOS(TASKS_TSX), SIN_COMENTARIOS(DETAIL_TSX)];

      for (const fuente of fuentes) {
        const casesDeString = fuente.match(/case\s+"[a-z_]+":/g) ?? [];

        expect(
          casesDeString,
          "🔴 Un `case \"…\":` sobre un enum numérico cae al `default` y pinta la etiqueta equivocada.",
        ).toHaveLength(0);
      }
    });

    it("🔴 un `as TaskStatus` sobre el valor del DOM es una mentira al compilador", () => {
      const fuentes = [SIN_COMENTARIOS(TASKS_TSX), SIN_COMENTARIOS(DETAIL_TSX)];

      for (const fuente of fuentes) {
        const asSobreElDom =
          fuente.match(/\.value as Task(Status|Priority|Visibility)/g) ?? [];

        expect(
          asSobreElDom,
          "🔴 `e.target.value` es SIEMPRE string: usá `normalizarEstado()` en vez de un `as`.",
        ).toHaveLength(0);
      }
    });
  });
});
