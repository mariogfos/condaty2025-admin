import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaymentQrSection from "../PaymentQrSection/PaymentQrSection";
import { QrOrderState } from "../types";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

const AUDIT = {
  id: "orden-9",
  created_at: "2026-08-28 09:00:00",
  bank_account: { id: 7, alias_holder: "Cuenta QR", account_number: "555000111" },
  category: { id: 3, name: "Expensas" },
  debts: [
    { debt_dpto_id: 11, amount: "300.00", status: "P", payment_id: 4242 },
    { debt_dpto_id: 12, amount: "250.00", status: "P", payment_id: 4242 },
  ],
  amount: "550.00",
  currency: "BOB",
  qr_id_banco: "QR-BG-1",
  order_state: QrOrderState.PAID,
  expires_at: "2026-08-28 23:59:59",
  replaces: { id: "orden-8", qr_id_banco: "QR-BG-0", order_state: QrOrderState.REPLACED },
  replaced_by: null,
  paid_at: "2026-08-28 12:30:00",
  transaction_id: "777001",
  payment_id: "4242",
  last_checked_at: "2026-08-28 12:30:01",
};

describe("PaymentQrSection (DES-25/26/27)", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("ingreso con QR: muestra origen, transacción y deudas relacionadas", async () => {
    executeMock.mockResolvedValue({ data: { success: true, data: AUDIT } });
    render(<PaymentQrSection paymentId={4242} />);

    await waitFor(() =>
      expect(screen.getByText("Origen: QR Dinámico")).toBeInTheDocument(),
    );
    expect(screen.getByText("777001")).toBeInTheDocument();
    expect(screen.getByText(/#11/)).toBeInTheDocument();
    expect(screen.getByText(/#12/)).toBeInTheDocument();
    // Linaje visible al expandir (DES-27)
    screen.getByText(/Ver auditoría completa/).click();
    await waitFor(() =>
      expect(screen.getByText(/QR-BG-0 \(Reemplazado\)/)).toBeInTheDocument(),
    );
  });

  it("ingreso manual (404): no renderiza nada", async () => {
    executeMock.mockResolvedValue({
      data: { success: false, message: "El ingreso no proviene de un QR dinámico." },
    });
    const { container } = render(<PaymentQrSection paymentId={999} />);
    await waitFor(() => expect(executeMock).toHaveBeenCalled());
    expect(container.querySelector("#payment-qr-section")).toBeNull();
  });
});
