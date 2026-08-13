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
 * Un fallo de red al cargar más NO puede perder una página EN SILENCIO.
 *
 * ## 🔴 Qué se rompía (review 4R del 2026-08-12)
 *
 * `loadMoreRows` incrementa `params.page` ANTES de que el request responda
 * (optimista), y el efecto de error limpiaba los flags pero **no revertía el
 * `page`**. La secuencia:
 *
 * 1. Páginas 1 y 2 cargadas. El usuario scrollea → `loadMoreRows` pide la 3
 *    (`params.page = 3`).
 * 2. El request de la 3 FALLA (red). Sin toast, sin renglón de error: la
 *    lista se ve completa.
 * 3. El usuario scrollea de nuevo → `loadMoreRows` hace `page = 3 + 1 = 4`.
 *    **Las 40 filas de la página 3 no aparecen nunca**, y nadie lo sabe.
 *
 * Peor: `fetchInfiniteCrudData` pisaba `manualData` con el `null` del error,
 * así que `resolvedData` devolvía null y la lista entera DESAPARECÍA de la
 * pantalla aunque `listRows` siguiera teniendo las filas.
 *
 * ## Qué pinea este test
 *
 * - El fallo no borra las filas ya cargadas.
 * - El fallo queda VISIBLE (`loadMoreFailed` + renglón con Reintentar).
 * - El reintento pide la MISMA página que falló, no la siguiente.
 *
 * ## Reinyección, medida el 2026-08-13
 *
 * Con el fix revertido (error pisando `manualData`, sin `lastConfirmedPageRef`
 * ni `loadMoreFailed`): **3/3 rojos**. Con el fix: 3/3 verdes.
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

const FALLO_DE_RED = {
  data: null,
  error: { message: "Network Error", status: 0, data: {} },
};

const paginaOk = (p: any) => ({
  data: {
    data: filas((Number(p?.page || 1) - 1) * LOTE + 1, LOTE),
    message: { total: -1 },
  },
  error: null,
});

/**
 * Renderea `useCrud` CON su `List` montada, para poder medir también el
 * renglón de error que ve el usuario.
 */
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

/** Deja la página 1 cargada y hace fallar el request de la 2. */
const cargarUnaPaginaYFallarLaSiguiente = async (runtime: {
  current: any;
}) => {
  await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(runtime.current.listHasMore).toBe(true));

  execute.mockImplementationOnce(async () => FALLO_DE_RED);

  await act(async () => {
    runtime.current.onLoadMore();
  });

  await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
  expect(execute.mock.calls[1][2]).toMatchObject({ page: 2 });
};

describe("useCrud: un fallo de red al cargar más no pierde la página", () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockImplementation(async (_url: string, _m: string, p: any) =>
      paginaOk(p),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("el fallo NO borra las filas ya cargadas y queda señalizado", async () => {
    const runtime = montar();
    await cargarUnaPaginaYFallarLaSiguiente(runtime);

    // 🔴 Acá la lista entera desaparecía: el error pisaba `manualData` con
    // null y `resolvedData` devolvía null aunque `listRows` tuviera las 40.
    await waitFor(() =>
      expect(
        runtime.current.data?.data,
        "las filas ya cargadas tienen que sobrevivir al fallo",
      ).toHaveLength(LOTE),
    );

    // Y el fallo no puede ser invisible: la lista NO está completa.
    await waitFor(() => expect(runtime.current.loadMoreFailed).toBe(true));
    expect(runtime.current.isAppendingList).toBe(false);
  });

  it("el reintento pide la MISMA página que falló, no la siguiente", async () => {
    const runtime = montar();
    await cargarUnaPaginaYFallarLaSiguiente(runtime);
    await waitFor(() => expect(runtime.current.loadMoreFailed).toBe(true));

    await act(async () => {
      runtime.current.onLoadMore();
    });

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(3));

    // 🔴 Acá pedía la página 4: el incremento optimista quedaba confirmado
    // aunque el request hubiera fallado, y las 40 filas de la 2 se perdían
    // para siempre, en silencio.
    expect(
      execute.mock.calls[2][2],
      "después de un fallo, la página a pedir es la que FALLÓ",
    ).toMatchObject({ page: 2 });

    await waitFor(() =>
      expect(runtime.current.data?.data).toHaveLength(LOTE * 2),
    );
    await waitFor(() => expect(runtime.current.loadMoreFailed).toBe(false));
  });

  it("el usuario VE el renglón de error y Reintentar trae la página perdida", async () => {
    const runtime = montar();
    await cargarUnaPaginaYFallarLaSiguiente(runtime);

    // El renglón existe — antes no había NADA: ni toast, ni renglón.
    const reintentar = await screen.findByText("Reintentar");
    expect(
      screen.getByText(/No se pudieron cargar más resultados/i),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(reintentar);
    });

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(3));
    expect(execute.mock.calls[2][2]).toMatchObject({ page: 2 });

    await waitFor(() =>
      expect(runtime.current.data?.data).toHaveLength(LOTE * 2),
    );
    await waitFor(() =>
      expect(screen.queryByText(/No se pudieron cargar más resultados/i))
        .not.toBeInTheDocument(),
    );
  });
});
