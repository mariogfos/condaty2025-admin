import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialHistory } from "../FinancialHistory";

describe("FinancialHistory", () => {
  it("renders the audited actor, reason and before/after values", () => {
    render(
      <FinancialHistory
        notice="Los cambios detallados se registran desde esta actualización."
        events={[
          {
            id: "event-1",
            source: "audit",
            action: "penalty_updated",
            actor: { id: "admin-1", name: "Ana Rojas", type: "ADM" },
            reason: "La multa fue cargada por error.",
            before: { penalty_amount: 50 },
            after: { penalty_amount: 0 },
            occurred_at: "2026-09-02T10:00:00-04:00",
          },
        ]}
      />,
    );

    expect(screen.getByText("Multa editada")).toBeInTheDocument();
    expect(screen.getByText("Ana Rojas")).toBeInTheDocument();
    expect(screen.getByText(/La multa fue cargada por error/)).toBeInTheDocument();
    expect(screen.getByText("Multa")).toBeInTheDocument();
    expect(screen.getAllByText(/Bs/)).toHaveLength(2);
  });

  it("keeps a workspace error visible instead of showing an empty history", () => {
    render(
      <FinancialHistory
        events={[]}
        error="No tienes permisos para consultar este historial."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No tienes permisos para consultar este historial.",
    );
    expect(
      screen.queryByText("Todavía no hay acciones registradas."),
    ).not.toBeInTheDocument();
  });

  it("expands related debt and reservation changes into readable rows", () => {
    render(
      <FinancialHistory
        events={[
          {
            id: "repair-1",
            source: "audit",
            action: "payment_state_repaired",
            actor: { name: "Ana Rojas" },
            before: {
              debt: { status: "A" },
              reservation: { status: "A" },
            },
            after: {
              debt: { status: "P" },
              reservation: { status: "L" },
            },
            occurred_at: "2026-09-02T10:00:00-04:00",
          },
        ]}
      />,
    );

    expect(screen.getByText("Deuda: Estado")).toBeInTheDocument();
    expect(screen.getByText("Reserva: Estado")).toBeInTheDocument();
    expect(screen.getAllByText("Por cobrar")).toHaveLength(2);
    expect(screen.getByText("Reserva pagada")).toBeInTheDocument();
  });
});
