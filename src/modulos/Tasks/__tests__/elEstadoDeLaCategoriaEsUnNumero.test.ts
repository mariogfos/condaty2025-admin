/**
 * El estado de una categoría de tareas es un NÚMERO.
 *
 * El API pasó `task_categories.status` de `char(1)` a enum numérico el
 * 2026-09-24, con el corte 1 de la migración del módulo Tasks.
 *
 * 🔴 Un `where`/comparación con el char viejo sobre una columna numérica **no
 * rompe**: crea una herramienta inerte. Acá el síntoma sería una categoría
 * apagada que se muestra como activa, y un desplegable que manda `'X'` y el API
 * rechaza con 422.
 */
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  TASK_CATEGORY_STATUS,
  estaInactivaLaCategoria,
  normalizarEstadoDeCategoria,
} from "../taskCategoryStatus";

const sinComentarios = (relativa: string): string =>
  fs
    .readFileSync(path.resolve(__dirname, "..", relativa), "utf-8")
    // 🔴 Sin comentarios: un pin que lee el archivo entero se satisface con la
    // prosa que describe el defecto y queda verde con el bug puesto.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("el estado de la categoría de tareas es un número", () => {
  it("empieza en 1, no en 0", () => {
    expect(TASK_CATEGORY_STATUS.ACTIVE).toBe(1);
    expect(TASK_CATEGORY_STATUS.INACTIVE).toBe(2);
  });

  it("normaliza el número, el texto del número y el char viejo", () => {
    expect(normalizarEstadoDeCategoria(2)).toBe(TASK_CATEGORY_STATUS.INACTIVE);
    expect(normalizarEstadoDeCategoria("2")).toBe(TASK_CATEGORY_STATUS.INACTIVE);
    expect(normalizarEstadoDeCategoria("X")).toBe(TASK_CATEGORY_STATUS.INACTIVE);
    expect(normalizarEstadoDeCategoria("x")).toBe(TASK_CATEGORY_STATUS.INACTIVE);

    expect(normalizarEstadoDeCategoria(1)).toBe(TASK_CATEGORY_STATUS.ACTIVE);
    expect(normalizarEstadoDeCategoria("A")).toBe(TASK_CATEGORY_STATUS.ACTIVE);
  });

  /**
   * ⚠️ Lo desconocido cae a ACTIVE, que es el default que la columna ya tenía.
   * Apagar una categoría que nadie apagó la escondería de la pantalla.
   */
  it("lo desconocido cae a activo, no a apagado", () => {
    expect(normalizarEstadoDeCategoria(undefined)).toBe(TASK_CATEGORY_STATUS.ACTIVE);
    expect(normalizarEstadoDeCategoria(null)).toBe(TASK_CATEGORY_STATUS.ACTIVE);
    expect(normalizarEstadoDeCategoria("")).toBe(TASK_CATEGORY_STATUS.ACTIVE);
    expect(normalizarEstadoDeCategoria("ZZZ")).toBe(TASK_CATEGORY_STATUS.ACTIVE);
    expect(normalizarEstadoDeCategoria(0)).toBe(TASK_CATEGORY_STATUS.ACTIVE);
  });

  it("la fila apagada se reconoce como apagada", () => {
    expect(estaInactivaLaCategoria(2)).toBe(true);
    expect(estaInactivaLaCategoria("X")).toBe(true);
    expect(estaInactivaLaCategoria(1)).toBe(false);
    expect(estaInactivaLaCategoria("A")).toBe(false);
  });

  /**
   * 🔴 El pin: la pantalla no vuelve a comparar contra el char.
   *
   * Es la forma que ya mordió tres veces en este proyecto — un `=== 'A'` contra
   * una columna que pasó a `tinyint` no da error, devuelve siempre falso.
   */
  it("Tasks.tsx no compara el estado de la categoría contra el char viejo", () => {
    const fuente = sinComentarios("Tasks.tsx");

    expect(fuente).not.toMatch(/status[^\n]*===?\s*["']X["']/);
    expect(fuente).not.toMatch(/status:\s*["'][AX]["']/);
    expect(fuente).not.toMatch(/\{\s*id:\s*["'][AX]["']/);
  });

  it("y el desplegable ofrece los números del enum", () => {
    const fuente = sinComentarios("Tasks.tsx");

    expect(fuente).toMatch(/id:\s*TASK_CATEGORY_STATUS\.ACTIVE/);
    expect(fuente).toMatch(/id:\s*TASK_CATEGORY_STATUS\.INACTIVE/);
  });
});
