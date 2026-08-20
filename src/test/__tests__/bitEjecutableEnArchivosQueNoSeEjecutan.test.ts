/**
 * CDT-48 — el bit ejecutable en archivos que nadie ejecuta.
 *
 * Medido el 2026-08-20 sobre `origin/dev`: 609 de 970 archivos versionados
 * estaban en modo 100755, entre ellos 347 `.tsx`, 188 `.css`, 8 `.md`, el
 * `README.md` y el `.env`. Ninguno se ejecuta.
 *
 * No es cosmético. El sobre de riesgo del code review automático clasifica el
 * cambio como `executable_change` y señala como culpable a un archivo markdown:
 * un clasificador que apunta al archivo equivocado hace que se deje de leer lo
 * que dice, que es exactamente lo contrario de para lo que está. Y cualquier
 * chequeo de permisos del repo arranca con 609 falsos positivos, así que no se
 * corre nunca.
 *
 * 🔴 El modo lo manda el ÍNDICE de git (`git ls-files --stage`), no el disco.
 * Un `ls -l` mide el permiso local, que depende de la máquina, del umask y de
 * si el archivo viajó por un pendrive: eso no es lo que queda commiteado.
 *
 * La regla es la que se puede sostener sin mantener una lista a mano: un
 * archivo puede llevar el bit **sólo si de verdad se ejecuta**, o sea si
 * empieza con `#!` o termina en `.sh`. Hoy no hay ninguno; el día que se
 * agregue un script de verdad, este test lo deja pasar solo.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(__dirname, "..", "..", "..");

/** Devuelve las rutas versionadas cuyo modo en el índice es 100755. */
const conBitEjecutable = (): string[] =>
  execFileSync("git", ["ls-files", "--stage"], { cwd: RAIZ, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\n")
    .filter((linea) => linea.startsWith("100755 "))
    // formato: "<modo> <sha> <etapa>\t<ruta>" — la ruta va DESPUÉS del tab, y
    // puede tener espacios, así que no se puede partir por espacios.
    .map((linea) => linea.slice(linea.indexOf("\t") + 1))
    .filter(Boolean);

const seEjecutaDeVerdad = (ruta: string): boolean => {
  if (ruta.endsWith(".sh")) return true;
  try {
    return readFileSync(join(RAIZ, ruta)).subarray(0, 2).toString("latin1") === "#!";
  } catch {
    // borrado del disco pero todavía en el índice: no es un ejecutable
    return false;
  }
};

describe("CDT-48 — el bit ejecutable", () => {
  it("la medición corre de verdad: git ve archivos versionados", () => {
    // 🔴 Sin esto, un `git` que falla o un cwd equivocado devuelven lista vacía
    // y el test de abajo pasa sin haber medido NADA.
    const versionados = execFileSync("git", ["ls-files"], { cwd: RAIZ, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\n")
      .filter(Boolean);
    expect(versionados.length).toBeGreaterThan(500);
  });

  it("no lo lleva ningún archivo que no se ejecute", () => {
    const sobran = conBitEjecutable().filter((ruta) => !seEjecutaDeVerdad(ruta));
    expect(
      sobran,
      `Estos archivos están versionados en modo 100755 y no se ejecutan.\n` +
        `Se arregla sin tocar el contenido:\n` +
        `  chmod a-x <archivo> && git update-index --chmod=-x <archivo>\n\n` +
        sobran.slice(0, 40).join("\n"),
    ).toEqual([]);
  });
});
