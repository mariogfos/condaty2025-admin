/**
 * CDT-52 — en Deudas, "Todas" e "Individuales" no tenían NINGUNA acción
 * alcanzable.
 *
 * ## Las tres compuertas, todas cerradas a la vez
 *
 * 1. Las dos pestañas declaraban `hideActions: { edit: true, del: true }`, y
 *    con esas dos en true `useCrud` le manda a `Table`
 *    `onButtonActions: undefined`: la tabla ni monta la columna de acciones.
 * 2. Las dos pasaban un `onRowClick` que era un no-op, y en `useCrud`
 *    `props.onRowClick` le GANA a `runtime.onView`: el click de fila no
 *    ejecutaba nada.
 * 3. El long press está muerto por `const isMobile = false` en `Table` — eso es
 *    CDT-51 y no se toca acá.
 *
 * Con las tres cerradas, ni el detalle, ni el lápiz, ni el tacho.
 *
 * ## Qué mide este archivo
 *
 * Comportamiento, no el texto del código: monta las dos pantallas con `useCrud`
 * de verdad y afirma sobre lo que se ve y sobre el request que sale. El
 * transporte, la sesión y el dibujo de los íconos están mockeados.
 *
 * 🔴 El caso 3 —"Todas" NO tiene columna de lápiz y tacho— es el que protege la
 * decisión de producto: la regla de quién se edita vive en el back, y una
 * segunda copia en el front es lo que se desincroniza. Si alguien repone la
 * columna, ese test tiene que ponerse rojo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import {
  render,
  cleanup,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { DebtStatus } from "@/types/PaymentType";

const showToast = vi.fn();
const storeCalls: any[] = [];
const setStore = vi.fn((s: any) => storeCalls.push(s));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: "u-1",
      client_id: "c-1",
      role: { abilities: "**c-1**" },
      clients: [{ id: "c-1" }],
    },
    userCan: () => true,
    showToast,
    store: {},
    setStore,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) {
    mocked[key] = (props: any) =>
      React.createElement("span", {
        "data-testid": key,
        onClick: props?.onClick,
      });
  }
  return mocked;
});

// Los modales que cuelgan del detalle no son lo que se mide acá.
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

import AllDebts from "../AllDebts/AllDebts";
import IndividualDebts from "../IndividualDebts/IndividualDebts";

const request = vi.fn();

window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as any;

/** Una deuda individual por cobrar: la que SÍ se edita y se elimina. */
const INDIVIDUAL = {
  id: "dd-1",
  type: 0,
  status: DebtStatus.PENDING,
  dpto_id: "dpto-1",
  dpto: { nro: "A-101", description: "Bloque A" },
  subcategory: { id: "sc-1", name: "Agua" },
  subcategory_id: "sc-1",
  amount: "300.00",
  penalty_amount: "0.00",
  maintenance_amount: "0.00",
  begin_at: "2026-08-01",
  due_at: "2026-08-30",
};

/**
 * Una condonación (type 5) ANULADA. Sacar el `onRowClick` habilita el modal en
 * filas de CUALQUIER tipo: éste es el borde que el triage marcó como riesgo.
 */
const CONDONACION_ANULADA = {
  id: "dd-2",
  type: 5,
  status: DebtStatus.CANCELLED,
  dpto_id: "dpto-2",
  dpto: { nro: "C-303", description: "Bloque C" },
  subcategory: { id: "sc-9", name: "Condonación" },
  subcategory_id: "sc-9",
  amount: "120.00",
  penalty_amount: "0.00",
  maintenance_amount: "0.00",
  due_at: "2026-07-15",
};

const listaOk = (filas: any[]) => ({
  data: {
    success: true,
    data: filas,
    message: { total: filas.length },
    extraData: { categories: [] },
  },
});

const montar = (ui: React.ReactElement) =>
  render(
    <AxiosContext.Provider
      value={
        {
          contextInstance: { request },
          waiting: 0,
          setWaiting: vi.fn(),
        } as any
      }
    >
      {ui}
    </AxiosContext.Provider>,
  );

const propsDeLaPestania = {
  openView: false,
  setOpenView: vi.fn(),
  viewItem: {},
  setViewItem: vi.fn(),
};

const peticiones = () => request.mock.calls.map((c) => c[0]);

/** El GET del detalle: `fullType=DET` sobre el id de la fila clickeada. */
const detalleDe = (id: string) =>
  peticiones().find(
    (c: any) =>
      c.method === "GET" &&
      String(c.url).includes("/v3/debt-dptos") &&
      c.data?.fullType === "DET" &&
      String(c.data?.searchBy) === id,
  );

const mutacion = () =>
  peticiones().find((c: any) => c.method === "PUT" || c.method === "DELETE");

const ultimoStore = () => storeCalls[storeCalls.length - 1];

describe("CDT-52 · las dos pestañas de Deudas tienen acciones alcanzables", () => {
  beforeEach(() => {
    request.mockReset();
    showToast.mockReset();
    setStore.mockClear();
    storeCalls.length = 0;
    // El detalle (`fullType=DET`) pide UNA deuda por `searchBy`: si el mock le
    // devolviera la lista entera, `data.data[0]` sería siempre la primera fila
    // y el modal mostraría otra deuda que la clickeada.
    request.mockImplementation((config: any) => {
      const filas = [INDIVIDUAL, CONDONACION_ANULADA];
      const id = config?.data?.searchBy;
      const unaSola = filas.find((f) => f.id === id);
      return Promise.resolve(listaOk(unaSola ? [unaSola] : filas));
    });
  });

  afterEach(() => cleanup());

  // -------------------------------------------------------------------------
  // 1 · el click de fila abre el detalle
  // -------------------------------------------------------------------------

  it('"Todas": el click de fila abre el detalle y lo pide al servidor', async () => {
    montar(<AllDebts {...propsDeLaPestania} />);
    fireEvent.click(await screen.findByText("A-101"));

    expect(await screen.findByText("Detalle de deuda")).toBeTruthy();
    await waitFor(() => expect(detalleDe("dd-1")).toBeTruthy());
  });

  it('"Individuales": el click de fila abre el detalle y lo pide al servidor', async () => {
    request.mockResolvedValue(listaOk([INDIVIDUAL]));
    montar(<IndividualDebts {...propsDeLaPestania} />);
    fireEvent.click(await screen.findByText("A-101"));

    expect(await screen.findByText("Detalle de deuda")).toBeTruthy();
    await waitFor(() => expect(detalleDe("dd-1")).toBeTruthy());
  });

  /**
   * El riesgo que marcó el triage: sacar el `onRowClick` habilita el modal en
   * filas de CUALQUIER tipo, incluidas condonación (5) y anuladas. Se banca el
   * caso: abre, pinta la unidad y el estado, y no ofrece ni Editar ni Anular
   * —`getAvailableActions` los niega para `type !== 0`—.
   *
   * ⚠️ Lo que sí ofrece, y no debería, es "Registrar Pago": la rama
   * `type !== 0` de `getAvailableActions` excluye pagada, por confirmar,
   * parcial y condonada, pero NO anulada. Es anterior a CDT-52 y ya se alcanza
   * hoy desde el detalle de una compartida; tocarlo cambia comportamiento en
   * otra pantalla, así que va anotado y no se toca acá.
   */
  it('"Todas": una condonación anulada abre el detalle sin Editar ni Anular', async () => {
    montar(<AllDebts {...propsDeLaPestania} />);
    fireEvent.click(await screen.findByText("C-303"));

    expect(await screen.findByText("Detalle de deuda")).toBeTruthy();
    // Los dos son del modal, no de la fila: es ESTA deuda la que se abrió.
    expect(screen.getByText("C-303 - Bloque C")).toBeTruthy();
    expect(screen.getByText("Saldo pendiente")).toBeTruthy();
    expect(screen.queryByText("Editar")).toBeNull();
    expect(screen.queryByText("Anular")).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 2 · "Individuales" tiene editar y eliminar alcanzables
  // -------------------------------------------------------------------------

  it('"Individuales": la fila trae lápiz y tacho', async () => {
    request.mockResolvedValue(listaOk([INDIVIDUAL]));
    montar(<IndividualDebts {...propsDeLaPestania} />);
    await screen.findByText("A-101");

    expect(screen.getAllByTestId("IconEdit").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("IconTrash").length).toBeGreaterThan(0);
  });

  it('"Individuales": el tacho manda DELETE a /v3/debt-dptos/{id}', async () => {
    request.mockResolvedValue(listaOk([INDIVIDUAL]));
    montar(<IndividualDebts {...propsDeLaPestania} />);
    await screen.findByText("A-101");

    fireEvent.click(screen.getByTestId("IconTrash"));
    fireEvent.click(await screen.findByText("Eliminar"));

    await waitFor(() => expect(mutacion()).toBeTruthy());
    expect(mutacion()).toMatchObject({
      url: "/v3/debt-dptos/dd-1",
      method: "DELETE",
    });
  });

  it('"Individuales": el lápiz abre el formulario de la deuda individual', async () => {
    request.mockResolvedValue(listaOk([INDIVIDUAL]));
    montar(<IndividualDebts {...propsDeLaPestania} />);
    await screen.findByText("A-101");

    fireEvent.click(screen.getByTestId("IconEdit"));

    expect(await screen.findByDisplayValue("300.00")).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // 3 · 🔴 "Todas" NO tiene la columna de lápiz y tacho
  // -------------------------------------------------------------------------

  it('🔴 "Todas": las filas NO traen lápiz ni tacho — la regla vive en el back', async () => {
    montar(<AllDebts {...propsDeLaPestania} />);
    await screen.findByText("A-101");

    expect(screen.queryAllByTestId("IconEdit")).toHaveLength(0);
    expect(screen.queryAllByTestId("IconTrash")).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 4 · la lupa del header busca de verdad
  // -------------------------------------------------------------------------

  it.each([
    ["Todas", () => <AllDebts {...propsDeLaPestania} />],
    ["Individuales", () => <IndividualDebts {...propsDeLaPestania} />],
  ])(
    '"%s": la lupa del header manda la búsqueda al servidor',
    async (_nombre, ui) => {
      request.mockResolvedValue(listaOk([INDIVIDUAL]));
      montar(ui());
      await screen.findByText("A-101");

      // La lupa vive en el header (`Layout` → `Header`), que se alimenta de lo
      // que `useCrudUtils` deja en el store. Se rinde acá lo mismo que pinta el
      // header: primero el ícono, después el buscador que abre.
      const lupa = render(<div>{ultimoStore().right()}</div>);
      fireEvent.click(lupa.getByTestId("IconSearch"));

      await waitFor(() => expect(ultimoStore().customTitle()).not.toBeNull());
      const buscador = render(<div>{ultimoStore().customTitle()}</div>);

      const input = within(buscador.container).getByRole("searchbox");
      fireEvent.change(input, { target: { value: "A-101" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() =>
        expect(
          peticiones().some(
            (c: any) =>
              c.method === "GET" &&
              String(c.url).includes("/v3/debt-dptos") &&
              c.data?.searchBy === "A-101",
          ),
        ).toBe(true),
      );
    },
  );
});
