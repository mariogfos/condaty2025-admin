import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import React from "react";

/**
 * `Table` aplica el `style` que le pasan a un nodo del DOM.
 *
 * ## Por qué existe este archivo
 *
 * La atenuación del dato desactualizado (CDT-42) viaja como
 * `style={{ opacity: 0.5 }}` desde `useCrud`. El test de `useCrud` no puede
 * medir el otro lado del cable: ahí `Table` está mockeada, y un mock que
 * reenvía el `style` **fabrica justo lo que se quiere probar** — si la `Table`
 * real ignorara el prop, ese test seguiría verde y la tabla saldría a opacidad
 * plena en las 41 pantallas. El banner se vería; la atenuación, no. Y la mitad
 * perdida es media condición de producto: el aviso tiene que ser imposible de
 * pasar por alto.
 *
 * Así que el contrato se prueba en dos mitades honestas:
 *  - `useCrudDatoDesactualizado.test.tsx` afirma que `useCrud` PASA el prop.
 *  - este archivo afirma que `Table` lo APLICA.
 *
 * ⚠️ A propósito con un `style` arbitrario y no con la opacidad de CDT-42: lo
 * que se pinea es que el prop llegue al DOM, no un valor puntual.
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

const header = [{ key: "name", responsive: "", label: "Nombre" }] as any;

const data = [{ id: "r1", name: "Fila 1" }];

describe("Table: el prop `style` llega al DOM", () => {
  afterEach(() => {
    cleanup();
  });

  it("aplica el style recibido a un nodo real", () => {
    render(
      <Table
        header={header}
        data={data}
        style={{ opacity: 0.5, outlineWidth: "3px" }}
      />,
    );

    const celda = screen.getByText("Fila 1");
    const conStyle = celda.closest('[style*="opacity"]');

    expect(
      conStyle,
      "ningún ancestro de las filas recibió el style: la atenuación de CDT-42 no se vería",
    ).not.toBeNull();
    expect(conStyle).toHaveStyle("opacity: 0.5");
    expect(conStyle).toHaveStyle("outline-width: 3px");
  });

  it("sin style no inventa opacidad", () => {
    render(<Table header={header} data={data} />);

    const celda = screen.getByText("Fila 1");
    expect(celda.closest('[style*="opacity"]')).toBeNull();
  });
});
