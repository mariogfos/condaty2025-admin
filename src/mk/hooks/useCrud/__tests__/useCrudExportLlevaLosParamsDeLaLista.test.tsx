/**
 * El export tiene que llevar los MISMOS params con que se armó la lista.
 *
 * 🔴 El bug (2026-08-06, lo reportó Mario): en el detalle de un periodo de
 * expensas, el botón de exportar tiraba
 * `htmlspecialchars(): Argument #1 ($string) must be of type string,
 * App\Modules\Payments\Enums\DebtStatus given`.
 *
 * La causa estaba acá: al `DownloadButton` sólo le viajaban `filterBy` y
 * `searchBy`. Esa lista se define por `year` + `month` + `type`, que quedaban
 * afuera; el back, sin esos params, resolvía la clave GENÉRICA del endpoint
 * —que atiende cinco pantallas—, no encontraba config y se iba por el motor
 * viejo, que escapa valores crudos y revienta con un enum.
 *
 * O sea: el síntoma era un error de escape de HTML y la causa era que el
 * export no sabía qué lista estaba exportando.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

const paramsCapturados: Array<Record<string, any>> = [];

vi.mock("@/mk/components/ui/DownloadButton/DownloadButton", () => ({
  default: (props: any) => {
    paramsCapturados.push(props.params);
    return <button type="button">{props.title}</button>;
  },
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: { data: [], message: "", success: true },
    reLoad: vi.fn(),
    loaded: true,
    error: null,
    execute: vi.fn(),
  }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast: vi.fn(),
    waiting: false,
    setWaiting: vi.fn(),
  }),
}));

import useCrud, { ModCrudType } from "../useCrud";

const campos = {
  id: { rules: [], api: "e" },
  nombre: { rules: [], api: "ae", label: "Nombre", list: true },
};

const montar = (paramsInitial: Record<string, any>) => {
  const Comp = () => {
    const { List } = useCrud({
      paramsInitial,
      mod: {
        modulo: "v3/debt-dptos",
        singular: "",
        plural: "",
        permiso: "expenses",
        pagination: false,
        export: false,
        exportAsync: {
          type: "expenses-periodo",
          label: "Exportar",
          supportedFormats: ["pdf", "xlsx", "csv"],
          endpoint: "/v3/debt-dptos",
        },
      } as unknown as ModCrudType,
      fields: campos,
    });
    return <List emptyMsg="vacío" emptyLine2="" />;
  };
  render(<Comp />);
  return paramsCapturados.at(-1) ?? {};
};

beforeEach(() => {
  paramsCapturados.length = 0;
});

describe("params del export", () => {
  it("lleva los params que definen la lista, no sólo filterBy y searchBy", () => {
    const params = montar({
      fullType: "L",
      page: 1,
      perPage: 20,
      year: 2026,
      month: 3,
      type: 1,
    });

    expect(params.year).toBe(2026);
    expect(params.month).toBe(3);
    expect(params.type).toBe(1);
  });

  /**
   * El paginado no: el back lo ignora en un export —trae todas las filas— y
   * mandarlo sólo invita a que alguien lo respete y exporte una página.
   */
  it("no lleva el paginado", () => {
    const params = montar({
      fullType: "L",
      page: 3,
      perPage: 20,
      year: 2026,
      month: 3,
    });

    expect(params).not.toHaveProperty("page");
    expect(params).not.toHaveProperty("perPage");
  });

  it("sigue llevando filterBy y searchBy", () => {
    const params = montar({
      fullType: "L",
      page: 1,
      perPage: 20,
      filterBy: "status:1",
      searchBy: "M20",
    });

    expect(params.filterBy).toBe("status:1");
    expect(params.searchBy).toBe("M20");
  });
});
