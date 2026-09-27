/**
 * `mod.validateExport` veta el export con los filtros de la lista: el botón
 * recibe el veto, y si el módulo dice que no, se avisa y no se pide nada.
 * Lo usa Accesos para no exportar el año entero (producción 87439942).
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

let beforeExport: ((format: string) => boolean) | undefined;
const showToast = vi.fn();

vi.mock("@/mk/components/ui/DownloadButton/DownloadButton", () => ({
  default: (props: any) => {
    beforeExport = props.beforeExport;
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
    showToast,
    waiting: false,
    setWaiting: vi.fn(),
  }),
}));

import useCrud, { ModCrudType } from "../useCrud";

const validateExport = vi.fn(({ params }: { params: Record<string, any> }) =>
  params.filterBy === "in_at:y" ? "Muy grande" : null,
);

const montar = (filterBy: string) => {
  const Comp = () => {
    const { List } = useCrud({
      paramsInitial: { fullType: "L", page: 1, perPage: 20, filterBy },
      mod: {
        modulo: "accesses",
        singular: "",
        plural: "",
        permiso: "accesses",
        pagination: false,
        export: false,
        exportAsync: {
          type: "accesses",
          supportedFormats: ["pdf", "xlsx"],
          endpoint: "/accesses",
        },
        validateExport,
      } as unknown as ModCrudType,
      fields: { id: { rules: [], api: "e" } },
    });
    return <List emptyMsg="vacío" emptyLine2="" />;
  };
  render(<Comp />);
};

describe("validateExport", () => {
  it("veta con los filtros de la lista y avisa el motivo", () => {
    montar("in_at:y");

    expect(beforeExport?.("pdf")).toBe(false);
    expect(validateExport).toHaveBeenLastCalledWith({
      params: expect.objectContaining({ filterBy: "in_at:y" }),
      type: "pdf",
    });
    expect(showToast).toHaveBeenCalledWith("Muy grande", "error");
  });

  it("sin motivo, deja exportar", () => {
    montar("in_at:m");
    expect(beforeExport?.("xlsx")).toBe(true);
  });
});
