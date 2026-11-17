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
});
