/**
 * CDT-43 — el día de HOY se sacaba del reloj con `new Date().toISOString()`,
 * que devuelve el día en UTC. Bolivia es UTC-4: entre las 20:00 y la medianoche
 * ese cálculo ya da MAÑANA. Cuatro horas por día en que el admin cree que es
 * otro día.
 *
 * El peor caso no es un valor precargado sino un ESTADO QUE SE MUESTRA: una
 * deuda que vence HOY se pintaba "En mora" a partir de las 20:00. El usuario ve
 * una mentira sobre su propia deuda.
 *
 * La zona horaria se fija acá mismo y se ANCLA con el offset: si el runner
 * corriera en UTC la franja rota no existiría y el test pasaría por casualidad.
 */
process.env.TZ = "America/La_Paz";

import React from "react";
import { render, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RenderView from "../RenderView/RenderView";
import { getStatusConfig, DEBT_STATUS_CONFIG } from "../../constants";
import {
  validDateFuture,
  validDateGreater,
  validDateLess,
} from "@/components/validators/rulesApp";
import { DebtStatus } from "@/types/PaymentType";

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ data: null, execute: vi.fn(), loaded: true }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/modulos/Payments/RenderForm/RenderForm", () => ({
  default: () => <div />,
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

// 22:30 en La Paz del 14/08; en UTC ya es el 15.
const LA_NOCHE_DEL_14 = new Date("2026-08-15T02:30:00Z");
// mediodía del 14: local y UTC coinciden, el control sano.
const EL_MEDIODIA_DEL_14 = new Date("2026-08-14T16:00:00Z");

const deudaQueVenceHoy = {
  id: "d-1",
  status: DebtStatus.PENDING,
  type: 0,
  amount: "150",
  due_at: "2026-08-14",
  dpto: { id: 5, nro: "101", homeowner: { id: 9, name: "Mario" } },
  subcategory: { id: 11, name: "Otras deudas" },
};

const estadoQueSeMuestra = (item: any) => {
  const { container } = render(
    <RenderView open item={item} onClose={vi.fn()} extraData={{ dptos: [] }} />,
  );
  return within(container);
};

const anclarLaFranja = (instante: Date) => {
  vi.setSystemTime(instante);
  // Sin este ancla el test pasa en cualquier zona horaria y no mide nada.
  expect(new Date().getTimezoneOffset()).toBe(240);
};

describe("CDT-43 · el día de HOY es el LOCAL, no el UTC", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe("estado que se muestra en el detalle de deuda", () => {
    it("22:30 del 14: una deuda que vence HOY no está en mora", () => {
      anclarLaFranja(LA_NOCHE_DEL_14);
      // El día UTC ya es el 15: ese es exactamente el valor que rompía.
      expect(new Date().toISOString().split("T")[0]).toBe("2026-08-15");

      const vista = estadoQueSeMuestra(deudaQueVenceHoy);

      expect(vista.queryByText("En mora")).toBeNull();
      expect(vista.getByText("Por cobrar")).toBeTruthy();
    });

    it("22:30 del 14: una deuda vencida AYER sigue en mora", () => {
      anclarLaFranja(LA_NOCHE_DEL_14);

      const vista = estadoQueSeMuestra({
        ...deudaQueVenceHoy,
        due_at: "2026-08-13",
      });

      expect(vista.getByText("En mora")).toBeTruthy();
    });

    it("mediodía del 14: la que vence hoy tampoco está en mora", () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);

      const vista = estadoQueSeMuestra(deudaQueVenceHoy);

      expect(vista.queryByText("En mora")).toBeNull();
    });
  });

  describe("getStatusConfig — la regla de mora compartida", () => {
    it("22:30 del 14: vence hoy → color de PENDING, no de OVERDUE", () => {
      anclarLaFranja(LA_NOCHE_DEL_14);

      expect(getStatusConfig(DebtStatus.PENDING, "2026-08-14")).toEqual(
        DEBT_STATUS_CONFIG[DebtStatus.PENDING],
      );
      expect(getStatusConfig(DebtStatus.PENDING, "2026-08-13")).toEqual(
        DEBT_STATUS_CONFIG[DebtStatus.OVERDUE],
      );
    });
  });

  describe("rulesApp — el validador de fechas de TODOS los formularios", () => {
    it("22:30 del 14: MAÑANA es una fecha futura válida", () => {
      anclarLaFranja(LA_NOCHE_DEL_14);

      expect(validDateFuture("2026-08-15", [])).toBe("");
      expect(validDateFuture("2026-08-14", [])).not.toBe("");
    });

    it("22:30 del 14: HOY no es menor que hoy ni mayor que hoy", () => {
      anclarLaFranja(LA_NOCHE_DEL_14);

      expect(validDateGreater("2026-08-14", [])).toBe("");
      expect(validDateLess("2026-08-14", [])).toBe("");
      expect(validDateGreater("2026-08-13", [])).not.toBe("");
    });

    it("mediodía del 14: el mismo comportamiento", () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);

      expect(validDateFuture("2026-08-15", [])).toBe("");
      expect(validDateGreater("2026-08-14", [])).toBe("");
    });
  });
});
