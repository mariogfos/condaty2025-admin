import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act, waitFor } from "@testing-library/react";
import React from "react";

/**
 * El scroll infinito no puede prometer "hay más" y después negarse a pedirlo.
 *
 * ## 🔴 Qué se rompió (medido el 2026-08-12, Reservas)
 *
 * El dueño reportó que la lista de Reservas se quedaba colgada cargando: el
 * esqueleto de "cargando más" abajo para siempre y **cero requests** de la
 * página siguiente. Sólo Reservas; Accesos y los demás andaban.
 *
 * La causa es el SOBRE de la respuesta. Medido contra el API real:
 *
 * ```
 * [RESERVAS] message = -1          <- número pelado
 * [AREAS]    message = {"total":-1} <- objeto, como los otros 39 módulos
 * ```
 *
 * `ReservationController::afterList` devuelve `$total` crudo; el `afterList`
 * por defecto (`Mk/Controllers/BaseController:240`) devuelve `['total' => …]`,
 * y ese valor va tal cual al campo `message` del sobre.
 *
 * Con `message` numérico, `getResponseTotal` no encuentra ni `message.total`
 * ni `total`, así que **cae al fallback, que es `listRows.length`**. Entonces
 * `loadMoreRows` evalúa `listRows.length >= currentTotal` contra el largo de
 * la propia lista: siempre verdadero, siempre corta. Y como el efecto que
 * fija `listHasMore` usa otra medida (`hasExplicitResponseTotal`), la lista
 * dice "hay más" —dibuja el esqueleto— mientras el que pide se niega.
 *
 * ⚠️ El `-1` de los otros módulos es lo único que los salvaba: `currentTotal`
 * daba `-1`, la guarda `currentTotal > 0` no se cumplía y seguían pidiendo.
 * No es que Reservas hiciera nada raro: es que perdió el centinela.
 *
 * Y una vez que `loadMoreRows` se niega una vez, no hay reintento: `Table`
 * baja `canTriggerNextLoadRef` ANTES de llamar a `onLoadMore` y sólo la
 * levanta si el usuario se aleja del fondo. El cuelgue es permanente.
 *
 * ## Qué pinea este test
 *
 * Con `listHasMore === true`, `onLoadMore()` TIENE que salir a pedir. Se mide
 * con los dos sobres, porque el arreglo no puede romperle el scroll a los 39
 * módulos que mandan el sobre con objeto.
 */

const execute = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: null,
    reLoad: vi.fn(),
    execute,
    loaded: true,
    error: null,
    cancel: vi.fn(),
    waiting: 0,
    setWaiting: vi.fn(),
  }),
}));

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
vi.mock("@/mk/components/ui/NewModal/NewModal", () => ({
  default: () => null,
}));
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

/** `useCrud` normaliza el perPage del módulo (20) a su lote mínimo. */
const LOTE = 40;

const filas = (desde: number, cuantas: number) =>
  Array.from({ length: cuantas }, (_, i) => ({
    id: `r-${desde + i}`,
    name: `Fila ${desde + i}`,
  }));

const mod: ModCrudType = {
  modulo: "reservations",
  singular: "reserva",
  plural: "reservas",
  permiso: "reservations",
} as ModCrudType;

const fields = {
  id: { rules: [], api: "e" },
  name: { rules: [], api: "ae", label: "Nombre", list: {} },
};

/** Renderea `useCrud` y deja el runtime a mano para manejarlo desde el test. */
const montar = () => {
  const runtime: { current: any } = { current: null };

  const Comp = () => {
    runtime.current = useCrud({
      paramsInitial: { page: 1, perPage: 20, fullType: "L", searchBy: "" },
      mod,
      fields,
    });
    return null;
  };

  render(<Comp />);
  return runtime;
};

describe("useCrud: el scroll infinito no se cuelga", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    [
      "el sobre de Reservas (`message` es un número pelado)",
      (total: number) => total,
    ],
    [
      "el sobre de los otros 39 módulos (`message` es `{ total }`)",
      (total: number) => ({ total }),
    ],
    [
      // Sin esta fila el corte de `loadMoreRows` queda sin medir: con el
      // total ausente el fallback de `getResponseTotal` es el largo de la
      // propia lista y la guarda vieja cortaba igual, sin importar el sobre.
      "un sobre SIN total (el API no lo mandó)",
      () => "",
    ],
  ])("pide la página siguiente con %s", async (_nombre, sobre) => {
    // El API tiene el conteo apagado y devuelve -1 como total: es lo que se
    // midió contra el server real, en los dos módulos.
    execute.mockImplementation(async (_url: string, _m: string, p: any) => ({
      data: {
        data: filas((Number(p?.page || 1) - 1) * LOTE + 1, LOTE),
        message: sobre(-1),
      },
      error: null,
    }));

    const runtime = montar();

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(runtime.current.listHasMore).toBe(true));

    expect(
      execute.mock.calls[0][2],
      "La primera página tiene que salir con el lote normalizado.",
    ).toMatchObject({ page: 1, perPage: LOTE });

    await act(async () => {
      runtime.current.onLoadMore();
    });

    // 🔴 Acá se colgaba: `listHasMore` decía que había más —y por eso abajo
    // quedaba el esqueleto— pero `loadMoreRows` cortaba antes de pedir nada.
    await waitFor(
      () =>
        expect(
          execute,
          "La lista promete que hay más filas y no las pide: el esqueleto de " +
            "'cargando más' queda para siempre y no sale ningún request.",
        ).toHaveBeenCalledTimes(2),
      { timeout: 2000 },
    );

    expect(execute.mock.calls[1][2]).toMatchObject({ page: 2, perPage: LOTE });

    // Y las filas de las dos páginas quedan pegadas, sin perder ni duplicar.
    await waitFor(() =>
      expect(runtime.current.data?.data).toHaveLength(LOTE * 2),
    );
  });

  it("deja de pedir cuando el total SÍ vino y ya están todas las filas", async () => {
    const TOTAL = 45;

    execute.mockImplementation(async (_url: string, _m: string, p: any) => {
      const pagina = Number(p?.page || 1);
      const desde = (pagina - 1) * LOTE + 1;
      const cuantas = Math.max(0, Math.min(LOTE, TOTAL - desde + 1));
      return {
        data: { data: filas(desde, cuantas), message: { total: TOTAL } },
        error: null,
      };
    });

    const runtime = montar();

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(runtime.current.listHasMore).toBe(true));

    await act(async () => {
      runtime.current.onLoadMore();
    });

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(runtime.current.data?.data).toHaveLength(TOTAL),
    );

    // Ya están las 45: no hay más que pedir y la lista tiene que decirlo.
    await waitFor(() => expect(runtime.current.listHasMore).toBe(false));

    await act(async () => {
      runtime.current.onLoadMore();
    });

    expect(
      execute,
      "Pidió una página de más: con el total conocido y la lista completa no " +
        "hay nada que traer.",
    ).toHaveBeenCalledTimes(2);
  });
});
