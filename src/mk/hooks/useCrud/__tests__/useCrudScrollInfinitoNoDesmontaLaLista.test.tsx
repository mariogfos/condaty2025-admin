import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act, waitFor, screen } from "@testing-library/react";
import React from "react";

/**
 * CDT-53 — el scroll de la lista no puede volver al inicio solo.
 *
 * ## 🔴 Qué se rompió (medido el 2026-08-15, detalle de un período de Expensas)
 *
 * El detalle usa scroll infinito (`perPage: 20`) y envuelve la lista en un
 * `<LoadingScreen>`. `LoadingScreen` no mira el estado del listado: mira el
 * contador GLOBAL `waiting` del `AxiosInstanceProvider`, y con `waiting > 0`
 * reemplaza a sus hijos por un esqueleto.
 *
 * Cada página del scroll infinito salía por `execute(..., noWaiting)` con el
 * `noWaiting` del módulo, que en esta pantalla no está declarado. O sea que la
 * página 2 incrementaba `waiting`, `LoadingScreen` tapaba la lista con el
 * esqueleto, el contenedor scrolleable se DESMONTABA, y al volver la respuesta
 * se remontaba con `scrollTop = 0`. Con muchas unidades nunca se llegaba al
 * final: cada intento de bajar rebotaba al principio.
 *
 * ## Las tres situaciones que este test separa
 *
 * El corte del arreglo es por PÁGINA, y por eso hay tres casos y no dos:
 *
 * | situación                                   | página | esqueleto |
 * |---------------------------------------------|--------|-----------|
 * | carga inicial                               | 1      | **sí**    |
 * | reset por filtro / búsqueda / orden         | 1      | **sí**    |
 * | append del scroll infinito                  | > 1    | **no**    |
 *
 * 🔴 El segundo caso es el que hace que el arreglo se pueda pasar de rosca. Si
 * se apaga el indicador de más, el usuario filtra con la lista scrolleada y se
 * queda mirando las filas VIEJAS como si fueran el resultado del filtro nuevo:
 * un bug de scroll cambiado por uno de datos mentirosos, que es peor.
 *
 * ## Por qué este test monta la cadena entera
 *
 * Se usan el `AxiosInstanceProvider`, el `useAxios` y el `LoadingScreen` de
 * verdad, y sólo se falsea el `axios` de abajo de todo. Afirmar que `useCrud`
 * pasa cierta bandera sería afirmar la implementación; lo que rompía era el
 * DOM. Acá se mide el DOM: que el nodo de la lista siga siendo **el mismo
 * nodo** —no uno remontado, que es lo que pierde el `scrollTop`.
 */

const request = vi.fn();

vi.mock("axios", () => {
  const instance: any = {
    request: (...args: any[]) => request(...args),
    defaults: {},
  };
  const fake: any = { create: () => instance, request: instance.request };
  return { default: fake, ...fake };
});

vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: () => <div data-testid="table-mock" />,
}));
vi.mock("@/mk/components/ui/Pagination/Pagination", () => ({
  default: () => null,
}));
vi.mock("@/mk/hooks/useCrud/FormElement", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/DataSearch/DataSearch", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/data/ImportDataModal/ImportDataModal", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/ui/DetailModal/DetailModal", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/ui/NewModal/NewModal", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/FloatButton/FloatButton", () => ({
  default: () => null,
}));
vi.mock("@/components/NoData/EmptyData", () => ({ default: () => null }));
vi.mock("@/mk/hooks/useMediaQuery", () => ({ default: () => false }));
vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) mocked[key] = () => null;
  return mocked;
});

import useCrud, { ModCrudType } from "../useCrud";
import AxiosInstanceProvider from "@/mk/contexts/AxiosInstanceProvider";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";

/** `useCrud` normaliza el `perPage: 20` del módulo a su lote mínimo. */
const LOTE = 40;
const TOTAL = 500;

const filas = (desde: number, cuantas: number) =>
  Array.from({ length: cuantas }, (_, i) => ({
    id: `u-${desde + i}`,
    name: `Unidad ${desde + i}`,
  }));

const mod: ModCrudType = {
  modulo: "debt-dptos",
  singular: "unidad",
  plural: "unidades",
  permiso: "debts",
} as ModCrudType;

const fields = {
  id: { rules: [], api: "e" },
  name: { rules: [], api: "ae", label: "Nombre", list: {} },
};

/** Los requests quedan EN VUELO hasta que el test los suelta a mano. */
type EnVuelo = { page: number; resolver: (rows?: any[]) => void };
let enVuelo: EnVuelo[] = [];

const soltarUltimo = async (rows?: any[]) => {
  const pendiente = enVuelo.pop();
  if (!pendiente) throw new Error("No hay ningún request en vuelo que soltar.");
  await act(async () => {
    pendiente.resolver(rows);
    await Promise.resolve();
  });
};

/**
 * La pantalla del ticket, en miniatura: scroll infinito adentro de un
 * `LoadingScreen` sin `loaded` — igual que `ExpensesDetailsView`.
 */
const montar = () => {
  const runtime: { current: any } = { current: null };

  const Pantalla = () => {
    const crud = useCrud({
      paramsInitial: { page: 1, perPage: 20, fullType: "L", searchBy: "" },
      mod,
      fields,
    });
    runtime.current = crud;
    return (
      <LoadingScreen>
        <div data-testid="lista">{crud.data?.data?.length ?? 0}</div>
      </LoadingScreen>
    );
  };

  render(
    <AxiosInstanceProvider>
      <Pantalla />
    </AxiosInstanceProvider>,
  );

  return runtime;
};

describe("CDT-53: el scroll infinito no desmonta la lista al traer más filas", () => {
  beforeEach(() => {
    enVuelo = [];
    request.mockReset();
    request.mockImplementation((config: any) => {
      const page = Number(
        new URLSearchParams(String(config?.url).split("?")[1] || "").get(
          "page",
        ) || 1,
      );
      return new Promise((resolve) => {
        enVuelo.push({
          page,
          resolver: (rows?: any[]) =>
            resolve({
              data: {
                data: rows ?? filas((page - 1) * LOTE + 1, LOTE),
                message: { total: TOTAL },
              },
            }),
        });
      });
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("la carga inicial SÍ muestra el esqueleto, y el append NO desmonta la lista", async () => {
    const runtime = montar();

    // 1) Carga inicial (`page: 1`): todavía no hay nada que mostrar, así que
    //    el esqueleto tiene que tapar a los hijos.
    await waitFor(() => expect(enVuelo).toHaveLength(1));
    expect(
      screen.queryByTestId("lista"),
      "La carga inicial dejó de mostrar el esqueleto: la pantalla arranca " +
        "vacía y sin ninguna señal de que está cargando.",
    ).toBeNull();

    await soltarUltimo();
    await waitFor(() => expect(screen.queryByTestId("lista")).not.toBeNull());

    const nodoAntes = screen.getByTestId("lista");
    expect(nodoAntes.textContent).toBe(String(LOTE));

    // 2) Append (`page: 2`): el usuario llegó al fondo y se pide más.
    await act(async () => {
      runtime.current.onLoadMore();
    });
    await waitFor(() => expect(enVuelo).toHaveLength(1));
    expect(enVuelo[0].page).toBe(2);

    // 🔴 Acá estaba el bug: con el request de la página 2 EN VUELO, el
    // contador global subía y `LoadingScreen` reemplazaba la lista por el
    // esqueleto.
    const nodoDurante = screen.queryByTestId("lista");
    expect(
      nodoDurante,
      "Mientras se pedía la página 2, la lista se reemplazó por el esqueleto: " +
        "el contenedor scrolleable se desmonta y al volver se remonta con " +
        "scrollTop = 0. Es el salto al inicio del ticket.",
    ).not.toBeNull();

    // Y no alcanza con que HAYA una lista: tiene que ser LA MISMA. Un nodo
    // nuevo es un remonte, y un remonte es el scroll perdido.
    expect(
      nodoDurante,
      "La lista se remontó durante el append: es un nodo del DOM distinto, " +
        "así que perdió el scrollTop aunque en pantalla se vea igual.",
    ).toBe(nodoAntes);

    await soltarUltimo();
    await waitFor(() =>
      expect(screen.getByTestId("lista").textContent).toBe(String(LOTE * 2)),
    );
    expect(screen.getByTestId("lista")).toBe(nodoAntes);
  });

  it("el reset por filtro SÍ vuelve a mostrar el esqueleto", async () => {
    const runtime = montar();

    await waitFor(() => expect(enVuelo).toHaveLength(1));
    await soltarUltimo();
    await waitFor(() => expect(screen.queryByTestId("lista")).not.toBeNull());

    // Se scrollea: ya hay dos páginas cargadas.
    await act(async () => {
      runtime.current.onLoadMore();
    });
    await waitFor(() => expect(enVuelo).toHaveLength(1));
    await soltarUltimo();
    await waitFor(() =>
      expect(screen.getByTestId("lista").textContent).toBe(String(LOTE * 2)),
    );

    // 3) Reset por filtro: `page` vuelve a 1 y las 80 filas de pantalla ya no
    //    corresponden a lo que el usuario pidió.
    await act(async () => {
      runtime.current.onFilter("status", "1");
    });

    await waitFor(() => expect(enVuelo).toHaveLength(1));
    expect(enVuelo[0].page).toBe(1);

    // 🔴 Esto es lo que protege de que el arreglo se pase de rosca. Sin el
    // esqueleto, el usuario ve las filas del filtro VIEJO como si fueran el
    // resultado del nuevo, sin un solo aviso.
    expect(
      screen.queryByTestId("lista"),
      "El filtro dejó de mostrar el esqueleto: la lista sigue en pantalla con " +
        "las filas del filtro anterior mientras llega la respuesta nueva. " +
        "Datos mentirosos, que es peor que el salto de scroll.",
    ).toBeNull();

    await soltarUltimo(filas(1, 3));
    await waitFor(() => expect(screen.getByTestId("lista").textContent).toBe("3"));
  });

  it("el reset por búsqueda y el reset por orden también muestran el esqueleto", async () => {
    const runtime = montar();

    await waitFor(() => expect(enVuelo).toHaveLength(1));
    await soltarUltimo();
    await waitFor(() => expect(screen.queryByTestId("lista")).not.toBeNull());

    for (const [nombre, disparar] of [
      ["búsqueda", () => runtime.current.onSearch("torre b")],
      ["orden", () => runtime.current.onSort("name", true)],
    ] as const) {
      await act(async () => {
        disparar();
      });

      await waitFor(() => expect(enVuelo).toHaveLength(1));
      expect(enVuelo[0].page, `El reset por ${nombre} no volvió a la página 1.`)
        .toBe(1);
      expect(
        screen.queryByTestId("lista"),
        `El reset por ${nombre} dejó de mostrar el esqueleto: quedan las filas ` +
          `viejas en pantalla mientras llega la respuesta nueva.`,
      ).toBeNull();

      await soltarUltimo();
      await waitFor(() => expect(screen.queryByTestId("lista")).not.toBeNull());
    }
  });
});
