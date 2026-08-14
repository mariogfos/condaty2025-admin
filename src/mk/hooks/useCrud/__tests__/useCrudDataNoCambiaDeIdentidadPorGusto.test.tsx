import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import React from "react";

/**
 * `data` no puede cambiar de identidad si los datos no cambiaron.
 *
 * ## 🔴 Qué se rompía (medido el 2026-08-13 en `/owners`)
 *
 * Los módulos arman `mod` como objeto literal DENTRO del componente: **23 de
 * los 40 consumidores** lo hacen así, y con `fields` es peor —35 de 40, afuera
 * CERO—. O sea que en cada render llega una identidad nueva.
 *
 * `getListRowsFromResponse` tenía `[mod, params]` en sus dependencias, así que
 * se recreaba en cada render. Y como es dependencia del `useMemo` de
 * `resolvedData` —que en el camino de scroll infinito **arma un objeto nuevo
 * cada vez que corre**—, la lista entera recibía datos nuevos sin que hubiera
 * cambiado un solo dato.
 *
 * Medido abriendo `/owners`: **`data` cambiaba de identidad 10 veces seguidas**
 * sin que cambiara ningún otro estado del hook. Al buscar, 6 veces más.
 *
 * No es un bug visible —la pantalla muestra lo correcto—, y por eso sobrevivió:
 * cuesta memoria y velocidad, que no se ven en una captura.
 *
 * ## ⚠️ La primera versión de este test no medía nada
 *
 * Usaba `perPage: -1` y un `useAxios` que devolvía `data: null`. Con `data` en
 * null, `resolvedData` corta en la primera línea y devuelve `null` siempre:
 * `null === null`, identidad estable, verde eterno. Reinyecté el bug y quedó
 * **verde igual**.
 *
 * Por eso acá se monta el camino REAL: scroll infinito (`perPage: 20`) y una
 * respuesta con filas de verdad. Reinyección medida: con `[mod, params]` de
 * vuelta en las dependencias, da **rojo** — 3 identidades donde debería haber 1.
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

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast: vi.fn(),
  }),
}));

vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: () => <div data-testid="table-mock" />,
}));
vi.mock("@/mk/components/ui/Pagination/Pagination", () => ({ default: () => null }));
vi.mock("@/mk/hooks/useCrud/FormElement", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/DataSearch/DataSearch", () => ({ default: () => null }));
vi.mock("@/mk/components/data/ImportDataModal/ImportDataModal", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/DetailModal/DetailModal", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/NewModal/NewModal", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/FloatButton/FloatButton", () => ({ default: () => null }));
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

const paginaOk = (p: any) => ({
  data: {
    data: filas((Number(p?.page || 1) - 1) * LOTE + 1, LOTE),
    message: { total: 200 },
  },
  error: null,
});

/**
 * Reproduce lo que hace un módulo real: `mod` y `fields` se declaran ADENTRO
 * del componente, así que son objetos nuevos en cada render. Declararlos afuera
 * haría pasar el test sin medir nada.
 */
const montar = () => {
  const datas: any[] = [];
  let forzarRender: (() => void) | null = null;

  const Comp = () => {
    const [, setTick] = React.useState(0);
    forzarRender = () => setTick((t) => t + 1);

    const mod: ModCrudType = {
      modulo: "owners",
      singular: "residente",
      plural: "residentes",
      permiso: "owners",
    } as ModCrudType;

    const fields = {
      id: { rules: [], api: "e" },
      name: { rules: [], api: "ae", label: "Nombre", list: {} },
    };

    const crud = useCrud({
      paramsInitial: { page: 1, perPage: 20, fullType: "L", searchBy: "" },
      mod,
      fields,
    });

    datas.push(crud.data);
    return null;
  };

  render(<Comp />);
  return { datas, forzarRender: () => act(() => forzarRender?.()) };
};

describe("useCrud: la identidad de `data`", () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockImplementation(async (_url: any, _method: any, p: any) => paginaOk(p));
  });

  it("no cambia cuando se re-renderiza sin que cambien los datos", async () => {
    const { datas, forzarRender } = montar();

    // Sin filas cargadas el memo corta antes de llegar a la parte que importa.
    await waitFor(() => expect(datas.at(-1)?.data?.length).toBe(LOTE));

    const desde = datas.length;
    forzarRender();
    forzarRender();
    forzarRender();

    const trasRerender = datas.slice(desde - 1);
    const identidades = new Set(trasRerender).size;

    expect(
      identidades,
      `\`data\` cambió de identidad ${identidades} veces en ${trasRerender.length} renders sin que cambiaran los datos. ` +
        "Casi seguro alguien volvió a meter `mod`, `fields` o `params` en las dependencias de `getListRowsFromResponse` " +
        "o del memo de `resolvedData`: los módulos los arman adentro del componente, así que llegan con identidad nueva en cada render.",
    ).toBe(1);
  });

  it("sobrevive a diez renders seguidos con `mod` y `fields` nuevos cada vez", async () => {
    const { datas, forzarRender } = montar();
    await waitFor(() => expect(datas.at(-1)?.data?.length).toBe(LOTE));

    // Diez renders seguidos: el escenario exacto que se midió en `/owners`.
    for (let i = 0; i < 10; i++) forzarRender();

    expect(new Set(datas.slice(-10)).size).toBe(1);
  });
});
