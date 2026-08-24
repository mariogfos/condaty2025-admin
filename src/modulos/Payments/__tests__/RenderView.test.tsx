import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RenderView from "../RenderView/RenderView";
import { PaymentMethod, PaymentStatus } from "../Type/PaymentType";

const mockExecute = vi.fn();
const mockShowToast = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    execute: mockExecute,
  }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    showToast: mockShowToast,
  }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children }: any) => (open ? <div>{children}</div> : null),
}));

vi.mock("@/mk/components/forms/Button/Button", () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: () => <textarea aria-label="Observaciones" />,
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: () => <input />,
}));

vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: () => <div data-testid="payments-table" />,
}));

vi.mock("@/mk/components/ui/LoadingScreen/Loading/Loading", () => ({
  default: () => <div data-testid="loading" />,
}));

describe("RenderView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({
      data: {
        data: {
          id: "pay-1",
          status: PaymentStatus.SUBMITTED,
          amount: 250,
          paid_at: "2026-06-14T10:00:00.000Z",
          dptos: "101",
          method: PaymentMethod.TRANSFER,
          owner: { name: "Mario Guzman" },
          url_file: [],
          details: [],
        },
      },
    });
  });

  it("muestra aprobar y rechazar para pagos por confirmar", async () => {
    render(
      <RenderView
        open
        onClose={vi.fn()}
        item={{
          id: "pay-1",
          status: PaymentStatus.SUBMITTED,
          amount: 250,
          paid_at: "2026-06-14T10:00:00.000Z",
          dptos: "101",
          method: PaymentMethod.TRANSFER,
          owner: { name: "Mario Guzman" },
          url_file: [],
          details: [],
        }}
        extraData={{ dptos: [] }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Aprobar pago" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rechazar pago" })).toBeInTheDocument();
    });
  });

  /**
   * El administrador puede anular CUALQUIER ingreso — decisión de Alexander
   * del 2026-08-14, consultada con Douglas.
   *
   * La pantalla exigía además `item.user`, que es quien REGISTRÓ el pago y
   * sólo se llena cuando lo carga un administrador. Un pago cargado por el
   * residente llega con `user: null` y el botón no se dibujaba, aunque el API
   * sí lo dejaba anular (`canCancelPayment()` es `isAdmin($actor)` a secas).
   *
   * Medido en PRODUCCIÓN el 2026-08-24: 1.462 pagos cobrados sin `user_id`.
   *
   * ⚠️ El control de abajo NO es decorado: sin él, borrar la condición ENTERA
   * —y no sólo el `item.user`— dejaría este archivo verde.
   */
  const pagoCobrado = (extra: Record<string, unknown> = {}) => ({
    id: "pay-1",
    status: PaymentStatus.PAID,
    amount: 250,
    paid_at: "2026-06-14T10:00:00.000Z",
    dptos: "101",
    method: PaymentMethod.TRANSFER,
    owner: { name: "Mario Guzman" },
    url_file: [],
    details: [],
    ...extra,
  });

  it("un pago cobrado que cargó el residente TAMBIÉN se puede anular", async () => {
    // ⚠️ `RenderView` REEMPLAZA el `item` con lo que trae del API al abrirse
    // (`setItem(data.data)`), así que el estado hay que ponerlo en la
    // respuesta, no sólo en la prop: con la prop sola el test mide el pago
    // `SUBMITTED` del `beforeEach` y nunca llega a esta pantalla.
    mockExecute.mockResolvedValue({
      data: { data: pagoCobrado({ user: null }) },
    });

    render(
      <RenderView
        open
        onClose={vi.fn()}
        onDel={vi.fn()}
        item={pagoCobrado({ user: null })}
        extraData={{ dptos: [] }}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Anular ingreso" })
      ).toBeInTheDocument();
    });
  });

  it("CONTROL: un pago que todavía no está cobrado no se anula", async () => {
    mockExecute.mockResolvedValue({
      data: { data: pagoCobrado({ status: PaymentStatus.SUBMITTED, user: null }) },
    });

    render(
      <RenderView
        open
        onClose={vi.fn()}
        onDel={vi.fn()}
        item={pagoCobrado({ status: PaymentStatus.SUBMITTED, user: null })}
        extraData={{ dptos: [] }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Aprobar pago" })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "Anular ingreso" })
    ).not.toBeInTheDocument();
  });
});