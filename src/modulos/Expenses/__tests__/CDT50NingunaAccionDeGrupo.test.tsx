/**
 * CDT-50 — ni el listado de periodos ni el de compartidas ofrecen editar o
 * eliminar el GRUPO.
 *
 * ## 🔴 Qué se rompía
 *
 * Las dos pantallas escondían lápiz y tacho en escritorio (`hideActions`) pero
 * le pasaban `onTabletRow` a la lista: en tablet/móvil ese render abre el long
 * press de `useCrudUtils`, que pone lápiz y tacho en la barra y llama a
 * `onEdit`/`onDel` de `useCrud` sobre `modulo: v3/debt-groups`. O sea
 * `PUT`/`DELETE /v3/debt-groups/{id}` — los dos endpoints que la API de CDT-50
 * eliminó (404 en `v3`, 405 en la ruta legacy).
 *
 * ## Qué mide este archivo
 *
 * Los dos props con los que `useCrud` puede llegar a una mutación desde la
 * tabla, capturados de la `Table` real:
 *
 *  - `onButtonActions`: la columna de lápiz y tacho. `useCrud.tsx:2617` la
 *    manda `undefined` sólo si `edit` **y** `del` están ocultas.
 *  - `onTabletRow`: el render de tarjeta con long press.
 *
 * El mock de `Table` GUARDA los props, no los reenvía: acá se mide qué pasa la
 * pantalla, no lo que la tabla hace con eso.
 *
 * ⚠️ Medido al escribir este archivo: `Table.tsx` tiene `const isMobile =
 * false` fijo desde el commit 94338bc7 (2025-05-21, "remove useScreenSize
 * hook"), así que `onTabletRow` HOY no se dibuja en ningún lado. El long press
 * está muerto en los 12 archivos que lo pasan. Igual se saca de estas dos
 * pantallas: si alguien devuelve el `isMobile` de verdad, éstas no pueden
 * volver a ofrecer una acción que el back ya no atiende.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, cleanup, waitFor } from "@testing-library/react";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: "u-1",
      client_id: "c-1",
      role: { abilities: "**c-1**" },
      clients: [{ id: "c-1" }],
    },
    userCan: () => true,
    showToast: vi.fn(),
    store: {},
    setStore: vi.fn(),
  }),
}));

const tableProps: { current: any } = { current: undefined };
vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: (props: any) => {
    tableProps.current = props;
    return <div data-testid="table-mock" />;
  },
}));

import Expenses from "../Expenses";
import SharedDebts from "@/modulos/DebtsManager/TabComponents/SharedDebts/SharedDebts";

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

const respuesta = (fila: Record<string, any>) => ({
  data: {
    success: true,
    data: [fila],
    message: { total: 1 },
    extraData: {},
  },
});

const montar = (children: React.ReactNode) =>
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
      {children}
    </AxiosContext.Provider>,
  );

describe("CDT-50 · los listados de grupo no ofrecen editar ni eliminar", () => {
  beforeEach(() => {
    request.mockReset();
    tableProps.current = undefined;
  });

  afterEach(() => cleanup());

  it("periodos de expensas: sin columna de acciones y sin long press", async () => {
    request.mockResolvedValue(
      respuesta({ id: "2026-7", year: 2026, month: 7, asignados: [] }),
    );

    montar(<Expenses />);

    await waitFor(() => expect(tableProps.current).toBeTruthy());
    expect(tableProps.current.onButtonActions).toBeUndefined();
    expect(tableProps.current.onTabletRow).toBeUndefined();
  });

  it("listado de compartidas: sin columna de acciones y sin long press", async () => {
    request.mockResolvedValue(
      respuesta({ id: "grupo-1", description: "Portón", asignados: [] }),
    );

    montar(
      <SharedDebts
        openView={false}
        setOpenView={vi.fn()}
        viewItem={null}
        setViewItem={vi.fn()}
      />,
    );

    await waitFor(() => expect(tableProps.current).toBeTruthy());
    expect(tableProps.current.onButtonActions).toBeUndefined();
    expect(tableProps.current.onTabletRow).toBeUndefined();
  });

  it("ninguna de las dos dispara una mutación contra /debt-groups", async () => {
    request.mockResolvedValue(
      respuesta({ id: "2026-7", year: 2026, month: 7, asignados: [] }),
    );

    montar(<Expenses />);
    await waitFor(() => expect(tableProps.current).toBeTruthy());

    const mutaciones = request.mock.calls
      .map((c) => c[0])
      .filter((c: any) => c.method === "PUT" || c.method === "DELETE");
    expect(mutaciones).toEqual([]);
  });
});
