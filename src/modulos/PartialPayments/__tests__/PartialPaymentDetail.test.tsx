import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RenderView from "../RenderView/RenderView";

vi.mock("@/features/financial-records/FinancialDetailModal", () => ({
  FinancialDetailModal: ({ open, children, footer }: any) => open ? <section>{children(null)}{footer}</section> : null,
}));
vi.mock("@/modulos/Payments/RenderView/RenderView", () => ({
  default: ({ payment_id }: any) => <p>Detalle del ingreso {payment_id}</p>,
}));
vi.mock("../RenderFormAccount/RenderFormAccount", () => ({ default: () => null }));
vi.mock("@/modulos/Payments/RenderDel/RenderDel", () => ({ default: () => null }));

const response = {
  debt: { id: 42, amount: 690.54, status: "I", available_partial_amount: 345.27 },
  history: [{ id: 7, payment_id: "payment-7", code: "2026-000007", amount: 345.27,
    paid_at: "2026-11-12", status: "P", owner: { name: "Pagador", last_name: "Prueba" },
    files: ["https://example.invalid/comprobante.webp"] }],
};

const show = async () => {
  const execute = vi.fn().mockResolvedValue({ data: { success: true, data: response } });
  render(<RenderView open onClose={vi.fn()} item={{ id: 42 }} execute={execute} reLoad={vi.fn()} showToast={vi.fn()} />);
  await screen.findByText("Registrar pago a cuenta");
  fireEvent.click(screen.getByRole("button", { name: /Pagos aplicados/ }));
  return screen.getByRole("table", { name: "Pagos aplicados a la deuda" });
};

describe("Partial payment detail", () => {
  it("shows a compact payment row and opens its original payment ID", async () => {
    const table = await show();
    expect(within(table).getAllByRole("columnheader").map(cell => cell.textContent))
      .toEqual(["Pagado por", "Comprobante", "Estado", "Monto"]);
    expect(within(table).getByText("2026-000007")).toBeInTheDocument();
    fireEvent.click(within(table).getByRole("row", { name: "Ver pago 2026-000007" }));
    expect(screen.getByText("Detalle del ingreso payment-7")).toBeInTheDocument();
  });

  it("keeps the voucher action separate from opening the payment detail", async () => {
    const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const table = await show();
    fireEvent.click(within(table).getByRole("button", { name: "Ver comprobante" }));
    expect(download).toHaveBeenCalledOnce();
    expect(screen.queryByText("Detalle del ingreso payment-7")).not.toBeInTheDocument();
    download.mockRestore();
  });
});
