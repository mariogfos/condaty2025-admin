/**
 * El export de accesos exige un período acotado (producción 87439942): sin
 * período, «Este año», «Año anterior» o más de 60 días, no se pide nada.
 */
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DownloadButton from "@/mk/components/ui/DownloadButton/DownloadButton";
import { validateAccessExport } from "../accessExportLimit";
import AccessesTab from "../AccessTab";

let accessMod: any;
vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: ({ mod }: any) => {
    accessMod = mod;
    return { userCan: () => true, List: () => null, reLoad: vi.fn(), onFilter: vi.fn(), setStore: vi.fn(), store: {} };
  },
}));
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: vi.fn().mockResolvedValue({ data: null }) }),
}));

const check = (filterBy?: string) => validateAccessExport({ params: { filterBy } });

describe("validateAccessExport", () => {
  it("deja exportar los períodos cortos y un rango de hasta 60 días", () => {
    for (const period of ["d", "ld", "w", "lw", "m", "lm"]) {
      expect(check(`in_at:${period}`)).toBeNull();
    }
    expect(check("in_at:2026-01-01,2026-03-02")).toBeNull(); // 60 días
    expect(check("dpto_id:4|in_at:m")).toBeNull();
  });

  it("no deja sin período, con el año o con más de 60 días", () => {
    expect(check(undefined)).toMatch(/elegir un periodo/);
    expect(check("in_at:ALL")).toMatch(/elegir un periodo/);
    expect(check("in_at:y")).toMatch(/menor a 60 días/);
    expect(check("in_at:ly")).toMatch(/menor a 60 días/);
    expect(check("in_at:2026-01-01,2026-03-03")).toMatch(/superar 60 días/);
    expect(check("in_at:2026-03-01,2026-01-01")).toMatch(/no es válido/);
  });
});

describe("AccessesTab", () => {
  it("declara el límite en su módulo", () => {
    render(<AccessesTab paramsInitial={{ filterBy: { in_at: "m" } }} />);
    expect(accessMod.validateExport).toBe(validateAccessExport);
  });
});

describe("DownloadButton con beforeExport", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("un veto no pide el export", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const beforeExport = vi.fn(() => false);

    render(
      <DownloadButton type="accesses" params={{}} endpoint="/accesses" beforeExport={beforeExport} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId("download-btn-accesses"));
    });

    expect(beforeExport).toHaveBeenCalledWith("pdf");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
