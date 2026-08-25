/**
 * Los abonos de una deuda cobrada en partes se ven, con su total.
 *
 * ────────────────────────────────────────────────────────────────────────
 * QUÉ SE HABÍA PERDIDO
 * ────────────────────────────────────────────────────────────────────────
 *
 * En producción existe una pantalla «Detalle de pago parcial»: la tabla de
 * abonos de una deuda, con el total pagado y el saldo restante. `4a4f6f5c`
 * (2026-06-24) borró el módulo `PartialPayments` entero —3.262 líneas, sin
 * cuerpo de commit— y **nada la reemplazó**.
 *
 * Lo que quedó es el botón «Ver pago», que abre **UN** pago: el último
 * (`DebtPaymentStateService::pickLatestDetail`). Sobre una deuda cobrada en
 * dos abonos el administrador veía el segundo, y el primero no aparecía en
 * ningún lado — ni el total pagado, ni quién pagó cada parte.
 *
 * Medido en PRODUCCIÓN el 2026-08-24: **610 deudas** con 2 a 6 abonos, en
 * **3 condominios** (314, 273 y 23).
 *
 * ⚠️ Y la asimetría que lo hacía más raro: el **residente sí lo tenía**.
 * `rnOwner` llama a `partial-receipt`, que arma el PDF con todos los abonos.
 * El administrador podía pedir ese mismo PDF —el API se lo permite— pero su
 * front no tenía un solo botón que lo llamara.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 LOS TRES CASOS
 * ────────────────────────────────────────────────────────────────────────
 *
 * | caso | qué mide |
 * |---|---|
 * | con dos abonos | que se ven **los dos**, y que el total es la SUMA |
 * | **CONTROL**: sin abonos | que la sección no aparece, y que no se pide `partial-summary` |
 * | **CONTROL**: `is_partial` falso | que la decisión la toma esa clave, no la presencia de un pago |
 *
 * Los dos controles no son decorados. `partial-summary` contesta **422**
 * cuando la deuda no tiene abonos: pedirlo siempre llenaría de errores el
 * detalle de cualquier deuda normal.
 */

import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import RenderView from "../RenderView/RenderView";
import { DebtStatus, DebtType } from "@/types/PaymentType";

const mocks = vi.hoisted(() => ({
  debt: null as any,
  esParcial: false,
  historial: [] as any[],
  pedidos: [] as string[],
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: mocks.debt ? { data: [mocks.debt], extraData: {} } : null,
    loaded: true,
    execute: vi.fn().mockImplementation(async (url: string) => {
      mocks.pedidos.push(url);

      if (url.includes("/resolved-payment")) {
        return {
          data: {
            success: true,
            data: { payment_id: "p-9", is_partial: mocks.esParcial },
          },
        };
      }

      if (url.includes("/partial-summary")) {
        return {
          data: { success: true, data: { history: mocks.historial } },
        };
      }

      return { data: { success: false } };
    }),
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

const DOS_ABONOS = [
  {
    payment_id: "p-1",
    amount: 400,
    paid_at: "2026-07-10 09:00",
    method: 1,
    registered_by: "Mario Guzmán",
  },
  {
    payment_id: "p-2",
    amount: 350,
    paid_at: "2026-08-02 15:30",
    method: 4,
    registered_by: "Ana Rojas",
  },
];

const abrirDeuda = () => {
  mocks.debt = {
    id: "d-1",
    amount: "1000",
    due_at: "2030-09-30",
    status: DebtStatus.PARTIAL,
    type: DebtType.NORMAL,
    dpto: { id: 5, nro: "101", homeowner: { id: 9, name: "Mario" } },
    subcategory: { id: 11, name: "Otras deudas" },
  };

  render(
    <RenderView
      open
      item={mocks.debt}
      onClose={vi.fn()}
      extraData={{ dptos: [] }}
    />,
  );

  // 🔴 Afirmar que el detalle se pintó: un modal vacío también haría pasar
  // cualquier `queryByText → null` de los controles.
  expect(screen.getByText("Detalles de la deuda")).toBeTruthy();
};

describe("los abonos de una deuda cobrada en partes", () => {
  afterEach(() => {
    cleanup();
    mocks.debt = null;
    mocks.esParcial = false;
    mocks.historial = [];
    mocks.pedidos = [];
  });

  it("se ven los DOS abonos, y el total es la suma", async () => {
    mocks.esParcial = true;
    mocks.historial = DOS_ABONOS;

    abrirDeuda();

    await waitFor(() => {
      expect(screen.getByText("Abonos de esta deuda")).toBeTruthy();
    });

    // Los dos importes, no sólo el último — que es lo que mostraba «Ver pago».
    expect(screen.getByText(/400/)).toBeTruthy();
    expect(screen.getByText(/350/)).toBeTruthy();

    // Quién pagó cada parte: sin esto la tabla es una lista de números.
    expect(screen.getByText("Mario Guzmán")).toBeTruthy();
    expect(screen.getByText("Ana Rojas")).toBeTruthy();

    // 🔴 El total es la SUMA de los abonos (400 + 350), no una clave del
    // sobre: es la cuenta que el administrador querría rehacer a mano.
    //
    // ⚠️ Los importes del fixture NO suman el total de la deuda a propósito:
    // con 400 + 600 la suma daba 1.000, que es el monto de la deuda, y la
    // aserción encontraba DOS nodos. Un total que coincide con otro número de
    // la pantalla no prueba que se haya sumado nada.
    expect(screen.getByText("Total pagado")).toBeTruthy();
    expect(screen.getByText(/750/)).toBeTruthy();
  });

  /**
   * 🔴 CONTROL: una deuda sin abonos no muestra la sección **y no pide el
   * resumen**. `partial-summary` contesta 422 cuando no hay abonos.
   */
  it("una deuda SIN abonos no muestra la sección ni pide el resumen", async () => {
    mocks.esParcial = false;
    mocks.historial = DOS_ABONOS;

    abrirDeuda();

    await waitFor(() => {
      expect(
        mocks.pedidos.some((u) => u.includes("/resolved-payment")),
      ).toBe(true);
    });

    expect(screen.queryByText("Abonos de esta deuda")).toBeNull();
    expect(
      mocks.pedidos.some((u) => u.includes("/partial-summary")),
    ).toBe(false);
  });

  /**
   * 🔴 CONTROL del control: con `is_partial` en verdadero pero el historial
   * vacío, tampoco se pinta. Si no, «no aparece» sería cierto por el motivo
   * equivocado en el caso de arriba.
   */
  it("con el historial vacío no se pinta una sección sin filas", async () => {
    mocks.esParcial = true;
    mocks.historial = [];

    abrirDeuda();

    await waitFor(() => {
      expect(
        mocks.pedidos.some((u) => u.includes("/partial-summary")),
      ).toBe(true);
    });

    expect(screen.queryByText("Abonos de esta deuda")).toBeNull();
  });
});
