import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

/**
 * Sin la R de `mod.permiso`, `useCrud` NO pide el listado.
 *
 * ## 🔴 Por qué existe
 *
 * La pantalla pinta `<NotAccess/>` con un `return` que llega DESPUÉS de
 * `useCrud`: el hook ya había montado `useAxios` con la URL del módulo y el
 * `GET` salía igual. Desde que el API pide la R del rol en las lecturas
 * (api#697), cada visita sin la letra dejaba un 403 en los logs.
 *
 * Se miden los dos caminos del hook, porque piden por lados distintos: la
 * lista paginada común (la URL de `useAxios`) y el scroll infinito (`execute`
 * desde el efecto de `params`). Y `permiso: ""` —«sin guarda»— sigue pidiendo.
 */

let abilities: string[] = [];
// Como el `userCan` real: una cadena vacía es «sin guarda» y pasa siempre.
const userCan = (ability: string, action: string) =>
  !ability ||
  abilities.some(
    (a) => a.startsWith(ability + ":") && a.split(":")[1].includes(action),
  );

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    userCan,
    showToast: vi.fn(),
    store: {},
    setStore: vi.fn(),
  }),
}));

const useAxiosUrls: Array<string | null> = [];
const execute = vi.fn();
const reLoad = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: (url: string | null) => {
    useAxiosUrls.push(url);
    return {
      data: null,
      reLoad,
      execute,
      loaded: true,
      error: null,
      cancel: vi.fn(),
      waiting: 0,
      setWaiting: vi.fn(),
    };
  },
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

const fields = {
  id: { rules: [], api: "e" },
  name: { rules: [], api: "ae", label: "Nombre", list: {} },
};

const runtime: { current: any } = { current: null };

const montar = (permiso: string, perPage: number) => {
  const mod = {
    modulo: "reservations",
    singular: "reserva",
    plural: "reservas",
    permiso,
  } as ModCrudType;

  const Comp = () => {
    runtime.current = useCrud({
      paramsInitial: { page: 1, perPage, fullType: "L", searchBy: "" },
      mod,
      fields,
    });
    const List = runtime.current.List;
    return <List height="100%" />;
  };

  const { rerender } = render(<Comp />);
  return () => rerender(<Comp />);
};

// Deja correr los efectos del montaje antes de afirmar que NO hubo pedido.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useCrud no pide el listado sin la R del permiso", () => {
  beforeEach(() => {
    abilities = [];
    useAxiosUrls.length = 0;
    execute.mockReset();
    reLoad.mockReset();
    execute.mockResolvedValue({ data: { data: [] }, error: null });
  });

  afterEach(() => {
    cleanup();
  });

  describe("lista paginada común (la URL de useAxios)", () => {
    it("sin la R no le da URL a useAxios", async () => {
      abilities = ["reservations:CUD", "areas:R"];
      montar("reservations", -1);
      await flush();

      expect(useAxiosUrls.length).toBeGreaterThan(0);
      expect(useAxiosUrls.every((url) => url === null)).toBe(true);
      expect(execute).not.toHaveBeenCalled();
    });

    it("con la R le da la URL del módulo", async () => {
      abilities = ["reservations:R"];
      montar("reservations", -1);
      await flush();

      expect(useAxiosUrls).toContain("/reservations");
      // Lo pidió `useAxios` al montarse: el efecto de `params` no lo repite.
      expect(reLoad).not.toHaveBeenCalled();
    });
  });

  it("sin la R, recargar (p. ej. después de guardar con C) no pide nada", async () => {
    // Sin la letra `useAxios` no tiene URL: su `reLoad` pediría `null?…`.
    abilities = ["reservations:CUD"];
    montar("reservations", -1);
    await flush();

    await runtime.current.reLoad();

    expect(reLoad).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  describe("scroll infinito (execute)", () => {
    it("sin la R no llama a execute", async () => {
      abilities = ["reservations:CUD"];
      montar("reservations", 20);
      await flush();

      expect(execute).not.toHaveBeenCalled();
    });

    it("con la R pide el listado", async () => {
      abilities = ["reservations:R"];
      montar("reservations", 20);

      await waitFor(() =>
        expect(execute).toHaveBeenCalledWith(
          "/reservations",
          "GET",
          expect.objectContaining({ page: 1 }),
          false,
          false,
        ),
      );
    });
  });

  it("si la letra llega después del montaje, pide ahí (una sola vez)", async () => {
    abilities = ["reservations:CUD"];
    const rerender = montar("reservations", -1);
    await flush();
    expect(execute).not.toHaveBeenCalled();
    expect(reLoad).not.toHaveBeenCalled();

    // Cambio de condominio: el rol nuevo sí tiene la R.
    abilities = ["reservations:R"];
    rerender();

    // `useAxios` pide por su cuenta sólo al montarse; acá la URL llega tarde
    // y el pedido lo tiene que hacer el efecto de `params` de `useCrud`.
    await waitFor(() => expect(reLoad).toHaveBeenCalledTimes(1));
    await flush();
    expect(reLoad).toHaveBeenCalledTimes(1);
  });

  it('permiso "" es «sin guarda»: pide aunque el rol no tenga nada', async () => {
    abilities = [];
    montar("", -1);
    await flush();

    expect(useAxiosUrls).toContain("/reservations");
  });
});
