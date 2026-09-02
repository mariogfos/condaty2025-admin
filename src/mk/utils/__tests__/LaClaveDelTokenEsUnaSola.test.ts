import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { CLAVE_DEL_TOKEN } from "../claveDelToken";

/**
 * La clave del token es UNA sola.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 ESTABA ESCRITA EN CATORCE LUGARES, Y EL `as string` CALLA AL COMPILADOR
 * ────────────────────────────────────────────────────────────────────────
 *
 * `(process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"` vivía repetida en el
 * login, el contexto de sesión, el interceptor y cinco pantallas de descarga.
 * Repetida así tiene dos formas de romperse y ninguna avisa:
 *
 *  1. la variable no está en el build → la clave queda en `"undefinedtoken"`.
 *     Hoy no rompe porque las catorce dicen lo mismo, pero el día que una lleve
 *     un valor por defecto y las otras no, el que ESCRIBE el token y el que lo
 *     LEE usan claves distintas: el usuario entra y aparece deslogueado, sin un
 *     solo error;
 *  2. alguien cambia el sufijo en un lugar. Mismo final.
 *
 * Producción llegó al mismo arreglo por el camino largo, en `7aca7439` (#749).
 */
describe("la clave del token", () => {
  it("nunca queda en «undefined»", () => {
    expect(CLAVE_DEL_TOKEN).not.toContain("undefined");
    expect(CLAVE_DEL_TOKEN.endsWith("token")).toBe(true);
  });

  /**
   * 🔴 El barrido: que nadie vuelva a armarla a mano.
   *
   * Sin esto, el próximo que necesite el token copia la expresión de al lado y
   * volvemos a catorce. Los tests quedan afuera a propósito: que afirmen la
   * clave con el literal es una comprobación INDEPENDIENTE de esta constante.
   */
  it("ningún archivo de producción la vuelve a armar a mano", () => {
    const raiz = join(process.cwd(), "src");
    const sueltos: string[] = [];

    const recorrer = (carpeta: string) => {
      for (const entrada of readdirSync(carpeta)) {
        const ruta = join(carpeta, entrada);

        if (statSync(ruta).isDirectory()) {
          if (entrada !== "__tests__") recorrer(ruta);
          continue;
        }

        if (!/\.(ts|tsx)$/.test(entrada)) continue;
        if (ruta.endsWith("claveDelToken.ts")) continue;
        if (/\.test\.tsx?$/.test(entrada)) continue;

        // ⚠️ Línea por línea y salteando los comentarios. La primera versión
        // barría el archivo entero y marcó `DownloadButton.tsx`, donde la
        // expresión aparece dentro de un docblock EXPLICANDO el problema. Un
        // barrido que no distingue el código de la prosa que lo describe
        // acusa justo a quien lo documentó.
        const esComentario = (linea: string) => {
          const limpia = linea.trim();
          return (
            limpia.startsWith("//") ||
            limpia.startsWith("*") ||
            limpia.startsWith("/*")
          );
        };

        const enCodigo = readFileSync(ruta, "utf8")
          .split("\n")
          .filter(linea => !esComentario(linea))
          .join("\n");

        if (
          /process\.env\.NEXT_PUBLIC_AUTH_IAM[^\n]*\+\s*["'`]token/.test(enCodigo)
        ) {
          sueltos.push(ruta.replace(process.cwd() + "/", ""));
        }
      }
    };

    recorrer(raiz);

    expect(sueltos, `Usá CLAVE_DEL_TOKEN. Sueltos: ${sueltos.join(", ")}`).toEqual([]);
  });
});
