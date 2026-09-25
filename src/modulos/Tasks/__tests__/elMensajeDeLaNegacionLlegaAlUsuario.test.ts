import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  elMensajeDeLaRespuesta,
  salioBien,
} from "../elMensajeDeLaRespuesta";

/**
 * 🔴 Una negación del API es un 403, y axios LANZA fuera de 2xx.
 *
 * `useAxios` atrapa y deja `data` en `null`, poniendo el cuerpo en
 * `error.data`. Un `showToast(data?.message || "genérico")` cae entonces SIEMPRE
 * al genérico: el usuario ve «No se pudo guardar la tarea» en vez de «Solo
 * administradores pueden asignar tareas».
 *
 * ⚠️ El síntoma no es que falte el aviso —el toast de error aparece igual— sino
 * que **dejó de decir por qué**. Por eso nadie lo vio cuando el corte 1 pasó las
 * negaciones de las categorías a 403.
 */
const SIN_COMENTARIOS = (ruta: string): string =>
  fs
    .readFileSync(ruta, "utf-8")
    // 🔴 REGLA 173: un pin de fuente se satisface con su PROPIO comentario. El
    // texto explicativo de este archivo contiene justamente la forma prohibida.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const TASKS_TSX = path.resolve(__dirname, "../Tasks.tsx");

describe("el mensaje que el API mandó llega al usuario", () => {
  it("toma el mensaje del cuerpo cuando la respuesta es 2xx", () => {
    expect(
      elMensajeDeLaRespuesta(
        { data: { success: false, message: "Ya existe una categoría con ese código" } },
        "genérico",
      ),
    ).toBe("Ya existe una categoría con ese código");
  });

  it("🔴 toma el mensaje del ERROR cuando el API contestó 403", () => {
    expect(
      elMensajeDeLaRespuesta(
        {
          data: null,
          error: { data: { message: "Solo administradores pueden asignar tareas" } },
        },
        "No se pudo guardar la tarea",
      ),
    ).toBe("Solo administradores pueden asignar tareas");
  });

  it("cae al genérico sólo cuando el API no mandó ninguno", () => {
    expect(elMensajeDeLaRespuesta({ data: null, error: { data: {} } }, "genérico")).toBe(
      "genérico",
    );
    expect(elMensajeDeLaRespuesta({}, "genérico")).toBe("genérico");
  });

  it("un mensaje en blanco no cuenta como mensaje", () => {
    expect(
      elMensajeDeLaRespuesta({ data: { message: "   " }, error: { data: { message: "el real" } } }, "x"),
    ).toBe("el real");
  });

  it("un mensaje que no es string no se muestra: el listado devuelve el TOTAL ahí", () => {
    // 🔴 El sobre del motor pone el total en `message`. Mostrarlo como texto
    // sería un toast que dice «137».
    expect(elMensajeDeLaRespuesta({ data: { message: 137 } }, "genérico")).toBe("genérico");
  });

  it("`salioBien` exige `success === true`, no un valor camuflado", () => {
    expect(salioBien({ data: { success: true } })).toBe(true);
    expect(salioBien({ data: { success: false } })).toBe(false);
    expect(salioBien({ data: null, error: { data: { message: "403" } } })).toBe(false);
    expect(salioBien({})).toBe(false);
  });

  /**
   * 🔴 El pin: la pantalla no puede volver a leer el mensaje sólo de `data`.
   *
   * Es la forma que dejaba al usuario sin el motivo, y es fácil de reintroducir
   * copiando cualquier otro módulo del admin.
   */
  it("🔴 la pantalla no lee el mensaje sólo de `data`", () => {
    const fuente = SIN_COMENTARIOS(TASKS_TSX);
    const sitios = fuente.match(/data\?\.message\s*\|\|/g) ?? [];

    expect(
      sitios,
      "🔴 Un `data?.message || \"genérico\"` deja al usuario sin el motivo cuando el API contesta 403: usá `elMensajeDeLaRespuesta()`.",
    ).toHaveLength(0);
  });

  /** Y que el helper esté efectivamente en uso, no sólo importado. */
  it("la pantalla usa el helper en los seis avisos", () => {
    const fuente = SIN_COMENTARIOS(TASKS_TSX);
    const usos = fuente.match(/elMensajeDeLaRespuesta\(/g) ?? [];

    expect(usos.length).toBeGreaterThanOrEqual(6);
  });
});
