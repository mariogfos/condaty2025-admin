import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DebtQrSection from "../DebtQrSection/DebtQrSection";
import { QrOrderState } from "../types";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

const PENDING_QR = {
  id: "orden-1",
  order_state: QrOrderState.PENDING,
  created_at: "2026-08-28 10:00:00",
  expires_at: "2026-08-28 23:59:59",
  bank_account_id: 7,
  amount: "550.00",
  debt_dpto_ids: [11, 12],
};

const HISTORY = [
  {
    id: "orden-0",
    order_state: QrOrderState.REPLACED,
    created_at: "2026-08-27 09:00:00",
    expires_at: "2026-08-27 23:59:59",
    paid_at: null,
    amount: "550.00",
    debt_amount: "300.00",
    qr_id_banco: "QR-VIEJO",
    transaction_id: null,
    payment_id: null,
    replaces: null,
    replaced_by: { id: "orden-1" },
    debt_dpto_ids: [11],
  },
];

const mockApi = (opts: {
  pending: boolean;
  verifyState?: number;
  verifyFail?: string;
}) => {
  executeMock.mockImplementation(async (url: string) => {
    if (url.includes("/pending-qr"))
      return {
        data: {
          success: true,
          data: opts.pending
            ? { pending: true, qr: PENDING_QR }
            : { pending: false, qr: null },
        },
      };
    if (url.includes("/qr-history"))
      return { data: { success: true, data: { history: HISTORY } } };
    if (url.includes("/verify")) {
      if (opts.verifyFail)
        return { data: { success: false, message: opts.verifyFail } };
      return {
        data: {
          success: true,
          data: { id: "orden-1", order_state: opts.verifyState },
        },
      };
    }
    return { data: { success: false } };
  });
};

const verifyCalls = () =>
  executeMock.mock.calls.filter((c) => String(c[0]).includes("/verify"));

describe("DebtQrSection (DES-22/23/24)", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("con QR pendiente muestra el indicador y dispara UNA revalidación", async () => {
    mockApi({ pending: true, verifyState: QrOrderState.PENDING });
    render(<DebtQrSection debtDptoId={11} />);

    await waitFor(() =>
      expect(
        screen.getByText(/En espera de confirmación de QR Dinámico/),
      ).toBeInTheDocument(),
    );
    await waitFor(() => expect(verifyCalls()).toHaveLength(1));
    // Sigue pendiente: el indicador no desaparece
    expect(
      screen.getByText(/En espera de confirmación de QR Dinámico/),
    ).toBeInTheDocument();
  });

  it("si el banco confirma el pago avisa al padre para recargar", async () => {
    mockApi({ pending: true, verifyState: QrOrderState.PAID });
    const onPaymentConfirmed = vi.fn();
    render(
      <DebtQrSection debtDptoId={11} onPaymentConfirmed={onPaymentConfirmed} />,
    );

    await waitFor(() => expect(onPaymentConfirmed).toHaveBeenCalledTimes(1));
    expect(
      screen.getByText(/El banco confirmó el pago de este QR/),
    ).toBeInTheDocument();
  });

  it("banco sin responder: muestra el mensaje del backend y no recarga nada", async () => {
    mockApi({ pending: true, verifyFail: "El banco no responde, intente en unos minutos." });
    const onPaymentConfirmed = vi.fn();
    render(
      <DebtQrSection debtDptoId={11} onPaymentConfirmed={onPaymentConfirmed} />,
    );

    await waitFor(() =>
      expect(
        screen.getByText("El banco no responde, intente en unos minutos."),
      ).toBeInTheDocument(),
    );
    expect(onPaymentConfirmed).not.toHaveBeenCalled();
    // El indicador de espera se mantiene
    expect(
      screen.getByText(/En espera de confirmación de QR Dinámico/),
    ).toBeInTheDocument();
  });

  it("DES-30: el evento en vivo payment:confirmed refresca y avisa al padre", async () => {
    // Arranca pendiente; tras el evento, el backend ya lo da por resuelto
    let pendingNow = true;
    executeMock.mockImplementation(async (url: string) => {
      if (String(url).includes("/pending-qr"))
        return {
          data: {
            success: true,
            data: pendingNow
              ? { pending: true, qr: PENDING_QR }
              : { pending: false, qr: null },
          },
        };
      if (String(url).includes("/qr-history"))
        return { data: { success: true, data: { history: HISTORY } } };
      if (String(url).includes("/verify"))
        return {
          data: {
            success: true,
            data: { id: "orden-1", order_state: QrOrderState.PENDING },
          },
        };
      return { data: { success: false } };
    });
    const onPaymentConfirmed = vi.fn();
    render(
      <DebtQrSection debtDptoId={11} onPaymentConfirmed={onPaymentConfirmed} />,
    );
    await waitFor(() =>
      expect(
        screen.getByText(/En espera de confirmación de QR Dinámico/),
      ).toBeInTheDocument(),
    );
    expect(onPaymentConfirmed).not.toHaveBeenCalled();

    pendingNow = false;
    window.dispatchEvent(
      new CustomEvent("payment:confirmed", { detail: { paymentId: 4242 } }),
    );

    await waitFor(() => expect(onPaymentConfirmed).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText(/En espera de confirmación de QR Dinámico/),
    ).toBeNull();
  });

  it("sin QR pendiente no verifica, pero el historial sí se muestra", async () => {
    mockApi({ pending: false });
    render(<DebtQrSection debtDptoId={11} />);

    await waitFor(() =>
      expect(screen.getByText(/Historial de QR dinámicos \(1\)/)).toBeInTheDocument(),
    );
    expect(verifyCalls()).toHaveLength(0);
    expect(
      screen.queryByText(/En espera de confirmación de QR Dinámico/),
    ).toBeNull();
  });
});
