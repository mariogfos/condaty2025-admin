/**
 * CDT-44 — el día de VENCIMIENTO se leía en UTC.
 *
 * `new Date("2026-08-14")` y `new Date("2026-08-14T00:00:00.000000Z")` son el
 * MISMO instante: medianoche UTC, o sea las 20:00 del 13 en Bolivia (UTC-4).
 * Comparado contra un "hoy" local, una deuda que vencía HOY salía "En mora".
 *
 * 🔴 En `utils.tsx` eran DOS defectos que se tapaban entre sí:
 *   1. `const today = new Date()` a nivel de MÓDULO — un instante congelado al
 *      cargar el bundle, que además nunca cruza la medianoche.
 *   2. `new Date(due_at)` parseado en UTC.
 * Una deuda vencida AYER salía bien por casualidad porque el −1 del UTC
 * cancelaba que `today` no estuviera truncado. Por eso los tests viejos
 * (`"2000-01-01"` / `"2999-01-01"`) pasaban con el bug puesto: no medían el
 * borde, medían mil años de distancia.
 *
 * Por qué `vi.resetModules()` + `await import()` en cada caso: con el bug
 * puesto, `today` se evalúa al IMPORTAR el módulo. Un import estático arriba
 * del archivo lo congelaría con el reloj REAL y el test no mediría el instante
 * anclado. Reimportar bajo tiempo falso es lo que hace que la reinyección se
 * ponga roja.
 */
process.env.TZ = "America/La_Paz";

import React from "react";
import { render, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DebtStatus } from "@/types/PaymentType";
import { getLocalDate, getNowDate } from "@/mk/utils/date";

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: {}, showToast: vi.fn() }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: () => <div />,
}));

vi.mock("@/modulos/Payments/RenderView/RenderView", () => ({
  default: () => <div />,
}));

// 22:00 en La Paz del 14/08; en UTC ya es el 15 — la franja que rompía CDT-43.
const LAS_22_DEL_14 = new Date("2026-08-15T02:00:00Z");
// Mediodía del 14: local y UTC son el mismo día. Si el bug fuera "sólo de
// noche" este caso saldría verde; sale rojo, y eso es lo que prueba que el
// corrimiento era de las 24 horas.
const EL_MEDIODIA_DEL_14 = new Date("2026-08-14T16:00:00Z");

const AYER = "2026-08-13";
const HOY = "2026-08-14";
const MANANA = "2026-08-15";

// Así llega de verdad: columna `date` con cast `'date'` y sin `serializeDate`.
const comoLoMandaLaApi = (dia: string) => `${dia}T00:00:00.000000Z`;

const anclarLaFranja = (instante: Date) => {
  vi.setSystemTime(instante);
  // Sin este ancla el test pasa en cualquier zona y no mide nada.
  expect(new Date().getTimezoneOffset()).toBe(240);
};

const unaUnidadPorCobrar = [
  { id: 1, debt_id: "d", amount: 100, penalty_amount: 0, status: DebtStatus.PENDING },
] as any;

const enMora = async (due_at: string) => {
  vi.resetModules();
  const { isUnitInDefault } = await import("../utils");
  return isUnitInDefault({ asignados: unaUnidadPorCobrar, due_at } as any);
};

describe("CDT-44 · el vencimiento es un día LOCAL, no un instante UTC", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe("isUnitInDefault — la fila roja del listado de expensas", () => {
    it("mediodía del 14: la que vence HOY no está en mora", async () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);
      expect(await enMora(HOY)).toBe(false);
      expect(await enMora(comoLoMandaLaApi(HOY))).toBe(false);
    });

    it("22:00 del 14: la que vence HOY tampoco está en mora", async () => {
      anclarLaFranja(LAS_22_DEL_14);
      // El día UTC ya es el 15: el valor que rompía por el otro lado.
      expect(new Date().toISOString().split("T")[0]).toBe("2026-08-15");
      expect(await enMora(HOY)).toBe(false);
      expect(await enMora(comoLoMandaLaApi(HOY))).toBe(false);
    });

    it("mediodía del 14: la que vence MAÑANA no está en mora", async () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);
      expect(await enMora(MANANA)).toBe(false);
    });

    it("22:00 del 14: la que vence MAÑANA tampoco está en mora", async () => {
      anclarLaFranja(LAS_22_DEL_14);
      expect(await enMora(MANANA)).toBe(false);
      expect(await enMora(comoLoMandaLaApi(MANANA))).toBe(false);
    });

    it("mediodía del 14: la que venció AYER sigue en mora", async () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);
      expect(await enMora(AYER)).toBe(true);
      expect(await enMora(comoLoMandaLaApi(AYER))).toBe(true);
    });

    it("22:00 del 14: la que venció AYER sigue en mora", async () => {
      anclarLaFranja(LAS_22_DEL_14);
      expect(await enMora(AYER)).toBe(true);
    });

    it("sin unidades por cobrar nunca está en mora, aunque haya vencido", async () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);
      vi.resetModules();
      const { isUnitInDefault } = await import("../utils");
      expect(
        isUnitInDefault({
          asignados: [
            { id: 1, debt_id: "d", amount: 100, penalty_amount: 0, status: DebtStatus.PAID },
          ],
          due_at: AYER,
        } as any),
      ).toBe(false);
    });

    it("el 'hoy' se relee en cada llamada: la pestaña que cruza la medianoche", async () => {
      // 23:59 del 14 — con el `today` de módulo, esta importación lo congela.
      anclarLaFranja(new Date("2026-08-15T03:59:00Z"));
      vi.resetModules();
      const { isUnitInDefault } = await import("../utils");
      const deuda = { asignados: unaUnidadPorCobrar, due_at: HOY } as any;
      expect(isUnitInDefault(deuda)).toBe(false);

      // Pasa la medianoche SIN recargar la pestaña: ahora sí está vencida.
      vi.setSystemTime(new Date("2026-08-15T04:01:00Z"));
      expect(isUnitInDefault(deuda)).toBe(true);
    });
  });

  describe("isPastDue — el guard compartido por los tres sitios", () => {
    // La regla estaba copiada en `isUnitInDefault`, en `ExpensesDetailsView` y
    // en el `RenderView` del detalle. Ahora es una sola: el test que la protege
    // vale para los tres.
    const vencida = async (due_at?: string | null) => {
      vi.resetModules();
      const { isPastDue } = await import("../utils");
      return isPastDue(due_at);
    };

    it("mediodía del 14: hoy no, mañana no, ayer sí", async () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);
      expect(await vencida(HOY)).toBe(false);
      expect(await vencida(MANANA)).toBe(false);
      expect(await vencida(AYER)).toBe(true);
    });

    it("22:00 del 14: hoy no, mañana no, ayer sí", async () => {
      anclarLaFranja(LAS_22_DEL_14);
      expect(await vencida(comoLoMandaLaApi(HOY))).toBe(false);
      expect(await vencida(comoLoMandaLaApi(MANANA))).toBe(false);
      expect(await vencida(comoLoMandaLaApi(AYER))).toBe(true);
    });

    it("sin fecha de vencimiento nunca está vencida", async () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);
      expect(await vencida(null)).toBe(false);
      expect(await vencida(undefined)).toBe(false);
      expect(await vencida("")).toBe(false);
    });
  });

  describe("getLocalDate — el helper que trunca a medianoche LOCAL", () => {
    it("22:00 del 14: el 'YYYY-MM-DD' pelado es el 14 a las 00:00 locales", () => {
      anclarLaFranja(LAS_22_DEL_14);
      const dia = getLocalDate(HOY);
      expect(dia.getDate()).toBe(14);
      expect(dia.getHours()).toBe(0);
      expect(dia.getTime()).toBe(new Date(2026, 7, 14).getTime());
      // El anti-ejemplo: así lo parseaba el código viejo.
      expect(new Date(HOY).getDate()).toBe(13);
      expect(new Date(HOY).getHours()).toBe(20);
    });

    it("el sobre de la API da exactamente el mismo día que el pelado", () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);
      expect(getLocalDate(comoLoMandaLaApi(HOY)).getTime()).toBe(
        getLocalDate(HOY).getTime(),
      );
      expect(getLocalDate(HOY).getTime()).toBe(getNowDate().getTime());
    });
  });

  describe("detalle de la expensa — el estado que LEE el admin", () => {
    const deuda = (due_at: string) => ({
      id: "d-1",
      status: DebtStatus.PENDING,
      amount: "150",
      due_at,
      month: 8,
      year: 2026,
      dpto: { id: 5, nro: "101" },
      asignados: unaUnidadPorCobrar,
    });

    const estadoQueSeMuestra = async (item: any) => {
      vi.resetModules();
      const { default: RenderView } = await import(
        "@/modulos/Expenses/ExpensesDetails/RenderView/RenderView"
      );
      const { container } = render(
        <RenderView
          open
          item={item}
          onClose={vi.fn()}
          execute={vi.fn().mockResolvedValue({ data: { success: false } })}
        />,
      );
      return within(container);
    };

    it("mediodía del 14: la que vence HOY dice 'Por cobrar', no 'En mora'", async () => {
      anclarLaFranja(EL_MEDIODIA_DEL_14);
      const vista = await estadoQueSeMuestra(deuda(comoLoMandaLaApi(HOY)));
      expect(vista.queryByText("En mora")).toBeNull();
      expect(vista.getByText("Por cobrar")).toBeTruthy();
    });

    it("22:00 del 14: la que vence HOY sigue diciendo 'Por cobrar'", async () => {
      anclarLaFranja(LAS_22_DEL_14);
      const vista = await estadoQueSeMuestra(deuda(HOY));
      expect(vista.queryByText("En mora")).toBeNull();
    });

    it("22:00 del 14: la que venció AYER sí dice 'En mora'", async () => {
      anclarLaFranja(LAS_22_DEL_14);
      const vista = await estadoQueSeMuestra(deuda(comoLoMandaLaApi(AYER)));
      expect(vista.getByText("En mora")).toBeTruthy();
    });
  });
});
