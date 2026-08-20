/**
 * CDT-51 — el modo móvil de las tablas estuvo DECLARADO Y APAGADO 15 meses.
 *
 * `Table.tsx` tenía `const isMobile = false;` escrito a mano, desde `94338bc7`
 * (2025-05-21, «remove useScreenSize hook»). Esa constante gobernaba las dos
 * ramas móviles: el long press que abría editar/eliminar, y la que decide si se
 * dibuja el header.
 *
 * 🔴 Lo peligroso NO era la constante: era que el código seguía DECLARANDO la
 * funcionalidad. Diez módulos pasaban su `onTabletRow` y su `renderItem`, así
 * que al leerlo parecía que el modo móvil existía. Un mantenedor no ve una
 * funcionalidad faltante — ve una que anda, y no la prueba.
 *
 * Decisión tomada: se RETIRA. El código dice la verdad.
 *
 * Este test es el criterio de aceptación del ticket: falla si la constante
 * vuelve, y falla si vuelven los props muertos. Lo que pinea no es el estilo:
 * es que nadie reintroduzca una funcionalidad DECLARADA PERO NO EJECUTADA, que
 * es el estado exacto que costó 15 meses de mentira.
 *
 * ⚠️ Si algún día el modo móvil vuelve DE VERDAD, este test tiene que fallar y
 * hay que borrarlo — con la detección de tamaño repuesta y las 10 pantallas
 * probadas en ese layout. Fallar acá es la señal de que eso se está haciendo a
 * medias.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** `__dirname` es `src/mk/components/ui/Table/__tests__`: cinco arriba es `src`. */
const SRC = join(__dirname, "..", "..", "..", "..", "..");
const TABLE = join(__dirname, "..", "Table.tsx");

const fuentes = (dir: string = SRC): string[] => {
  const salida: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__") continue;
      salida.push(...fuentes(ruta));
    } else if (/\.tsx?$/.test(e.name)) salida.push(ruta);
  }
  return salida;
};

describe("CDT-51 — el modo móvil retirado no vuelve a medias", () => {
  it("Table.tsx no declara `isMobile` como constante", () => {
    const codigo = readFileSync(TABLE, "utf-8");

    // Canario: si el archivo no se leyó, las aserciones de abajo pasarían por
    // ausencia y el test no mediría nada.
    expect(codigo.length).toBeGreaterThan(1000);

    expect(
      /const\s+isMobile\s*=\s*(false|true)\s*;/.test(codigo),
      "🔴 Volvió `const isMobile = <literal>` a Table.tsx. Eso NO enciende el " +
        "modo móvil: lo declara apagado, que es el defecto que cerró CDT-51. " +
        "Si el modo móvil vuelve, tiene que venir de una detección real de " +
        "tamaño de pantalla — y con las 10 pantallas probadas en ese layout.",
    ).toBe(false);
  });

  it("ningún archivo pasa `onTabletRow` ni `onRenderCard`", () => {
    const archivos = fuentes();
    expect(archivos.length).toBeGreaterThan(200);

    const culpables = archivos
      .filter((f) => /\bonTabletRow\b|\bonRenderCard\b/.test(readFileSync(f, "utf-8")))
      .map((f) => f.replace(SRC + "/", ""));

    expect(
      culpables,
      "🔴 Volvió un prop del modo móvil retirado. `onTabletRow` y " +
        "`onRenderCard` ya no los consume nadie: pasarlos hace creer que la " +
        "pantalla tiene modo móvil cuando no lo tiene.\n  " +
        culpables.join("\n  "),
    ).toEqual([]);
  });
});
