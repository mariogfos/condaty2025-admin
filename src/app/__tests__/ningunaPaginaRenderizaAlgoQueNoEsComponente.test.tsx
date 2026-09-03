import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * 🔴 Una página que renderiza algo que no es un componente no carga, y
 * TypeScript no siempre lo dice.
 *
 * Salió de `/unittypes` (2026-09-02), que hacía
 * `import { UnitsType } from '@/mk/utils/utils'` —un objeto literal— y lo
 * renderizaba como `<UnitsType />`. React tira *«Element type is invalid:
 * expected a string or a class/function but got: object»* y la ruta entera no
 * carga.
 *
 * ⚠️ **Lo dejó pasar el `: any` de esa constante.** Sin la anotación,
 * TypeScript habría rechazado el uso. Un `any` no es una comprobación menos: es
 * la comprobación que hacía falta.
 *
 * ⚠️ Y no tenía red porque el `include` de vitest —que es una **lista blanca**—
 * no cubría `src/app/**`: ninguna página de Next podía tener test. Se agregó
 * junto con este barrido.
 *
 * ────────────────────────────────────────────────────────────────────────
 * QUÉ MIDE Y QUÉ NO
 * ────────────────────────────────────────────────────────────────────────
 *
 * Llama al default export de cada `page.tsx` y mira el `type` del elemento que
 * devuelve: si es un **objeto**, la página no puede renderizar.
 *
 * 🔴 Las páginas que usan hooks en su cuerpo **no se pueden llamar así** y se
 * saltean — por eso el test afirma también **cuántas alcanzó a medir**: sin esa
 * cota, el día que todas empiecen a saltearse daría verde por vacío, que es
 * exactamente la forma de test que no mide nada.
 *
 * Al escribirlo: **49 de las 55 páginas** se miden; las 6 restantes usan hooks.
 * La cota está en 40 para dejar margen a páginas nuevas con hooks sin que el
 * barrido se ponga rojo por eso.
 *
 * ⚠️ **Su primera versión no medía nada.** Preguntaba `typeof tipo === "object"`
 * y, reinyectando el bug original, quedó **verde**: `UnitsType` ya no existe en
 * utils, así que el import daba `undefined` —que también revienta el render y no
 * es un objeto—. Enumerar las formas malas siempre deja una afuera; hay que
 * afirmar la buena.
 */
describe("las páginas de src/app", () => {
  const paginas = listarPaginas(path.resolve(__dirname, ".."));

  it("son 40 o más, para que el barrido no dé verde por vacío", () => {
    expect(paginas.length).toBeGreaterThanOrEqual(40);
  });

  // ⚠️ Timeout explícito: importa las 55 páginas, y con la suite entera
  // compitiendo por CPU pasa de los 5 s por defecto. Corriendo solo tarda ~3 s;
  // en la suite completa se pasaba y fallaba por tiempo, no por un hallazgo.
  it("ninguna renderiza algo que no es un componente", async () => {
    const rotas: string[] = [];
    let medidas = 0;

    for (const pagina of paginas) {
      let modulo: { default?: unknown };

      try {
        modulo = await import(/* @vite-ignore */ pagina.ruta);
      } catch {
        // La página no se pudo ni importar: no es lo que este test mide.
        continue;
      }

      const componente = modulo.default;

      if (typeof componente !== "function") {
        rotas.push(`${pagina.nombre}: su default export no es una función`);
        continue;
      }

      let elemento: unknown;

      try {
        elemento = (componente as () => unknown)();
      } catch {
        // Usa hooks en el cuerpo: no se puede llamar fuera de un render.
        continue;
      }

      medidas++;

      const tipo = (elemento as { type?: unknown } | null)?.type;

      // 🔴 Se afirma lo VÁLIDO, no se enumera lo inválido. La primera versión
      // preguntaba `typeof tipo === "object"` y reinyectando el bug original
      // quedó VERDE: `UnitsType` ya no existe en utils, así que el import daba
      // `undefined` — que también revienta el render y no es un objeto.
      // Enumerar las formas malas siempre deja una afuera.
      if (typeof tipo !== "function" && typeof tipo !== "string") {
        rotas.push(
          `${pagina.nombre}: renderiza \`${describir(tipo)}\`, que no es un componente — la ruta no carga`,
        );
      }
    }

    expect(medidas).toBeGreaterThanOrEqual(40);
    expect(rotas).toEqual([]);
  }, 30_000);
});

function describir(valor: unknown): string {
  if (valor === null) return "null";
  if (valor === undefined) return "undefined";
  return typeof valor;
}

function listarPaginas(raiz: string): { nombre: string; ruta: string }[] {
  const encontradas: { nombre: string; ruta: string }[] = [];

  const recorrer = (carpeta: string) => {
    for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
      const completa = path.join(carpeta, entrada.name);

      if (entrada.isDirectory()) {
        if (entrada.name !== "__tests__") {
          recorrer(completa);
        }
        continue;
      }

      if (entrada.name === "page.tsx") {
        encontradas.push({
          nombre: path.relative(raiz, completa),
          ruta: completa,
        });
      }
    }
  };

  recorrer(raiz);

  return encontradas;
}
