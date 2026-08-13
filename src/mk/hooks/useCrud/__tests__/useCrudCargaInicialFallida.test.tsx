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

/**
 * "El API está caído" y "no hay filas" NO pueden verse iguales.
 *
 * ## 🔴 Qué se rompía (review 4R del 2026-08-12)
 *
 * Cuando la carga INICIAL fallaba (red caída, 500), `useAxios` dejaba
 * `data = null` y `loaded = true`. Con eso `shouldRequestTableSkeleton` se
 * apagaba y el render caía al branch `runtime.data === null ? null : …`:
 * **nada**. Ni tabla, ni mensaje, ni botón. `runtime.error` traía el error y
 * ningún render lo miraba.
 *
 * El usuario veía la pantalla en blanco (o el estado "sin reservas" si algo
 * dejaba un array vacío) y le creía: "no hay reservas". No había forma de
 * distinguirlo de una lista genuinamente vacía, ni forma de reintentar sin
 * refrescar la página entera.
 *
 * ## Qué pinea este test
 *
 * Con `error` truthy y sin filas que mostrar, la lista muestra un estado de
 * error VISIBLE con un botón que dispara `reloadCrudList` de verdad.
 *
 * ## Reinyección, medida el 2026-08-13
 *
 * Con el fix revertido (sin el branch de error en el render): **2/2 rojos**.
 * Con el fix: 2/2 verdes.
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

const FALLO_DE_RED = {
  data: null,
  error: { message: "Network Error", status: 0, data: {} },
};

const montar = () => {
  const runtime: { current: any } = { current: null };

  const Comp = () => {
    runtime.current = useCrud({
      paramsInitial: { page: 1, perPage: 20, fullType: "L", searchBy: "" },
      mod,
      fields,
    });
    const List = runtime.current.List;
    return <List height="100%" />;
  };

  render(<Comp />);
  return runtime;
};

describe("useCrud: la carga inicial fallida no se disfraza de lista vacía", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("con el API caído muestra el estado de ERROR, no una pantalla en blanco", async () => {
    execute.mockImplementation(async () => FALLO_DE_RED);

    const runtime = montar();

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    // 🔴 Acá el render devolvía `null`: con `loaded=true` y `data=null` el
    // esqueleto se apagaba y `runtime.error` no se renderizaba en ningún
    // lado. "Sin reservas" y "el API está caído" se veían idénticos.
    expect(
      await screen.findByText("No se pudo cargar el listado."),
    ).toBeInTheDocument();
    expect(screen.getByText("Recargar")).toBeInTheDocument();

    // Y NO es el estado vacío: eso le mentiría al usuario.
    expect(screen.queryByTestId("empty-data")).not.toBeInTheDocument();
    expect(runtime.current.data).toBeNull();
  });

  it("Recargar dispara el request de nuevo y, si responde, la tabla aparece", async () => {
    execute.mockImplementationOnce(async () => FALLO_DE_RED);
    execute.mockImplementation(async (_url: string, _m: string, p: any) => ({
      data: {
        data: filas((Number(p?.page || 1) - 1) * LOTE + 1, LOTE),
        message: { total: -1 },
      },
      error: null,
    }));

    montar();

    const recargar = await screen.findByText("Recargar");

    await act(async () => {
      fireEvent.click(recargar);
    });

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(
      execute.mock.calls[1][2],
      "la recarga arranca de la página 1",
    ).toMatchObject({ page: 1 });

    expect(await screen.findByTestId("table-mock")).toBeInTheDocument();
    expect(
      screen.queryByText("No se pudo cargar el listado."),
    ).not.toBeInTheDocument();
  });
});
