import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act, waitFor } from "@testing-library/react";
import React from "react";

/**
 * Un guardado que falla SIEMPRE dice algo.
 *
 * ## 🔴 Qué se rompía (CDT-60)
 *
 * "El botón Crear de Deudas Individuales no hace nada, ningún mensaje."
 *
 * El alta mandaba las cuatro banderas como `'Y'`/`'N'` a columnas `tinyint(1)`,
 * MySQL en modo estricto tiraba
 * `ERROR 1366: Incorrect integer value: 'N' for column has_mv` y el request
 * moría. Sin sobre de respuesta, `response` queda `undefined`, así que
 * `showToast(response?.message, "error")` pedía un toast SIN MENSAJE — y
 * `useToast` con mensaje vacío vaciaba la cola y no mostraba nada.
 *
 * El bug de origen es de un formulario; el ENCUBRIMIENTO es del kernel y lo
 * consumen ~40 pantallas: cualquier módulo cuyo POST reviente se veía igual de
 * mudo. Por eso la red va acá.
 *
 * La otra puerta muda era el `return` de la validación: `setErrors` deja los
 * mensajes en el estado, pero un formulario que pinta sólo sus errores locales
 * no muestra ni uno y el click se pierde en el vacío.
 *
 * ## Reinyección, medida el 2026-08-16
 *
 * Con `showToast(response?.message, "error")` (sin genérico) y con el `return`
 * mudo de la validación: **2/3 rojos**.
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

const mod: ModCrudType = {
  modulo: "v3/debt-dptos",
  singular: "Deuda",
  plural: "",
  permiso: "expense",
} as ModCrudType;

const fields = {
  id: { rules: [], api: "e" },
  dpto_id: { rules: ["required"], api: "ae", label: "Unidad" },
  amount: { rules: [], api: "ae", label: "Monto", list: {} },
};

const listaOk = () => ({
  data: { data: [], message: { total: 0 } },
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

/** Los toast que el usuario VE: con texto. Un toast sin mensaje no existe. */
const toastsVisibles = () =>
  showToast.mock.calls.filter(([msg]) => !!msg && String(msg).trim() !== "");

describe("useCrud: un guardado fallido no puede ser mudo", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("el request que revienta —sin sobre de respuesta— saca un mensaje visible", async () => {
    execute.mockImplementation(async (_url: string, method: string) => {
      if (method === "POST") {
        // Es LITERALMENTE lo que devuelve `useAxios` cuando el request muere:
        // no hay sobre, `data` es null. Es el caso del 1366 de MySQL.
        return { data: null, error: { data: {} } };
      }
      return listaOk();
    });

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    await act(async () => {
      void runtime.current.onSave({ dpto_id: 7, amount: 150 });
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    // 🔴 Acá no salía NADA: el usuario apretaba Crear y la pantalla se quedaba
    // igual. Ni éxito, ni error, ni el modal cerrándose.
    expect(
      toastsVisibles(),
      "un guardado que falla tiene que decir algo",
    ).toHaveLength(1);
    expect(toastsVisibles()[0][1]).toBe("error");
  });

  it("si el API sí manda mensaje, gana el del API sobre el genérico", async () => {
    execute.mockImplementation(async (_url: string, method: string) => {
      if (method === "POST") {
        return {
          data: { success: false, message: "La unidad ya tiene esa deuda" },
          error: null,
        };
      }
      return listaOk();
    });

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    await act(async () => {
      void runtime.current.onSave({ dpto_id: 7, amount: 150 });
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    expect(toastsVisibles()).toHaveLength(1);
    expect(toastsVisibles()[0][0]).toBe("La unidad ya tiene esa deuda");
  });

  it("el rechazo de la validación del kernel se avisa, no se traga", async () => {
    execute.mockImplementation(async () => listaOk());

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    await act(async () => {
      // `dpto_id` es `required`: `checkRulesFields` lo rechaza y el POST ni sale.
      void runtime.current.onSave({ amount: 150 });
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    const posts = execute.mock.calls.filter((c) => c[1] === "POST");
    expect(posts, "con la validación rota no se despacha nada").toHaveLength(0);

    // 🔴 Acá el `return` era mudo: el click se perdía en el vacío.
    expect(
      toastsVisibles(),
      "un rechazo de validación tiene que verse",
    ).toHaveLength(1);
    expect(toastsVisibles()[0][1]).toBe("error");
  });
});
