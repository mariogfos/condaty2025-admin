import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

/**
 * El panel del chat, cerrado, espera fuera de la pantalla (`right: -50%`).
 * Con `position: absolute` ese hueco contaba como contenido: el documento
 * medía 2160 px a 1440 y un desplazamiento horizontal dejaba el chat a la
 * vista, encima de los modales. Un elemento `fixed` no ensancha la página.
 */
const css = readFileSync(join(__dirname, "..", "chat.module.css"), "utf8");
const bloque = (selector: string) =>
  css.match(new RegExp(`^\\${selector}\\s*\\{([^}]*)\\}`, "m"))?.[1] ?? "";

describe("el chat cerrado no ensancha la página", () => {
  it("el panel se posiciona respecto de la ventana", () => {
    const reglas = bloque(".chatContainer")
      .replace(/\/\*[^]*?\*\//g, "")
      .replace(/&[^{]*\{[^}]*\}/g, "");

    expect(reglas).toMatch(/position:\s*fixed/);
  });
});
