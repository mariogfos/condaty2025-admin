import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import React from "react";

/**
 * `Table` mide el `scrollWidth` de cada columna sin ancho fijo y se lo aplica.
 * Un `ResizeObserver` vuelve a medir cada vez que la tabla cambia de tamaño.
 *
 * 🔴 El ancho medido se guardaba con `+ 1`. En el navegador el `scrollWidth`
 * de una celda nunca es menor que su propio ancho, así que cada medición
 * agrandaba la columna 1 px, y ese cambio disparaba otra medición: la columna
 * se arrastraba de a un píxel hasta el tope y la tabla temblaba al cargar,
 * filtrar o redimensionar. Y el redondeo subpíxel (160 ↔ 161) hacía lo mismo
 * en ida y vuelta.
 *
 * jsdom no tiene layout: acá el `scrollWidth` de la celda se simula igual al
 * ancho que la tabla le puso — que es justamente lo que pasa en el navegador.
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

const header = [
  { key: "name", responsive: "", label: "Nombre" },
  { key: "detail", responsive: "", label: "Detalle" },
] as any;
const data = [{ id: "r1", name: "Fila 1", detail: "Algo" }];

let observerCallbacks: Array<() => void> = [];
/** Cuánto le suma el "navegador" al ancho aplicado, por medición. */
let subpixel: () => number = () => 0;

const appliedWidth = (el: HTMLElement) =>
  Number.parseFloat(el.style.flexBasis || el.style.width || "160");

beforeEach(() => {
  observerCallbacks = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: () => void) {
        observerCallbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return appliedWidth(this) + subpixel();
    },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as any).scrollWidth;
  subpixel = () => 0;
});

const widthsAfterResizes = (container: HTMLElement, ticks: number) => {
  const cell = () =>
    container.querySelector('[data-col-index="1"]') as HTMLElement;
  const seen = [appliedWidth(cell())];
  for (let i = 0; i < ticks; i++) {
    act(() => observerCallbacks.forEach((cb) => cb()));
    seen.push(appliedWidth(cell()));
  }
  return seen;
};

describe("Table: el ancho medido de una columna no se arrastra", () => {
  it("medir de nuevo el mismo contenido no agranda la columna", () => {
    const { container } = render(<Table header={header} data={data} />);

    const seen = widthsAfterResizes(container, 5);

    expect(new Set(seen).size).toBe(1);
  });

  it("un vaivén subpíxel de 1 px no hace temblar la columna", () => {
    let flip = false;
    subpixel = () => ((flip = !flip) ? 1 : 0);
    const { container } = render(<Table header={header} data={data} />);

    const seen = widthsAfterResizes(container, 6);

    expect(new Set(seen.slice(1)).size).toBe(1);
  });
});
