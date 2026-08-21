/**
 * CDT-125 — un puntero de comentario que apunta a un archivo que ya no existe.
 *
 * Varios `.module.css` no repiten su motivo: lo escriben UNA vez y desde los demás
 * apuntan al archivo que lo tiene. Los tres widgets de gráficos son el caso vivo —el
 * texto estaba triplicado verbatim y se dedupó en CDT-120— y hay otros cuatro punteros
 * sueltos en comentarios de CSS.
 *
 * Esos punteros son rutas literales dentro de un comentario: nada los verifica. Un
 * rename deja los tres colgados y el motivo se pierde EN SILENCIO, que es exactamente
 * la falla que este proyecto persigue: una doc vieja no se lee como incompleta, se lee
 * como cierta, y manda al próximo a proteger el archivo equivocado.
 *
 * Se mide el conjunto entero, no los tres widgets: cualquier puntero nuevo escrito con
 * la misma forma queda cubierto sin tocar este test.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const RAIZ = join(__dirname, "..", "..");

const archivos = (re: RegExp, dir: string = RAIZ): string[] => {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...archivos(re, ruta));
    else if (re.test(entrada.name)) salida.push(ruta);
  }
  return salida;
};

/**
 * Qué cuenta como puntero: lo que va entre backticks y tiene forma de ruta del repo.
 *
 * El backtick es lo que separa el puntero de la prosa. Sin él entran las menciones
 * informales —«añadir al Activities.module.css», «similar a Config.module.css»—, que no
 * son punteros a un motivo y meterlas daría rojo por escribir castellano.
 */
const esPuntero = (t: string): boolean =>
  t.startsWith("src/") || /\.(module\.)?(css|scss|tsx?)$/.test(t);

describe("CDT-125 — los punteros de comentario de los .css apuntan a algo que existe", () => {
  it("todo puntero entre backticks resuelve a un archivo o carpeta del repo", () => {
    const reales = archivos(/\./).map((r) => relative(RAIZ, r).split(sep).join("/"));
    // `src/x/y` se escribe desde la raíz del repo; el resto de las rutas son relativas
    // a `src`, así que se compara por sufijo de ruta —no por nombre suelto— para que
    // `WidgetGrafBalance/WidgetGrafBalance.module.css` no matchee otro homónimo.
    const existe = (p: string): boolean => {
      const sinSrc = p.replace(/^src\//, "");
      return reales.some(
        (r) => r === sinSrc || r.endsWith(`/${sinSrc}`) || r.startsWith(`${sinSrc}/`),
      );
    };

    const punteros: { puntero: string; desde: string }[] = [];
    for (const ruta of archivos(/\.(css|scss)$/)) {
      const texto = readFileSync(ruta, "utf-8");
      for (const m of texto.matchAll(/`([A-Za-z0-9_@/.-]+)`/g)) {
        if (esPuntero(m[1])) {
          punteros.push({ puntero: m[1], desde: relative(RAIZ, ruta) });
        }
      }
    }

    // Canario: si no encontró ninguno, dejó de medir —y la forma del puntero cambió.
    expect(
      punteros.length,
      `No se encontró NINGÚN puntero con backticks en los .css. O se borraron todos, o ` +
        `cambió la forma de escribirlos y este test dejó de medir: volvé a medirla.`,
    ).toBeGreaterThan(4);

    expect(
      punteros.filter((p) => !existe(p.puntero)),
      `Estos comentarios apuntan a un archivo que NO existe. El motivo de por qué ese ` +
        `CSS es como es vive del otro lado del puntero: colgado, se pierde en silencio ` +
        `y el próximo lo lee como cierto igual. Corregí la ruta, o traé el motivo de ` +
        `vuelta al archivo que lo necesita.`,
    ).toEqual([]);
  });
});
