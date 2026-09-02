import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FinancialDetailModal } from "../FinancialDetailModal";

const workspace = {
  record: { type: "debt" as const, id: "42" },
  capabilities: {
    can_edit_penalty: false,
    can_verify_payment: false,
    can_edit_paid_at: false,
  },
  history: [
    {
      id: "event-1",
      source: "audit" as const,
      action: "penalty_updated",
      actor: { name: "Ana Rojas" },
      occurred_at: "2026-09-02T10:00:00-04:00",
    },
  ],
};

describe("FinancialDetailModal", () => {
  it("opens the contextual actions without crashing the financial detail", () => {
    const onSelect = vi.fn();

    render(
      <FinancialDetailModal
        open
        onClose={vi.fn()}
        title="Detalle de deuda"
        record={{ type: "debt", id: 42 }}
        workspaceOverride={workspace}
        customActions={[
          {
            id: "copy-reference",
            label: "Copiar referencia",
            onSelect,
          },
        ]}
      >
        <p>Contenido financiero</p>
      </FinancialDetailModal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));

    const menuAction = screen.getByRole("menuitem", {
      name: "Copiar referencia",
    });
    expect(menuAction).toBeInTheDocument();
    expect(screen.getByText("Contenido financiero")).toBeInTheDocument();

    fireEvent.click(menuAction);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("switches from the record detail to its immutable history", () => {
    render(
      <FinancialDetailModal
        open
        onClose={vi.fn()}
        title="Detalle de deuda"
        record={{ type: "debt", id: 42 }}
        workspaceOverride={workspace}
      >
        <p>Contenido financiero</p>
      </FinancialDetailModal>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Historial/ }));

    expect(screen.getByText("Multa editada")).toBeInTheDocument();
    expect(screen.getByText("Ana Rojas")).toBeInTheDocument();
    expect(screen.queryByText("Contenido financiero")).not.toBeInTheDocument();
  });

  it("opens an audited correction form from the built-in menu", () => {
    render(
      <FinancialDetailModal
        open
        onClose={vi.fn()}
        title="Detalle de deuda"
        record={{ type: "debt", id: 42, penaltyAmount: 35 }}
        workspaceOverride={{
          ...workspace,
          capabilities: {
            ...workspace.capabilities,
            can_edit_penalty: true,
          },
        }}
      >
        <p>Contenido financiero</p>
      </FinancialDetailModal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Editar multa" }));

    expect(
      screen.getByRole("heading", { name: "Editar multa" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Monto en bolivianos")).toHaveValue(35);
    expect(
      screen.getByLabelText("Motivo de la corrección"),
    ).toBeRequired();
  });
});
