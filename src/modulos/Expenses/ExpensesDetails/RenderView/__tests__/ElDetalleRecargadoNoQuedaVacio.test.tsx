import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RenderView from "../RenderView";

/**
 * 🔴 Al cerrar el detalle del pago, la expensa se recarga con `fullType=DET`,
 * que devuelve una LISTA de una fila. `setItem({ ...data.data })` dejaba el item
 * como `{ 0: {…} }`: el detalle se veía con monto en cero y sin unidad.
 */
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children, onSave, buttonExtra }: any) =>
    open ? (
      <div>
        {children}
        {onSave ? (
          <button type="button" onClick={onSave}>
            Ver pago
          </button>
        ) : null}
        {buttonExtra}
      </div>
    ) : null,
}));

vi.mock("@/mk/components/ui/Table/Table", () => ({ default: () => null }));

vi.mock("../../../../Payments/RenderView/RenderView", () => ({
  default: ({ onClose }: any) => (
    <button type="button" onClick={onClose}>
      Cerrar pago
    </button>
  ),
}));

vi.mock("@/modulos/FinancialRecords/FinancialRecordHistoryButton", () => ({
  FinancialRecordHistoryButton: () => null,
}));

vi.mock("@/i18n/translationGuards", () => ({
  shouldIgnoreValueTranslationContext: () => false,
}));

vi.mock("../RenderView.module.css", () => ({ default: {} }));

const item = {
  id: 7,
  status: 1,
  amount: "100.00",
  maintenance_amount: "0",
  penalty_amount: "0",
  payment_id: "pago-1",
  dpto: { nro: "101", description: "Torre A" },
};

describe("ExpensesDetails RenderView — la recarga después del pago", () => {
  it("conserva la expensa cuando la recarga devuelve una lista", async () => {
    const execute = vi.fn(async (url: string) =>
      url === "/v3/debt-dptos"
        ? { data: { success: true, data: [{ ...item, amount: "250.00" }] } }
        : { data: { success: true, data: { payment_id: "pago-1" } } },
    );

    render(<RenderView open onClose={vi.fn()} item={item} execute={execute} />);

    fireEvent.click(await screen.findByText("Ver pago"));
    fireEvent.click(await screen.findByText("Cerrar pago"));

    await waitFor(() =>
      expect(execute).toHaveBeenCalledWith(
        "/v3/debt-dptos",
        "GET",
        expect.objectContaining({ fullType: "DET", searchBy: 7 }),
        false,
        true,
      ),
    );
    await waitFor(() => expect(screen.getAllByText(/250/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/101/).length).toBeGreaterThan(0);
  });
});
