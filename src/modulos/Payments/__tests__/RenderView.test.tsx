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
});