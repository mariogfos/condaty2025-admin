/**
 * CDT-36 — cobrar desde el detalle de deuda precargaba la fecha con el reloj
 * UTC. Bolivia es UTC-4: después de las 20:00 `toISOString()` ya devuelve el
 * día siguiente, y ese valor viaja como `item.paid_at` al formulario de pago.
 *
 * La zona horaria del proceso se fija acá mismo: si el runner corre en UTC la
 * franja rota no existe. El primer `expect` verifica que quedó aplicada
 * (offset 240) — si no, el test falla en vez de pasar por casualidad.
 */
process.env.TZ = "America/La_Paz";

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RenderView from "../RenderView/RenderView";

const capturedFormProps: any[] = [];

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
  default: (props: any) => {
    capturedFormProps.push(props);
    return <div data-testid="payment-form" />;
  },
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

const deuda = {
  id: "d-1",
  status: 1, // PENDING → muestra "Registrar Pago"
  type: 0,
  amount: "150",
  due_at: "2026-09-30",
  dpto: { id: 5, nro: "101", homeowner: { id: 9, name: "Mario" } },
  subcategory: { id: 11, name: "Otras deudas" },
};

const abrirFormularioDeCobro = () => {
  render(
    <RenderView open item={deuda} onClose={vi.fn()} extraData={{ dptos: [] }} />,
  );
  fireEvent.click(screen.getByText("Registrar Pago"));
  return capturedFormProps.at(-1)?.item;
};

describe("CDT-36 · cobrar desde el detalle de deuda precarga la fecha LOCAL", () => {
  beforeEach(() => {
    capturedFormProps.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("22:30 de Bolivia (ya es el día siguiente en UTC) precarga el día local", () => {
    vi.setSystemTime(new Date("2026-08-15T02:30:00Z"));

    expect(new Date().getTimezoneOffset()).toBe(240);
    expect(new Date().toISOString().split("T")[0]).toBe("2026-08-15");

    expect(abrirFormularioDeCobro()?.paid_at).toBe("2026-08-14");
  });

  it("mediodía: local y UTC coinciden y sigue dando el mismo día", () => {
    vi.setSystemTime(new Date("2026-08-14T16:00:00Z"));

    expect(new Date().getTimezoneOffset()).toBe(240);
    expect(new Date().toISOString().split("T")[0]).toBe("2026-08-14");

    expect(abrirFormularioDeCobro()?.paid_at).toBe("2026-08-14");
  });
});
