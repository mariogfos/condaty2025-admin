import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

/**
 * Cuánto cuesta un "cargar más" cuando ya hay filas en pantalla.
 *
 * ## 🔴 Lo medido el 2026-08-13
 *
 * `Table` dibuja cada fila y cada celda dentro de un `.map()` en su propio
 * cuerpo. No hay componente de fila, así que **no hay nada que memoizar**: cada
 * vez que `Table` se renderiza, se rehacen TODAS las celdas de TODAS las filas
 * cargadas, aunque el 97% no haya cambiado.
 *
 * Con scroll infinito eso escala mal. Medido con este mismo test:
 *
 * | filas cargadas | celdas al agregar un lote de 40 |
 * |---|---|
 * | 40    | 240   |
 * | 200   | 720   |
 * | 1.000 | **3.120** |
 *
 * Debería ser 120 en los tres casos: sólo las 40 filas nuevas × 3 columnas. El
 * costo crece con el total, así que una sesión de scroll que carga 1.000 filas
 * en 25 lotes hace ~40.000 renders de celda en vez de ~3.000.
 *
 * No se ve como un bug: la lista muestra lo correcto. Se ve como que "la app va
 * pesada cuando hay muchos datos".
 *
 * ## Qué fija este test
 *
 * El número de HOY, para que el día que se memoice la fila esto se ponga rojo y
 * haya que bajarlo a propósito, con la mejora medida al lado. Es un termómetro,
 * no una prohibición: si sube, alguien empeoró el escalado sin darse cuenta.
 *
 * ⚠️ Cuenta llamadas a `onRender` de cada columna, no nodos del DOM: lo que
 * importa es el trabajo de React, no cuántos `<span>` quedaron.
 */

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    store: {},
    setStore: vi.fn(),
    user: { id: 1 },
    userCan: () => true,
    showToast: vi.fn(),
  }),
}));
vi.mock("@/mk/hooks/useMediaQuery", () => ({ default: () => false }));
vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) mocked[key] = () => null;
  return mocked;
});

import Table from "@/mk/components/ui/Table/Table";

const LOTE = 40;

const filas = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `r${i}`,
    name: `Fila ${i}`,
    tipo: "X",
    estado: "Activo",
  }));

/** Cada llamada a `onRender` es una celda que React volvió a construir. */
const armarHeader = (contador: { n: number }) =>
  ["name", "tipo", "estado"].map((key) => ({
    key,
    // `responsive` es obligatorio en el tipo de columna de `Table`.
    responsive: "",
    label: key,
    onRender: (p: any) => {
      contador.n++;
      return p?.item?.[key];
    },
  }));

const celdasAlAgregarUnLote = (yaCargadas: number) => {
  const contador = { n: 0 };
  const header = armarHeader(contador);

  const { rerender } = render(<Table header={header} data={filas(yaCargadas)} />);

  contador.n = 0;
  rerender(<Table header={header} data={filas(yaCargadas + LOTE)} />);

  return contador.n;
};

describe("Table: qué cuesta un 'cargar más'", () => {
  it("hoy re-renderiza TODAS las filas cargadas, no sólo el lote nuevo", () => {
    const conPocas = celdasAlAgregarUnLote(40);
    const conMuchas = celdasAlAgregarUnLote(1000);

    // El ideal sería que las dos dieran lo mismo: sólo el lote nuevo.
    const ideal = LOTE * 3;

    expect(conPocas).toBeGreaterThan(ideal);
    expect(conMuchas).toBeGreaterThan(ideal);

    // 🔴 El costo crece con el total ya cargado. Esto es lo que hay que romper
    // el día que se memoice la fila.
    expect(
      conMuchas / conPocas,
      `Con 1.000 filas cargadas, agregar 40 costó ${conMuchas} celdas; con 40 cargadas costó ${conPocas}. ` +
        "Si esta proporción bajó a ~1, alguien memoizó la fila: bajá los números de este test y dejá la mejora medida en el docblock.",
    ).toBeGreaterThan(5);
  });

  it("deja anotado el número exacto de hoy, para comparar cuando se mejore", () => {
    expect(celdasAlAgregarUnLote(40)).toBe(240);
    expect(celdasAlAgregarUnLote(200)).toBe(720);
    expect(celdasAlAgregarUnLote(1000)).toBe(3120);
  });
});
