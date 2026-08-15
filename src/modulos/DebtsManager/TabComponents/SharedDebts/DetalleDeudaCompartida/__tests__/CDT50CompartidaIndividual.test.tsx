/**
 * CDT-50 — el reparto de una compartida se edita y se elimina POR UNIDAD.
 *
 * ## 🔴 Qué se rompía
 *
 * Esta pantalla tenía dos botones de GRUPO, "Editar" y "Eliminar", que pegaban
 * a `PUT`/`DELETE /v3/debt-groups/{id}` con `type: 4` y borraban duro las N
 * deudas de todas las unidades. La API de CDT-50 sacó esos dos endpoints (404
 * en `v3`, 405 en la ruta legacy): los botones quedaron rotos desde el mismo
 * release. Y la lista por unidad —la única que muestra la deuda de cada
 * `dpto`— venía con `hideActions {edit, del}`, así que no había ninguna forma
 * de tocar UNA sola.
 *
 * Encima el `confirmDelete` viejo tapaba la respuesta del back con textos
 * fijos: `showToast("Deuda eliminada exitosamente")` cuando `success` venía en
 * true, y `"Error al eliminar la deuda"` si no. Un rechazo por pagos vivos
 * viaja con `success: true` y el motivo adentro de `message` (CDT-49), así que
 * el admin leía "eliminada exitosamente" sobre una deuda que seguía ahí.
 *
 * ## Qué mide este archivo
 *
 * El request que sale, con `useCrud` de verdad. El transporte, la sesión y el
 * dibujo de los íconos están mockeados; el cuerpo del `PUT` lo arma
 * `getParamFields` con los `fields` reales de la pantalla.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import {
  render,
  cleanup,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";

const showToast = vi.fn();

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
    setStore: vi.fn(),
  }),
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

import DetailSharedDebts from "../DetailSharedDebts";

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

/** Una fila del reparto, tal como la trae la rama SHARED de `getModelByList`. */
const FILA = {
  id: "dd-shared-1",
  type: 4,
  dpto_id: "dpto-9",
  dpto: { nro: "B-202", description: "Bloque B" },
  amount: "500.00",
  penalty_amount: "0.00",
  maintenance_amount: "0.00",
  obs: null,
  status: 1,
  due_at: "2026-08-30",
};

const listaOk = {
  data: {
    success: true,
    data: [FILA],
    message: { total: 1 },
    extraData: { debt: { description: "Portón nuevo" } },
  },
};

const montar = () => {
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
      <DetailSharedDebts debtId="grupo-1" />
    </AxiosContext.Provider>,
  );
};

const mutacion = () =>
  request.mock.calls
    .map((c) => c[0])
    .find((c: any) => c.method === "PUT" || c.method === "DELETE");

describe("CDT-50 · la compartida se edita y se elimina por unidad", () => {
  beforeEach(() => {
    request.mockReset();
    showToast.mockReset();
    request.mockResolvedValue(listaOk);
  });

  afterEach(() => cleanup());

  it("ya no están los botones de grupo, que pegaban a un endpoint muerto", async () => {
    montar();
    await screen.findByText("B-202");

    // Los del grupo eran botones con texto; los de la fila son íconos.
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Eliminar" })).toBeNull();
  });

  it("la fila por unidad trae lápiz y tacho", async () => {
    montar();
    await screen.findByText("B-202");

    expect(screen.getAllByTestId("IconEdit")).toHaveLength(1);
    expect(screen.getAllByTestId("IconTrash")).toHaveLength(1);
  });

  it("editar manda PUT a /v3/debt-dptos/{id} con type 4, no al grupo", async () => {
    montar();
    await screen.findByText("B-202");

    fireEvent.click(screen.getByTestId("IconEdit"));

    const monto = await screen.findByDisplayValue("500.00");
    fireEvent.change(monto, { target: { name: "amount", value: "640.00" } });
    fireEvent.change(screen.getByLabelText(/Motivo del cambio/i), {
      target: { name: "obs", value: "Reparto corregido" },
    });

    fireEvent.click(screen.getByText("Actualizar"));

    await waitFor(() => expect(mutacion()).toBeTruthy());

    expect(mutacion()).toMatchObject({
      url: "/v3/debt-dptos/dd-shared-1",
      method: "PUT",
    });
    expect(mutacion().url).not.toContain("debt-groups");
    // 🔴 Sin `type`, `beforeUpdate` cae en NORMAL y pide otras cinco claves.
    expect(mutacion().data).toMatchObject({
      id: "dd-shared-1",
      type: 4,
      amount: "640.00",
      obs: "Reparto corregido",
    });
    // El back congela las llaves que mudarían la deuda; la pantalla ni las manda.
    expect(mutacion().data).not.toHaveProperty("dpto_id");
    expect(mutacion().data).not.toHaveProperty("shared_id");
  });

  it("eliminar manda DELETE a /v3/debt-dptos/{id}, no al grupo", async () => {
    montar();
    await screen.findByText("B-202");

    fireEvent.click(screen.getByTestId("IconTrash"));
    fireEvent.click(await screen.findByText("Eliminar"));

    await waitFor(() => expect(mutacion()).toBeTruthy());

    expect(mutacion()).toMatchObject({
      url: "/v3/debt-dptos/dd-shared-1",
      method: "DELETE",
    });
    expect(mutacion().url).not.toContain("debt-groups");
  });

  /**
   * 🔴 Éste es el texto que el `confirmDelete` viejo tapaba con "Deuda
   * eliminada exitosamente". El `success: true` mentiroso es CDT-49 y se
   * arregla en el kernel; lo que se pinea acá es que el motivo del back llegue
   * al usuario en vez de morir tapado por un texto fijo de la pantalla.
   */
  it("el rechazo por pagos registrados le llega al usuario con el texto del back", async () => {
    const RECHAZO =
      "No se puede eliminar esta deuda porque tiene pagos registrados. " +
      "Primero anule o elimine los pagos.";

    montar();
    await screen.findByText("B-202");

    request.mockResolvedValueOnce({
      data: { success: true, data: true, message: RECHAZO },
    });

    fireEvent.click(screen.getByTestId("IconTrash"));
    fireEvent.click(await screen.findByText("Eliminar"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(RECHAZO, expect.anything()),
    );
  });
});
