import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinancialDetailModal } from "../FinancialDetailModal";

const execute = vi.fn();

// `execute` es estable en useAxios; el mock lo respeta para no refetchear en
// cada render.
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute }),
}));

const workspace = {
  record: { type: "debt" as const, id: "42" },
  capabilities: {
    can_edit_amount: false,
    can_edit_penalty: false,
    can_verify_payment: false,
    can_edit_paid_at: false,
  },
  history: [
    {
      id: "event-1",
      source: "audit" as const,
      action: "PENALTY_UPDATED",
      actor: { name: "Ana Rojas" },
      occurred_at: "2026-09-02T10:00:00-04:00",
    },
  ],
};

const renderModal = (actions?: ReactNode) =>
  render(
    <FinancialDetailModal
      open
      onClose={vi.fn()}
      title="Detalle de deuda"
      record={{ type: "debt", id: 42 }}
      actions={actions}
    >
      <p>Contenido financiero</p>
    </FinancialDetailModal>,
  );

describe("FinancialDetailModal", () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue({
      data: { success: true, data: workspace },
      error: null,
    });
  });

  it("loads the workspace from the v3 route without blocking the screen", () => {
    renderModal();

    expect(execute).toHaveBeenCalledWith(
      "/v3/financial-records/debt/42/workspace",
      "GET",
      {},
      false,
      true,
    );
  });

  it("switches from the record detail to its immutable history", async () => {
    renderModal();

    fireEvent.click(await screen.findByRole("tab", { name: /Historial\s*1/ }));

    expect(screen.getByText("Multa editada")).toBeInTheDocument();
    expect(screen.getByText("Ana Rojas")).toBeInTheDocument();
    expect(screen.queryByText("Contenido financiero")).not.toBeInTheDocument();
  });

  it("shows the API message when the workspace is rejected", async () => {
    execute.mockResolvedValue({
      data: null,
      error: {
        message: "Request failed with status code 403",
        status: 403,
        data: { success: false, message: "No tienes permisos para consultar este historial." },
      },
    });
    renderModal();

    fireEvent.click(screen.getByRole("tab", { name: /Historial/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No tienes permisos para consultar este historial.",
    );
  });

  it("renders the actions passed by the module next to the close button", () => {
    renderModal(<button type="button">Más acciones</button>);

    expect(screen.getByRole("button", { name: "Más acciones" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar detalle" })).toBeInTheDocument();
  });
});
