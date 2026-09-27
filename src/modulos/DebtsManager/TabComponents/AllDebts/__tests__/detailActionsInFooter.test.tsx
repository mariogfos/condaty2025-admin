/**
 * Las acciones del detalle de deuda van en el PIE del modal, junto al botón
 * de historial: el historial a la izquierda y las acciones a la derecha.
 *
 * Decisión de Mario (2026-09-27), que trae a `dev` la intención del commit de
 * producción `87439942`: allá las acciones ya estaban en `buttonExtra`. Lo que
 * NO se trae son sus condiciones — las de `dev` se quedan como están (CDT-89).
 *
 * El mock de `DataModal` separa el cuerpo del pie a propósito: si las acciones
 * vuelven al cuerpo, el primer caso se pone rojo.
 */

import React from "react";
import { render, screen, cleanup, within } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import RenderView from "../RenderView/RenderView";
import { DebtStatus, DebtType } from "@/types/PaymentType";

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: null,
    execute: vi.fn().mockResolvedValue({ data: { success: false } }),
    loaded: true,
  }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, buttonExtra }: any) => (
    <div>
      <section data-testid="modal-body">{children}</section>
      <footer data-testid="modal-footer">{buttonExtra}</footer>
    </div>
  ),
}));

vi.mock("@/modulos/FinancialRecords/FinancialRecordHistoryButton", () => ({
  FinancialRecordHistoryButton: () => (
    <button type="button">Historial y correcciones</button>
  ),
}));

vi.mock("@/modulos/Payments/RenderForm/RenderForm", () => ({
  default: () => <div data-testid="payment-form" />,
}));
vi.mock("@/modulos/Payments/RenderView/RenderView", () => ({
  default: () => <div />,
}));
vi.mock("@/modulos/Expenses/ExpensesDetails/RenderView/RenderView", () => ({
  default: () => <div />,
}));
vi.mock("@/modulos/Reservas/RenderView/RenderView", () => ({
  default: () => <div />,
}));

const debt = (status: number) => ({
  id: "d-1",
  type: DebtType.NORMAL,
  status,
  amount: "150",
  due_at: "2030-09-30",
  dpto: { id: 5, nro: "101", homeowner: { id: 9, name: "Mario" } },
  subcategory: { id: 11, name: "Otras deudas" },
});

describe("detalle de deuda · las acciones van en el pie", () => {
  afterEach(() => cleanup());

  it("con acciones: van en el pie, a la derecha del historial, y no en el cuerpo", () => {
    render(
      <RenderView
        open
        item={debt(DebtStatus.PENDING)}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDel={vi.fn()}
        extraData={{ dptos: [] }}
      />,
    );

    const body = screen.getByTestId("modal-body");
    const footer = screen.getByTestId("modal-footer");
    // El detalle se pintó: sin esto, un cuerpo vacío también pasaría.
    expect(within(body).getByText("Detalles de la deuda")).toBeTruthy();

    const history = within(footer).getByRole("button", {
      name: "Historial y correcciones",
    });
    for (const name of ["Registrar Pago", "Editar", "Anular"]) {
      const action = within(footer).getByRole("button", { name });
      expect(within(body).queryByRole("button", { name })).toBeNull();
      // Historial a la izquierda: va antes que cada acción en el pie.
      expect(
        history.compareDocumentPosition(action) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("sin acciones: el pie muestra sólo el historial", () => {
    render(
      <RenderView
        open
        item={debt(DebtStatus.CANCELLED)}
        onClose={vi.fn()}
        extraData={{ dptos: [] }}
      />,
    );

    expect(screen.getByText("Esta deuda está anulada")).toBeTruthy();
    const footer = screen.getByTestId("modal-footer");
    const buttons = within(footer).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual([
      "Historial y correcciones",
    ]);
  });
});
