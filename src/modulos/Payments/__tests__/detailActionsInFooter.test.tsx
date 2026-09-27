/**
 * Las acciones del detalle de ingreso van en el PIE del modal, junto al botón
 * de historial: el historial a la izquierda y las acciones a la derecha.
 *
 * Decisión de Mario (2026-09-27), que trae a `dev` la intención del commit de
 * producción `87439942`: allá las acciones ya estaban en `buttonExtra`. Lo que
 * NO se trae son sus condiciones — `dev` sacó el `&& item.user` de «Anular
 * ingreso» a propósito (ver el comentario en `RenderView.tsx`).
 *
 * El mock de `DataModal` separa el cuerpo del pie a propósito: si las acciones
 * vuelven al cuerpo, el primer caso se pone rojo.
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RenderView from "../RenderView/RenderView";
import { PaymentMethod, PaymentStatus } from "../Type/PaymentType";

const mockExecute = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: mockExecute }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 1 }, showToast: vi.fn() }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children, buttonExtra }: any) =>
    open ? (
      <div>
        <section data-testid="modal-body">{children}</section>
        <footer data-testid="modal-footer">{buttonExtra}</footer>
      </div>
    ) : null,
}));

vi.mock("@/modulos/FinancialRecords/FinancialRecordHistoryButton", () => ({
  FinancialRecordHistoryButton: () => (
    <button type="button">Historial y correcciones</button>
  ),
}));

vi.mock("@/mk/components/forms/Button/Button", () => ({
  default: ({ children, onClick, variant, ...props }: any) => (
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

const payment = (status: number) => ({
  id: "pay-1",
  status,
  amount: 250,
  paid_at: "2026-06-14T10:00:00.000Z",
  dptos: "101",
  method: PaymentMethod.TRANSFER,
  owner: { name: "Mario Guzman" },
  url_file: [],
  details: [],
});

/**
 * ⚠️ `RenderView` reemplaza el `item` con lo que trae del API al abrirse, así
 * que el estado va en la respuesta además de en la prop.
 */
const openDetail = (status: number, onDel?: () => void) => {
  mockExecute.mockResolvedValue({ data: { data: payment(status) } });
  render(
    <RenderView
      open
      onClose={vi.fn()}
      onDel={onDel}
      item={payment(status)}
      extraData={{ dptos: [] }}
    />,
  );
};

describe("detalle de ingreso · las acciones van en el pie", () => {
  beforeEach(() => vi.clearAllMocks());

  it("con acciones: van en el pie, a la derecha del historial, y no en el cuerpo", async () => {
    openDetail(PaymentStatus.PAID, vi.fn());

    const footer = screen.getByTestId("modal-footer");
    const names = ["Anular ingreso", "Ver Recibo", "Compartir por WhatsApp"];
    await waitFor(() => {
      for (const name of names) {
        expect(within(footer).getByRole("button", { name })).toBeTruthy();
      }
    });

    const body = screen.getByTestId("modal-body");
    const history = within(footer).getByRole("button", {
      name: "Historial y correcciones",
    });
    for (const name of names) {
      expect(within(body).queryByRole("button", { name })).toBeNull();
      // Historial a la izquierda: va antes que cada acción en el pie.
      expect(
        history.compareDocumentPosition(
          within(footer).getByRole("button", { name }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("sin acciones: el pie muestra sólo el historial", async () => {
    openDetail(PaymentStatus.REJECTED);

    // El detalle se pintó (ya no está cargando): recién ahí vale mirar el pie.
    await waitFor(() => {
      expect(screen.getByText("Motivo de rechazo")).toBeTruthy();
    });

    const footer = screen.getByTestId("modal-footer");
    const buttons = within(footer).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual([
      "Historial y correcciones",
    ]);
  });
});
