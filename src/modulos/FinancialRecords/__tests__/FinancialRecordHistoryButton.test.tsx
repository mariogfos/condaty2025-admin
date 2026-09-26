import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FinancialRecordHistoryButton } from "../FinancialRecordHistoryButton";

/**
 * El botón que las cuatro pantallas suman a su detalle: abre el modal
 * financiero directo en el Historial (los datos del registro ya están en la
 * pantalla de abajo).
 */
const execute = vi.fn(async () => ({
  data: {
    success: true,
    data: {
      record: { type: "payment", id: "p-1" },
      capabilities: {
        can_edit_amount: false,
        can_edit_penalty: false,
        can_verify_payment: false,
        can_edit_paid_at: false,
      },
      history: [
        {
          id: "baseline-payment_created-p-1",
          source: "record",
          action: "payment_created",
          actor: { name: "Ana Rojas" },
          occurred_at: "2026-09-02T10:00:00-04:00",
        },
      ],
    },
  },
  error: null,
}));

vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute }) }));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ showToast: vi.fn() }) }));

describe("FinancialRecordHistoryButton", () => {
  it("abre el modal financiero en la pestaña Historial", async () => {
    render(
      <FinancialRecordHistoryButton
        title="Detalle del ingreso"
        record={{ type: "payment", id: "p-1" }}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Historial y correcciones" }));

    expect(await screen.findByText("Ingreso registrado")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Historial/ })).toHaveAttribute("aria-selected", "true");
    expect(execute).toHaveBeenCalledWith(
      "/v3/financial-records/payment/p-1/workspace",
      "GET",
      {},
      false,
      true,
    );
  });
});
