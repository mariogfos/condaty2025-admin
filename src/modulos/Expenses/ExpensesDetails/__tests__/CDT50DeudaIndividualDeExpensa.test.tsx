/**
 * CDT-50 — la expensa de UNA unidad se edita y se elimina desde su detalle.
 *
 * ## 🔴 Qué se rompía
 *
 * El único editar/eliminar de expensas vivía sobre el GRUPO: el periodo entero,
 * contra `PUT`/`DELETE /debt-groups/{id}`. Borrar la expensa de una sola unidad
 * obligaba a borrar el mes completo y regenerarlo, arrastrando a las unidades
 * que no tenían nada que ver. El detalle por unidad —la única pantalla que
 * muestra la deuda de cada `dpto`— venía con `hideActions {add, edit, del}` y
 * `useCrud` ni siquiera montaba la columna de acciones (`useCrud.tsx:2617`,
 * `onButtonActions: undefined` cuando `edit` y `del` están ocultas).
 *
 * La API de CDT-50 sacó los dos endpoints de grupo (404 en `v3`, 405 en la
 * ruta legacy) y abrió `PUT`/`DELETE /v3/debt-dptos/{id}` para la deuda
 * individual.
 *
 * ## Qué mide este archivo
 *
 * El request que sale, con `useCrud` de verdad: URL, método y cuerpo. Lo que se
 * mockea es el transporte (`AxiosContext`), la sesión (`AuthContext`) y el
 * dibujo de los íconos —los íconos mockeados conservan su `onClick`, que es lo
 * que hace falta para apretarlos—. Nada de eso fabrica lo que se afirma: el
 * cuerpo del `PUT` lo arma `getParamFields` a partir de los `fields` reales de
 * la pantalla.
 *
 * 🔴 Las dos claves que muerden si faltan, y por eso están afirmadas una por
 * una:
 *
 *  - `type`: `DebtDptoController::beforeUpdate` rutea por él. Sin `type`,
 *    `(int) null` es 0 —NORMAL— y el back pide `begin_at`, `due_at`,
 *    `subcategory_id` y `dpto_id`, que esta pantalla no tiene.
 *  - `penalty_amount`: para EXPENSE el back valida `required|numeric|min:0` y
 *    responde 422. Un 422 hace tirar a axios, así que `execute` vuelve con
 *    `data: null` y el toast de error de `useCrud` saldría VACÍO.
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

/**
 * `src/test/setup.ts` mockea `useAuth` global, pero su `user` no trae
 * `showToast` ni permisos de escritura. Acá hace falta el toast —es donde
 * aterriza el mensaje del back— y un rol que pueda editar y borrar.
 */
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

/**
 * Los íconos se dibujan como botones con testid, PERO conservan su `onClick`:
 * el test aprieta el lápiz y el tacho de verdad, y quien decide qué hacen
 * sigue siendo `useCrud.onButtonActions`.
 */
vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) {
    // `span` y no `button`: varios íconos viven adentro de un `<button>` real
    // de la pantalla, y anidar botones es HTML inválido.
    mocked[key] = (props: any) =>
      React.createElement("span", {
        "data-testid": key,
        onClick: props?.onClick,
      });
  }
  return mocked;
});

import ExpensesDetails from "../ExpensesDetailsView";

const request = vi.fn();

// jsdom no trae `matchMedia`, y el filtro responsive de `useCrud` lo usa.
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

/**
 * Una fila tal como la devuelve `DebtDptoController::getModelByList` en la rama
 * EXPENSE: la consulta no proyecta columnas, así que la fila trae la tabla
 * entera de `debt_dptos` — `type` incluido.
 */
const FILA = {
  id: "dd-uuid-1",
  type: 1,
  dpto_id: "dpto-1",
  dpto: { nro: "A-101", description: "Bloque A" },
  amount: "350.00",
  penalty_amount: "0.00",
  maintenance_amount: "0.00",
  obs: null,
  status: 1,
  due_at: "2026-07-28",
  paid_at: null,
  year: 2026,
  month: 7,
};

const listaOk = {
  data: {
    success: true,
    data: [FILA],
    message: { total: 1 },
    extraData: {},
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
      <ExpensesDetails data={{ year: 2026, month: 7 }} setOpenDetail={vi.fn()} />
    </AxiosContext.Provider>,
  );
};

/** El request de mutación: el primero que no es el GET del listado. */
const mutacion = () =>
  request.mock.calls
    .map((c) => c[0])
    .find((c: any) => c.method === "PUT" || c.method === "DELETE");

describe("CDT-50 · la expensa de una unidad se edita y se elimina", () => {
  beforeEach(() => {
    request.mockReset();
    showToast.mockReset();
    request.mockResolvedValue(listaOk);
  });

  afterEach(() => cleanup());

  it("la fila trae lápiz y tacho (antes no se montaba la columna de acciones)", async () => {
    montar();

    expect(await screen.findByText("A-101")).toBeInTheDocument();
    expect(screen.getAllByTestId("IconEdit")).toHaveLength(1);
    expect(screen.getAllByTestId("IconTrash")).toHaveLength(1);
  });

  it("editar manda PUT a /v3/debt-dptos/{id} con type y penalty_amount", async () => {
    montar();
    await screen.findByText("A-101");

    fireEvent.click(screen.getByTestId("IconEdit"));

    const monto = await screen.findByDisplayValue("350.00");
    fireEvent.change(monto, { target: { name: "amount", value: "222.50" } });
    const motivo = screen.getByLabelText(/Motivo del cambio/i);
    fireEvent.change(motivo, {
      target: { name: "obs", value: "Corrección de lectura" },
    });

    fireEvent.click(screen.getByText("Actualizar"));

    await waitFor(() => expect(mutacion()).toBeTruthy());

    expect(mutacion()).toMatchObject({
      url: "/v3/debt-dptos/dd-uuid-1",
      method: "PUT",
    });
    // 🔴 `type` y `penalty_amount`, uno por uno: sin el primero el back cae en
    // NORMAL, sin el segundo responde 422 y el toast sale vacío.
    expect(mutacion().data).toMatchObject({
      id: "dd-uuid-1",
      type: 1,
      amount: "222.50",
      penalty_amount: "0.00",
      obs: "Corrección de lectura",
    });
    // Las llaves congeladas no se mandan: el back las descarta igual, pero
    // mandarlas dice que la pantalla cree que puede mudar la deuda de lugar.
    expect(mutacion().data).not.toHaveProperty("dpto_id");
    expect(mutacion().data).not.toHaveProperty("year");
    expect(mutacion().data).not.toHaveProperty("month");
  });

  it("eliminar manda DELETE a /v3/debt-dptos/{id}, no al grupo", async () => {
    montar();
    await screen.findByText("A-101");

    fireEvent.click(screen.getByTestId("IconTrash"));
    fireEvent.click(await screen.findByText("Eliminar"));

    await waitFor(() => expect(mutacion()).toBeTruthy());

    expect(mutacion()).toMatchObject({
      url: "/v3/debt-dptos/dd-uuid-1",
      method: "DELETE",
    });
    expect(mutacion().url).not.toContain("debt-groups");
  });

  /**
   * 🔴 El rechazo por pagos vivos llega con HTTP 200 y `success: true`, con el
   * texto del error adentro de `message`: `Mk/Controller::handleDeleteMessage`
   * hace `isset($msg['status'])`, que es verdadero también cuando el status es
   * `false`. Ese `success` mentiroso es CDT-49 y se arregla en el kernel, no
   * acá. Lo que sí es de esta pantalla es que el texto del back NO se pierda:
   * antes el detalle de compartidas lo tapaba con un "Deuda eliminada
   * exitosamente" fijo, y el usuario leía lo contrario de lo que había pasado.
   */
  it("el rechazo del back por pagos registrados le llega al usuario con su texto", async () => {
    const RECHAZO =
      "No se puede eliminar esta deuda porque tiene pagos registrados. " +
      "Primero anule o elimine los pagos.";

    montar();
    await screen.findByText("A-101");

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
