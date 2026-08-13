import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act, waitFor } from "@testing-library/react";
import React from "react";

/**
 * Doble click en Guardar = UN solo POST, no dos altas.
 *
 * ## 🔴 Qué se rompía (review 4R del 2026-08-12)
 *
 * `onSave` no tenía guarda de en-vuelo: el botón Guardar del `DataModal` no
 * se deshabilita durante el `await`, así que un doble click despachaba DOS
 * POST idénticos antes de que el primero respondiera. Dos reservas para el
 * mismo horario — y en un área paga, DOS deudas para el mismo residente.
 *
 * `useReservationDetail` ya tenía el patrón (`isActionLoading` ignora el
 * segundo click); el hook compartido de los ~40 módulos, no.
 *
 * ## Reinyección, medida el 2026-08-13
 *
 * Con la guarda quitada: **1/2 rojos** (salían 2 POST). Con la guarda: 2/2
 * verdes.
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

const showToast = vi.fn();
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast,
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

const paginaOk = (p: any) => ({
  data: {
    data: filas((Number(p?.page || 1) - 1) * LOTE + 1, LOTE),
    message: { total: -1 },
  },
  error: null,
});

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

const postsDespachados = () =>
  execute.mock.calls.filter((llamada) => llamada[1] === "POST");

describe("useCrud: la guarda de en-vuelo de onSave", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
    execute.mockImplementation(
      async (_url: string, method: string, p: any) => {
        if (method === "POST") {
          // El POST tarda: el segundo click llega con el primero EN VUELO.
          await new Promise((resolve) => setTimeout(resolve, 25));
          return { data: { success: true, message: "creada" }, error: null };
        }
        return paginaOk(p);
      },
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("doble click en Guardar despacha UN solo POST", async () => {
    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    await act(async () => {
      // Los dos clicks del usuario impaciente, sin esperar al primero.
      // ⚠️ No se espera a que los onSave TERMINEN: con el bug puesto, los dos
      // guardados pisan el mismo `pendingReloadResolveRef` y una de las
      // promesas no resuelve nunca — esperarlas colgaría el test en vez de
      // ponerlo rojo. El POST se despacha sincrónico, así que con dejar
      // asentar el mock alcanza.
      void runtime.current.onSave({ name: "Salón 18:00" });
      void runtime.current.onSave({ name: "Salón 18:00" });
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    // 🔴 Acá salían DOS: dos reservas para el mismo horario, y en un área
    // paga dos deudas para el mismo residente.
    expect(
      postsDespachados(),
      "un doble click no puede crear dos reservas",
    ).toHaveLength(1);
  });

  it("después de que el guardado terminó, se puede guardar de nuevo", async () => {
    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    // ⚠️ `onSave` no se puede AWAITEAR adentro de `act`: espera al reload de
    // la lista, cuya promesa resuelve en un efecto que recién corre cuando
    // `act` termina — esperarla adentro es un deadlock. Se dispara y se deja
    // asentar; al salir de cada `act` el guardado ya terminó entero.
    await act(async () => {
      void runtime.current.onSave({ name: "Salón 18:00" });
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    await act(async () => {
      void runtime.current.onSave({ name: "Piscina 10:00" });
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    // La guarda es de EN-VUELO, no un candado permanente.
    expect(postsDespachados()).toHaveLength(2);
  });
});
