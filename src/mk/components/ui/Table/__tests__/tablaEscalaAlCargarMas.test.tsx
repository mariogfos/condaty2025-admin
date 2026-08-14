import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

/**
 * Cuánto cuesta un "cargar más" cuando ya hay filas en pantalla.
 *
 * ## 🔴 El problema, medido el 2026-08-13
 *
 * `Table` dibujaba cada fila y cada celda dentro de un `.map()` en su propio
 * cuerpo. No había componente de fila, así que **no había nada que memoizar**:
 * cada render rehacía todas las celdas de todas las filas cargadas, aunque no
 * hubiera cambiado ninguna.
 *
 * Con scroll infinito escalaba mal, porque el costo crecía con el total:
 *
 * | filas cargadas | celdas al agregar un lote de 40 | hoy |
 * |---|---|---|
 * | 40    | 240       | 120 |
 * | 200   | 720       | 120 |
 * | 1.000 | **3.120** | 120 |
 *
 * Una sesión que cargaba 1.000 filas en 25 lotes hacía ~40.000 renders de celda
 * en vez de ~3.000. No se veía como un bug —la lista muestra lo correcto—, se
 * veía como que la app va pesada cuando hay muchos datos.
 *
 * Arreglado extrayendo `Row` como componente memoizado y estabilizando las props
 * que le bajan.
 *
 * ## Qué cuida este test
 *
 * Que el número **no vuelva a crecer con el total**. Alcanza con que una prop de
 * la fila —`header`, `onRowClick`, `onContextMenu`, `extraData`— vuelva a
 * cambiar de identidad en cada render para que el memo deje de pegar y nadie se
 * entere: la lista sigue mostrando lo correcto, sólo que otra vez lenta.
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

/**
 * ⚠️ Las filas ya cargadas CONSERVAN su objeto; sólo se agregan las nuevas.
 *
 * Es lo que hace `mergeRowsById` de `useCrud` en un "cargar más": las páginas
 * que llegan traen ids nuevos, así que las filas viejas nunca se reemplazan.
 *
 * La primera versión de este test recreaba TODAS las filas en cada lote, y con
 * eso el memo de la fila no puede pegar nunca: medía un escenario que la app no
 * produce, y hacía parecer que memoizar no servía de nada.
 */
const celdasAlAgregarUnLote = (yaCargadas: number) => {
  const contador = { n: 0 };
  const header = armarHeader(contador);

  const cargadas = filas(yaCargadas);
  const { rerender } = render(<Table header={header} data={cargadas} />);

  contador.n = 0;
  const conElLoteNuevo = [...cargadas, ...filas(LOTE).map((f, i) => ({ ...f, id: `nueva${i}` }))];
  rerender(<Table header={header} data={conElLoteNuevo} />);

  return contador.n;
};

describe("Table: qué cuesta un 'cargar más'", () => {
  it("cuesta lo mismo con 40 filas cargadas que con 1.000", () => {
    const conPocas = celdasAlAgregarUnLote(40);
    const conMuchas = celdasAlAgregarUnLote(1000);

    expect(
      conMuchas,
      `Agregar un lote de 40 sobre 1.000 filas costó ${conMuchas} celdas y sobre 40 filas costó ${conPocas}. ` +
        "Si el número creció con el total, el memo de `Row` dejó de pegar: casi seguro alguna prop que baja a la fila " +
        "(`header`, `onRowClick`, `onContextMenu`, `extraData`) volvió a cambiar de identidad en cada render.",
    ).toBe(conPocas);
  });

  it("sólo re-renderiza el lote nuevo, no lo que ya estaba", () => {
    // 🔴 Los números de antes de memoizar la fila (medidos el 2026-08-13):
    //      40 cargadas   →   240
    //      200 cargadas  →   720
    //      1.000 cargadas → 3.120
    //    Crecían con el total. Ahora son constantes: sólo el lote nuevo.
    const soloElLoteNuevo = LOTE * 3;

    expect(celdasAlAgregarUnLote(40)).toBe(soloElLoteNuevo);
    expect(celdasAlAgregarUnLote(200)).toBe(soloElLoteNuevo);
    expect(celdasAlAgregarUnLote(1000)).toBe(soloElLoteNuevo);
  });
});
