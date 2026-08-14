/**
 * CDT-31 (hallazgo del mismo cruce de tipos) — una categoría PADRE con
 * movimiento directo salía en el resumen con 0.00.
 *
 * Las filas del histórico traen `category_id` como CADENA, y cuando la
 * categoría no tiene padre la API manda `""`, no `null`
 * (`UtilsGraph::formatExpenseResultsWithAllMonths` hace
 * `'' . $category['category_id']`). Las tablas preguntaban `!== null`: esas
 * filas caían en la rama de "soy hija", se buscaba un padre con id `""`, no
 * aparecía y el `return` descartaba el monto. La categoría se listaba igual
 * —viene de `categI`/`categE`— pero con total 0.00, y el total de la tabla no
 * la contaba.
 *
 * Se mide con los tipos REALES de la respuesta: ids de categoría numéricos,
 * `categ_id`/`category_id` en texto y `""` para el padre.
 *
 * ## Reinyección verificada (2026-08-14)
 *
 * Devolviendo el `if (item.category_id !== null)` de las dos tablas, los dos
 * casos se ponen ROJOS: "Bs 0.00" donde se esperaba "Bs 5,000.00".
 */
import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import TableIngresos from "../TableIngresos";
import TableEgresos from "../TableEgresos";

/** "Expensas" es categoría padre y recibe el movimiento directamente. */
const CATEGORIAS = [
  { id: 12, name: "Mantenimiento" },
  { id: 13, name: "Expensas" },
];

const FILAS = [
  {
    categ_id: "120",
    name: "Jardinería",
    category_id: "12",
    amount: "800.00",
    mes: 8,
  },
  // 🔴 Padre con movimiento directo: `category_id` llega VACÍO, no nulo.
  {
    categ_id: "13",
    name: "Expensas",
    category_id: "",
    amount: "5000.00",
    mes: 8,
  },
];

describe("CDT-31 — categoría padre con movimiento directo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["ingresos", TableIngresos],
    ["egresos", TableEgresos],
  ])("la tabla de %s le suma el monto, no la deja en cero", (_caso, Tabla) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { container } = render(
      <Tabla
        title="Total"
        title2="Total"
        categorias={CATEGORIAS}
        subcategorias={FILAS as any}
      />,
    );

    // La fila de la categoría padre lleva su monto…
    expect(container).toHaveTextContent("Expensas");
    expect(container).toHaveTextContent("5,000.00");
    // …y el total de la tabla la cuenta: 800 + 5000.
    expect(container).toHaveTextContent("5,800.00");
    // Ninguna fila se descartó por el camino.
    expect(warn).not.toHaveBeenCalled();
  });
});
