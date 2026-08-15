import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  cleanup,
  act,
  waitFor,
  screen,
  fireEvent,
} from "@testing-library/react";
import React from "react";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";

/**
 * CDT-42: un request que falla NO puede dejar el dato viejo en pantalla como si
 * fuera fresco.
 *
 * ## 🔴 Qué se rompía
 *
 * `useAxios` conserva `data` cuando el request falla —a propósito: pisarlo con
 * null hace desaparecer la lista entera—, así que tras un refresco fallido las
 * filas viejas siguen dibujadas. Y el render de `useCrud` decide así:
 *
 * ```tsx
 * {showTableSkeleton || filteredData?.length > 0 ? <Table … /> : runtime.error ? …}
 * ```
 *
 * Con filas en pantalla el primer branch gana SIEMPRE, así que el estado de
 * error —que ya existía, con su texto y su botón "Recargar"— era inalcanzable.
 * El usuario veía datos viejos, sin un solo aviso, y les creía.
 *
 * ## La decisión de producto (Alexander)
 *
 * Opción B: el dato viejo se queda visible pero MARCADO. La condición con la
 * que se aceptó es que el aviso sea imposible de pasar por alto.
 *
 * ## Qué pinea este test
 *
 * Este archivo NO mockea `useAxios`: corre el hook de verdad contra una
 * instancia de axios falsa inyectada por `AxiosContext`, así que mide
 * `isStale` y el render juntos, que es donde vive el bug.
 *
 * 🔴 El caso del PARPADEO es el que más cuesta: `error` se limpia al ARRANCAR
 * cada petición, así que un aviso colgado de `!!error` se apaga apenas el
 * usuario toca "Reintentar" y se vuelve a prender si falla. `isStale` se
 * escribe sólo cuando la petición TERMINA, y por eso se sostiene.
 */

vi.mock("@/mk/components/ui/Table/Table", () => ({
  // Reenvía `style`: la atenuación del dato viejo viaja por ahí.
  default: ({ style }: any) => <div data-testid="table-mock" style={style} />,
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
vi.mock("@/components/NoData/EmptyData", () => ({
  default: () => <div data-testid="empty-data" />,
}));
vi.mock("@/mk/hooks/useMediaQuery", () => ({ default: () => false }));
vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) mocked[key] = () => null;
  return mocked;
});

import useCrud, { ModCrudType } from "../useCrud";

const AVISO = "No se pudo actualizar: estos datos están desactualizados.";
const ERROR_INICIAL = "No se pudo cargar el listado.";

const request = vi.fn();

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

const filas = (cuantas: number) =>
  Array.from({ length: cuantas }, (_, i) => ({
    id: `r-${i + 1}`,
    name: `Fila ${i + 1}`,
  }));

const respuestaOk = (cuantas = 3) => ({
  data: { data: filas(cuantas), message: { total: cuantas } },
});

const fallo = () => Promise.reject(new Error("Network Error"));

/**
 * 🔴 `perPage: -1` a propósito: es el modo SIN scroll infinito, el que usan 12
 * de los 40 módulos, y es exactamente donde vive el bug. Con scroll infinito un
 * refresco arranca por `beginListReset`, que borra las filas de pantalla, así
 * que ahí no hay dato viejo que marcar.
 */
const montar = () => {
  const runtime: { current: any } = { current: null };

  const Comp = () => {
    runtime.current = useCrud({
      paramsInitial: { page: 1, perPage: -1, fullType: "L", searchBy: "" },
      mod,
      fields,
    });
    const List = runtime.current.List;
    return <List height="100%" />;
  };

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
      <Comp />
    </AxiosContext.Provider>,
  );

  return runtime;
};

describe("useCrud: el dato viejo tras un request fallido se marca como desactualizado", () => {
  beforeEach(() => {
    request.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("(a) falla el refresco con filas en pantalla: sale el aviso y la tabla queda atenuada", async () => {
    request.mockResolvedValueOnce(respuestaOk());

    const runtime = montar();

    expect(await screen.findByTestId("table-mock")).toBeInTheDocument();
    expect(screen.queryByText(AVISO)).not.toBeInTheDocument();

    request.mockImplementationOnce(fallo);
    await act(async () => {
      await runtime.current.reLoad();
    });

    // 🔴 Acá la tabla se seguía dibujando idéntica a una recién cargada.
    expect(await screen.findByText(AVISO)).toBeInTheDocument();
    expect(screen.getByText("Reintentar")).toBeInTheDocument();
    expect(screen.getByTestId("table-mock")).toHaveStyle("opacity: 0.5");
    // Las filas viejas SIGUEN ahí: la opción B es marcarlas, no esconderlas.
    expect(runtime.current.data?.data).toHaveLength(3);
  });

  it("(b) falla sin datos previos: el estado de error de siempre, y UN solo cartel", async () => {
    request.mockImplementation(fallo);

    montar();

    expect(await screen.findByText(ERROR_INICIAL)).toBeInTheDocument();
    expect(screen.queryByText(AVISO)).not.toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("(c) primer render, sin error y sin datos: no muestra nada", async () => {
    let resolver: (v: any) => void = () => {};
    request.mockImplementationOnce(
      () => new Promise((resolve) => (resolver = resolve)),
    );

    montar();

    expect(screen.queryByText(AVISO)).not.toBeInTheDocument();
    expect(screen.queryByText(ERROR_INICIAL)).not.toBeInTheDocument();

    await act(async () => {
      resolver(respuestaOk());
    });
    expect(await screen.findByTestId("table-mock")).toBeInTheDocument();
    expect(screen.queryByText(AVISO)).not.toBeInTheDocument();
  });

  it("(d) falla y después el reintento funciona: el aviso desaparece y la tabla vuelve a plena", async () => {
    request.mockResolvedValueOnce(respuestaOk());
    const runtime = montar();
    await screen.findByTestId("table-mock");

    request.mockImplementationOnce(fallo);
    await act(async () => {
      await runtime.current.reLoad();
    });
    expect(await screen.findByText(AVISO)).toBeInTheDocument();

    request.mockResolvedValueOnce(respuestaOk(5));
    await act(async () => {
      fireEvent.click(screen.getByText("Reintentar"));
    });

    await waitFor(() =>
      expect(screen.queryByText(AVISO)).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("table-mock")).not.toHaveStyle("opacity: 0.5");
  });

  it("(e) el aviso NO parpadea mientras el reintento está en vuelo", async () => {
    request.mockResolvedValueOnce(respuestaOk());
    const runtime = montar();
    await screen.findByTestId("table-mock");

    request.mockImplementationOnce(fallo);
    await act(async () => {
      await runtime.current.reLoad();
    });
    expect(await screen.findByText(AVISO)).toBeInTheDocument();

    // El reintento arranca y queda colgado. `useAxios` limpia `error` justo
    // acá: un aviso colgado de `!!error` se apagaría en este instante.
    let resolver: (v: any) => void = () => {};
    request.mockImplementationOnce(
      () => new Promise((resolve) => (resolver = resolve)),
    );
    act(() => {
      runtime.current.reLoad();
    });

    await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
    expect(
      screen.queryByText(AVISO),
      "el aviso tiene que sostenerse mientras el reintento está en vuelo",
    ).toBeInTheDocument();

    await act(async () => {
      resolver(respuestaOk());
    });
    await waitFor(() =>
      expect(screen.queryByText(AVISO)).not.toBeInTheDocument(),
    );
  });
});
