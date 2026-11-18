import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IncomeSummary } from "../IncomeWizard";

describe("Resumen del ingreso", () => {
  it("separa cargos históricos y sólo muestra el descuento cuando existe", () => {
    const draft = { payload: { selected: ["debt:1"] }, preview: { original: 123000, discount: 0, net: 123000,
      items: [{ gross: 120000, penalty: 2500, maintenance: 500, fees: 3000 }] } } as any;
    const view = render(<IncomeSummary advanceEnabled draft={draft} count={0} amount={0} unit="001" />);
    const summary = screen.getByRole("complementary", { name: "Resumen del ingreso" });
    expect(within(summary).getByText("Multa")).toBeInTheDocument();
    expect(within(summary).getByText("Mant. Valor")).toBeInTheDocument();
    expect(within(summary).queryByText("Descuento")).not.toBeInTheDocument();
    draft.preview.discount = 120000; draft.preview.net = 3000;
    view.rerender(<IncomeSummary advanceEnabled draft={draft} count={0} amount={0} unit="001" />);
    expect(within(summary).getByText("Descuento")).toBeInTheDocument();
    expect(within(summary).getByText("Bs 30.00")).toBeInTheDocument();
  });
  it("conserva el último resumen durante el recálculo sin añadir mensajes ni perder las filas de cargos", () => {
    const draft = { payload: { unit_id: 1, type: "E", selected: ["debt:1"] }, preview: { original: 123000, discount: 10000, net: 113000,
      items: [{ gross: 120000, penalty: 2500, maintenance: 500, fees: 3000 }] } } as any;
    const view = render(<IncomeSummary advanceEnabled draft={draft} count={0} amount={0} unit="001" />);
    const summary = screen.getByRole("complementary", { name: "Resumen del ingreso" });
    const labels = [...summary.querySelectorAll("dt")].map(node => node.textContent);
    view.rerender(<IncomeSummary advanceEnabled draft={{ ...draft, preview: null }} count={0} amount={0} unit="001" />);
    expect(summary).toHaveAttribute("aria-busy", "true");
    expect([...summary.querySelectorAll("dt")].map(node => node.textContent)).toEqual(labels);
    expect(within(summary).getByText("Bs 1,130.00")).toBeInTheDocument();
    expect(within(summary).queryByText(/Actualizando|Calculando/)).not.toBeInTheDocument();
    const updated = { ...draft, preview: { ...draft.preview, discount: 20000, net: 103000 } };
    view.rerender(<IncomeSummary advanceEnabled draft={updated} count={0} amount={0} unit="001" />);
    expect(summary).toHaveAttribute("aria-busy", "false");
    expect(within(summary).getByText("Bs 1,030.00")).toBeInTheDocument();
    view.rerender(<IncomeSummary advanceEnabled draft={{ ...updated, preview: null }} count={0} amount={0} unit="002" />);
    expect(within(summary).queryByText("Bs 1,030.00")).not.toBeInTheDocument();
    expect(within(summary).queryByText("Descuento")).not.toBeInTheDocument();
  });
});
