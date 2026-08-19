/**
 * CDT-89 — la SEGUNDA puerta al formulario de cobro.
 *
 * El primer arreglo cerró "Registrar Pago" y dejó escrito que
 * `getAvailableActions` era la única decisión de ese botón. No lo era: el
 * botón de detalle del mismo modal no consultaba el estado en ningún punto.
 * Su etiqueta sale de `getDetailButtonText`, que mira sólo el TIPO, y su
 * `case 3` abre el MISMO `PaymentRenderForm`. O sea: una "Reserva con multa"
 * (type 3) anulada seguía teniendo un botón que abría el cobro.
 *
 * Para el type 3 ese botón no tiene NINGUNA otra función: la reserva de una
 * multa vive en `penalty_reservation` y el `case 2` lee
 * `debtDetail.reservation`. Así que sobre una anulada no se pinta —oculto, ni
 * `disabled` ni muerto, la misma decisión de producto que "Registrar Pago"—.
 *
 * Este archivo mide las dos mitades del arreglo y su control:
 *   1. type 3 ANULADA  → el botón no está en el árbol y no hay cobro.
 *   2. type 3 normal   → el botón está y abre el cobro (si no, el arreglo se
 *      llevó puesto el caso bueno).
 *   3. types 1, 2 y 4 ANULADOS → el botón SIGUE estando y abre su VISTA DE
 *      DETALLE. Ver la expensa, la reserva o la deuda compartida de una deuda
 *      anulada es legítimo; el arreglo no puede taparlo.
 *
 * ⚠️ El botón de un type 3 dice "Ver reserva" y abre un cobro. La etiqueta
 * mentirosa NO se arregla acá: es una decisión de producto y va en ticket
 * aparte.
 */

import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import RenderView from "../RenderView/RenderView";
import { DebtStatus } from "@/types/PaymentType";

// El botón de detalle va `disabled={!hasApiData}`, y `hasApiData` es la fila
// que devuelve la API. Sin ella el botón existe pero no se puede apretar y el
// test mediría un botón muerto, no la regla.
const mocks = vi.hoisted(() => ({ debt: null as any }));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: mocks.debt ? { data: [mocks.debt], extraData: {} } : null,
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
  default: () => <div data-testid="payment-view" />,
}));
vi.mock("@/modulos/Expenses/ExpensesDetails/RenderView/RenderView", () => ({
  default: () => <div data-testid="expense-detail" />,
}));
vi.mock("@/modulos/Reservas/RenderView/RenderView", () => ({
  default: () => <div data-testid="reservation-detail" />,
}));

const deudaBase = {
  id: "d-1",
  amount: "150",
  due_at: "2030-09-30", // futuro: la regla de mora no la pisa
  shared_id: "sd-7",
  dpto: { id: 5, nro: "101", homeowner: { id: 9, name: "Mario" } },
  subcategory: { id: 11, name: "Otras deudas" },
};

const abrirDetalle = (status: number, type: number) => {
  mocks.debt = { ...deudaBase, status, type };
  render(
    <RenderView
      open
      item={mocks.debt}
      onClose={vi.fn()}
      extraData={{ dptos: [] }}
    />,
  );

  // Afirmamos que el detalle REALMENTE se pintó: un modal vacío también haría
  // pasar un `queryByTestId → null`.
  expect(screen.getByText("Detalles de la deuda")).toBeTruthy();
};

const botonDeDetalle = (nombre: string) =>
  screen.getByRole("button", { name: nombre });

describe("CDT-89 · el botón de detalle es la segunda puerta al cobro", () => {
  afterEach(() => {
    cleanup();
    mocks.debt = null;
  });

  it("type 3 ANULADA: el botón de detalle no se pinta, y no hay cobro", () => {
    abrirDetalle(DebtStatus.CANCELLED, 3);

    expect(screen.queryByRole("button", { name: "Ver reserva" })).toBeNull();
    expect(screen.queryByTestId("payment-form")).toBeNull();
  });

  it("type 3 POR COBRAR: el mismo botón está y abre el formulario de pago", () => {
    abrirDetalle(DebtStatus.PENDING, 3);

    fireEvent.click(botonDeDetalle("Ver reserva"));

    expect(screen.getByTestId("payment-form")).toBeTruthy();
  });

  // --- control: el arreglo no puede llevarse puesto el caso bueno ---

  it("type 1 ANULADA: sigue abriendo el detalle de la expensa", () => {
    abrirDetalle(DebtStatus.CANCELLED, 1);

    fireEvent.click(botonDeDetalle("Ver expensa"));

    expect(screen.getByTestId("expense-detail")).toBeTruthy();
    expect(screen.queryByTestId("payment-form")).toBeNull();
  });

  it("type 2 ANULADA: sigue abriendo el detalle de la reserva", () => {
    abrirDetalle(DebtStatus.CANCELLED, 2);

    fireEvent.click(botonDeDetalle("Ver reserva"));

    expect(screen.getByTestId("reservation-detail")).toBeTruthy();
    expect(screen.queryByTestId("payment-form")).toBeNull();
  });

  /**
   * El type 4 no abre un modal: navega a `/debts_manager/shared-debt-detail/`.
   * jsdom no implementa la navegación, así que lo que se afirma es que el
   * botón sigue ofreciéndose y apretable — que es todo lo que el arreglo
   * podría haberle roto.
   */
  it("type 4 ANULADA: sigue ofreciendo ir a la deuda compartida", () => {
    abrirDetalle(DebtStatus.CANCELLED, 4);

    const boton = botonDeDetalle("Ver deuda compartida");
    expect((boton as HTMLButtonElement).disabled).toBe(false);
  });
});
