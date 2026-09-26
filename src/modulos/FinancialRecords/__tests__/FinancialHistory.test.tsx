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
            // El API manda el NOMBRE del enum, en mayúscula.
            action: "PENALTY_UPDATED",
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

  it("labels the baseline events, which the API sends in lower case", () => {
    render(
      <FinancialHistory
        events={[
          {
            id: "record-1",
            source: "record",
            action: "debt_created",
            occurred_at: "2026-09-01T10:00:00-04:00",
          },
        ]}
      />,
    );

    expect(screen.getByText("Deuda creada")).toBeInTheDocument();
    expect(screen.getByText("Sistema")).toBeInTheDocument();
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

  it("renders debt and income amount corrections with readable amounts", () => {
    render(
      <FinancialHistory
        events={[
          {
            id: "amount-1",
            source: "audit",
            action: "PAYMENT_AMOUNT_UPDATED",
            actor: { name: "FOS Finanzas" },
            reason: "Corrección del comprobante",
            before: { amount: 300, allocated_amount: 300 },
            after: { amount: 250, allocated_amount: 250 },
            occurred_at: "2026-09-22T10:00:00-04:00",
          },
        ]}
      />,
    );

    expect(screen.getByText("Monto de ingreso editado")).toBeInTheDocument();
    expect(screen.getByText("Monto")).toBeInTheDocument();
    expect(screen.getByText("Monto aplicado")).toBeInTheDocument();
    expect(screen.getAllByText(/BOB|Bs/).length).toBeGreaterThanOrEqual(4);
  });

  it("translates the debt status the API stores by enum name", () => {
    render(
      <FinancialHistory
        events={[
          {
            id: "amount-2",
            source: "audit",
            action: "DEBT_AMOUNT_UPDATED",
            actor: { name: "FOS Finanzas" },
            before: { amount: 100, status: "OVERDUE" },
            after: { amount: 80, status: "PAID" },
            occurred_at: "2026-09-22T10:00:00-04:00",
          },
        ]}
      />,
    );

    expect(screen.getByText("Monto de deuda editado")).toBeInTheDocument();
    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("En mora")).toBeInTheDocument();
    expect(screen.getByText("Cobrada")).toBeInTheDocument();
  });

  it("shows an unknown status as it came instead of hiding it", () => {
    render(
      <FinancialHistory
        events={[
          {
            id: "status-1",
            source: "audit",
            action: "DEBT_AMOUNT_UPDATED",
            before: { status: "SOMETHING_NEW" },
            after: { status: "PAID" },
            occurred_at: "2026-09-22T10:00:00-04:00",
          },
        ]}
      />,
    );

    expect(screen.getByText("SOMETHING_NEW")).toBeInTheDocument();
  });

  it("muestra la multa que aplica el sistema con su etiqueta", () => {
    render(
      <FinancialHistory
        notice=""
        events={[
          {
            id: "event-sys",
            source: "audit",
            action: "PENALTY_ACCRUED",
            actor: { id: null, name: "Sistema de multas", type: "SYS" },
            reason: null,
            before: { penalty_amount: 0 },
            after: { penalty_amount: 50 },
            occurred_at: "2026-09-26T10:00:00-04:00",
          } as any,
        ]}
      />,
    );

    expect(screen.getByText("Multa aplicada automáticamente")).toBeInTheDocument();
    expect(screen.getByText("Sistema de multas")).toBeInTheDocument();
  });
});
