/**
 * CDT-89 — sobre una deuda ANULADA la pantalla seguía ofreciendo
 * "Registrar Pago".
 *
 * CDT-63 cerró el lado del servidor: hoy el cobro contra una deuda anulada se
 * rechaza. Pero el botón seguía en pantalla, así que el administrador cargaba
 * el pago entero —con el comprobante en la mano y el vecino delante— y el
 * error llegaba recién al guardar. El daño no es de datos: es trabajo perdido.
 *
 * La causa raíz está en `getAvailableActions` (`../../constants`), que es la
 * regla de quién puede cobrarse y la comparten los CINCO consumidores de este
 * detalle (AllDebts, IndividualDebts, DetailSharedDebts, CreateReserva y
 * UnitFinanceHistory — `DebtsManager.tsx:9` importa otro componente,
 * `./RenderView/RenderView`). Sus dos ramas se olvidaban de CANCELLED: la de
 * `type !== 0` excluía pagada/por confirmar/parcial/condonada pero no anulada,
 * y la de `type === 0` la metía en el mismo grupo permisivo que "Por cobrar".
 *
 * ⚠️ Esa función NO era la única decisión del botón de cobro: al mismo
 * formulario se entra por DOS puertas y la segunda no miraba el estado. Está
 * medida en `CDT89SegundaPuertaDelCobro.test.tsx`, al lado de este archivo.
 *
 * Los dos casos van juntos a propósito: el de la deuda normal es el que evita
 * que el arreglo se lleve puesto al caso bueno.
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import RenderView from "../RenderView/RenderView";
import { DebtStatus } from "@/types/PaymentType";

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
  default: ({ children }: any) => <div>{children}</div>,
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

const deudaBase = {
  id: "d-1",
  type: 0, // deuda individual
  amount: "150",
  due_at: "2030-09-30", // futuro: la regla de mora no la pisa
  dpto: { id: 5, nro: "101", homeowner: { id: 9, name: "Mario" } },
  subcategory: { id: 11, name: "Otras deudas" },
};

const abrirDetalle = (status: number, type = 0) =>
  render(
    <RenderView
      open
      item={{ ...deudaBase, status, type }}
      onClose={vi.fn()}
      extraData={{ dptos: [] }}
    />,
  );

describe("CDT-89 · una deuda anulada no ofrece cobrarse", () => {
  afterEach(() => cleanup());

  it("ANULADA: no hay botón 'Registrar Pago' y sí está el cartel de estado", () => {
    abrirDetalle(DebtStatus.CANCELLED);

    // Afirmamos que el detalle REALMENTE se pintó antes de mirar la ausencia
    // del botón: un modal vacío también haría pasar un `queryByText → null`.
    expect(screen.getByText("Detalles de la deuda")).toBeTruthy();

    expect(screen.queryByText("Registrar Pago")).toBeNull();
    expect(screen.getByText("Esta deuda está anulada")).toBeTruthy();
  });

  it("POR COBRAR: el botón sigue estando y no aparece ningún cartel de anulada", () => {
    abrirDetalle(DebtStatus.PENDING);

    expect(screen.getByText("Registrar Pago")).toBeTruthy();
    expect(screen.queryByText("Esta deuda está anulada")).toBeNull();
  });

  /**
   * La otra rama de `getAvailableActions`. Una condonación anulada (type 5)
   * ya se alcanza hoy desde "Todas" — lo dejó anotado `CDT52AccionesAlcanzables`
   * cuando midió que el detalle se abría para cualquier tipo de fila.
   */
  it("ANULADA de type !== 0: tampoco ofrece cobrarse, y el cartel está", () => {
    abrirDetalle(DebtStatus.CANCELLED, 5);

    expect(screen.getByText("Detalles de la deuda")).toBeTruthy();
    expect(screen.queryByText("Registrar Pago")).toBeNull();
    expect(screen.getByText("Esta deuda está anulada")).toBeTruthy();
  });

  it("POR COBRAR de type !== 0: el botón sigue estando", () => {
    abrirDetalle(DebtStatus.PENDING, 1);

    expect(screen.getByText("Registrar Pago")).toBeTruthy();
  });
});
