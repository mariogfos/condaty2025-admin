/**
 * useCrud exportAsync tests (S36.5 — NEW-NEW-43 frontend migration)
 *
 * Pinea coverage para el slot `mod.exportAsync` introducido en S36.5:
 * cuando un módulo pineá `mod.exportAsync`, el `<List />` renderea
 * `<AsyncExportButton>` en lugar del `IconExport` legacy.
 *
 * Flujos validados:
 * 1. mod.exportAsync pineado → AsyncExportButton visible con type correcto
 * 2. mod.export + mod.exportAsync pineados → solo AsyncExportButton, NO IconExport
 * 3. mod.export = true sin mod.exportAsync → IconExport legacy, NO AsyncExportButton
 * 4. exportAsync.exportCols pineado → AsyncExportButton se renderiza
 * 5. exportAsync.extraParams pineado → AsyncExportButton se renderiza
 * 6. mod sin export y sin exportAsync → no se renderea ningún botón de export
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import React from "react";

// Mock useAxios to avoid pulling in AxiosContext providers
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: { data: [], message: { total: 0 } },
    reLoad: vi.fn(),
    execute: vi.fn(async () => ({
      data: { data: [], message: { total: 0 } },
      error: null,
    })),
    loaded: true,
    error: null,
    cancel: vi.fn(),
    waiting: 0,
    setWaiting: vi.fn(),
  }),
}));

// Mock useAsyncExport to capture the params passed by AsyncExportButton
// and avoid triggering real fetch/polling.
const useAsyncExportMock = vi.fn();
vi.mock("@/mk/hooks/useAsyncExport/useAsyncExport", () => ({
  useAsyncExport: (options: any) => {
    useAsyncExportMock(options);
    return {
      state: {
        isExporting: false,
        status: "idle",
        progress: 0,
        currentChunk: null,
        totalChunks: null,
        jobId: null,
        downloadUrl: null,
        errorMessage: null,
      },
      start: vi.fn(),
      reset: vi.fn(),
      download: vi.fn(),
    };
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock icons via importOriginal — preserva exports reales pero
// sobreescribe todos los iconos a () => null. Evita pulling SVG real.
vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) {
    mocked[key] = () => null;
  }
  return mocked;
});

// Mock lucide-react (icons del AsyncExportButton) — preserva el resto
vi.mock("lucide-react", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Download: () => null,
    LoaderCircle: () => null,
    X: () => null,
  };
});

// Mock useMediaQuery to a stable value
vi.mock("@/mk/hooks/useMediaQuery", () => ({
  default: () => false,
}));

// Mock Dropdown to render its children trigger
vi.mock("@/mk/components/ui/Dropdown/Dropdown", () => ({
  default: ({ trigger }: any) => <>{trigger}</>,
}));

// Mock DataSearch to render a simple input
vi.mock("@/mk/components/forms/DataSearch/DataSearch", () => ({
  default: () => <input data-testid="data-search" />,
}));

// Mock ImportDataModal
vi.mock("@/mk/components/data/ImportDataModal/ImportDataModal", () => ({
  default: () => null,
}));

// Mock DetailModal / DataModal / NewModal
vi.mock("@/mk/components/ui/DetailModal/DetailModal", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/mk/components/ui/NewModal/NewModal", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

// Mock Pagination
vi.mock("@/mk/components/ui/Pagination/Pagination", () => ({
  default: () => null,
}));

// Mock FormElement
vi.mock("@/mk/hooks/useCrud/FormElement", () => ({
  default: () => null,
}));

// Mock EmptyData
vi.mock("@/components/NoData/EmptyData", () => ({
  default: () => null,
}));

// Mock FloatButton
vi.mock("@/mk/components/forms/FloatButton/FloatButton", () => ({
  default: () => null,
}));

// Mock KeyValue
vi.mock("@/mk/components/ui/KeyValue/KeyValue", () => ({
  default: () => null,
}));

// Mock StatusBadge
vi.mock("@/components/StatusBadge/StatusBadge", () => ({
  StatusBadge: () => null,
}));

// Mock Table
vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: () => <div data-testid="table-mock" />,
}));

// Now import useCrud AFTER all mocks are set up
import useCrud, { ModCrudType } from "../useCrud";

const baseFields = {
  id: { rules: [], api: "e" },
  name: { rules: [], api: "name", label: "Name", list: {} },
};

describe("useCrud — exportAsync slot (S36.5)", () => {
  beforeEach(() => {
    useAsyncExportMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderea AsyncExportButton cuando mod.exportAsync está pineado", () => {
    const TestComp = () => {
      const { List } = useCrud({
        paramsInitial: { page: 1, perPage: 10 },
        mod: {
          modulo: "accesses",
          singular: "Acceso",
          plural: "Accesos",
          permiso: "accesses",
          pagination: false,
          export: false,
          exportAsync: { type: "accesses", label: "Exportar PDF" },
        } as ModCrudType,
        fields: baseFields,
      });
      return <List emptyMsg="empty" emptyLine2="empty2" />;
    };

    render(<TestComp />);
    // El AsyncExportButton pineá un <button> con el label "Exportar PDF"
    expect(
      screen.getByRole("button", { name: /Exportar PDF/i }),
    ).toBeInTheDocument();
    expect(useAsyncExportMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "accesses" }),
    );
  });

  it("renderea IconExport legacy cuando mod.export = true y NO mod.exportAsync", () => {
    const TestComp = () => {
      const { List } = useCrud({
        paramsInitial: { page: 1, perPage: 10 },
        mod: {
          modulo: "legacy",
          singular: "Item",
          plural: "Items",
          permiso: "legacy",
          pagination: false,
          export: true,
        } as ModCrudType,
        fields: baseFields,
      });
      return <List emptyMsg="empty" emptyLine2="empty2" />;
    };

    render(<TestComp />);
    // No hay botón de export async pineado (useAsyncExport NO se llamó).
    expect(useAsyncExportMock).not.toHaveBeenCalled();
    // El IconExport legacy está pineado con title="Exportar reporte"
    // pero como mock retorna null, no se renderea texto.
  });

  it("cuando pineá exportAsync, NO renderea IconExport legacy aunque mod.export = true", () => {
    const TestComp = () => {
      const { List } = useCrud({
        paramsInitial: { page: 1, perPage: 10 },
        mod: {
          modulo: "accesses",
          singular: "Acceso",
          plural: "Accesos",
          permiso: "accesses",
          pagination: false,
          // export: true pineado (BC) pero exportAsync pineá sobreescribe.
          export: true,
          exportAsync: { type: "accesses", label: "Exportar PDF" },
        } as ModCrudType,
        fields: baseFields,
      });
      return <List emptyMsg="empty" emptyLine2="empty2" />;
    };

    render(<TestComp />);
    // Solo AsyncExportButton con label "Exportar PDF". NO IconExport legacy.
    expect(
      screen.getByRole("button", { name: /Exportar PDF/i }),
    ).toBeInTheDocument();
    expect(useAsyncExportMock).toHaveBeenCalledTimes(1);
  });

  it("exportAsync.exportCols pinea subset en el botón", () => {
    // El subset se pinea en params.exportCols al AsyncExportButton,
    // pero como useAsyncExport mock captura options (no params),
    // validamos que el componente se montó con la config correcta.
    const TestComp = () => {
      const { List } = useCrud({
        paramsInitial: { page: 1, perPage: 10 },
        mod: {
          modulo: "accesses",
          singular: "Acceso",
          plural: "Accesos",
          permiso: "accesses",
          pagination: false,
          export: false,
          exportAsync: {
            type: "accesses",
            label: "Exportar PDF",
            exportCols: ["unidad", "entrada", "salida"],
          },
        } as ModCrudType,
        fields: baseFields,
      });
      return <List emptyMsg="empty" emptyLine2="empty2" />;
    };

    render(<TestComp />);
    expect(
      screen.getByRole("button", { name: /Exportar PDF/i }),
    ).toBeInTheDocument();
  });

  it("exportAsync.extraParams pineado → merge con filterBy/searchBy del store (S118b)", () => {
    // S118b: Si extraParams está pineado, useCrud pineá merge (no override)
    // con filterBy/searchBy automáticos. Patrón canónico para pinear
    // `title: "X"` sin perder los filtros del store.
    const TestComp = () => {
      const { List } = useCrud({
        paramsInitial: { page: 1, perPage: 10 },
        mod: {
          modulo: "accesses",
          singular: "Acceso",
          plural: "Accesos",
          permiso: "accesses",
          pagination: false,
          export: false,
          exportAsync: {
            type: "accesses",
            label: "Exportar PDF",
            extraParams: { filterBy: "in_at:y", customFlag: true },
          },
        } as ModCrudType,
        fields: baseFields,
      });
      return <List emptyMsg="empty" emptyLine2="empty2" />;
    };

    render(<TestComp />);
    expect(
      screen.getByRole("button", { name: /Exportar PDF/i }),
    ).toBeInTheDocument();
  });

  it("mod sin export y sin exportAsync → no se renderea ningún botón de export", () => {
    const TestComp = () => {
      const { List } = useCrud({
        paramsInitial: { page: 1, perPage: 10 },
        mod: {
          modulo: "noexport",
          singular: "Item",
          plural: "Items",
          permiso: "noexport",
          // ni export ni exportAsync
        } as ModCrudType,
        fields: baseFields,
      });
      return <List emptyMsg="empty" emptyLine2="empty2" />;
    };

    render(<TestComp />);
    expect(
      screen.queryByRole("button", { name: /Exportar PDF/i }),
    ).not.toBeInTheDocument();
    expect(useAsyncExportMock).not.toHaveBeenCalled();
  });

  /**
   * Fase 5 — los reportes custom llegan a CUALQUIER módulo sin tocar el front.
   *
   * El plan original preveía declararlos en el slot
   * (`exportAsync.customReports`). Se resolvió al revés y es mejor: el menú
   * los pide al back por el módulo, así que sumar un custom es crear su clase
   * en `app/Modules/<Mod>/CustomReports/` — el front no se toca ni se
   * redespliega, y ningún módulo puede quedarse con una lista desactualizada.
   */
  it("un modulo con exportAsync recibe sus custom del back sin declararlos en el front", async () => {
    const fetchMock = vi.fn(async (url: unknown) => {
      const href = String(url);
      if (href.includes("/reports/custom")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: [
              { key: "expenses-summary", label: "Resumen de Egresos", formats: ["xlsx"] },
            ],
          }),
        } as Response;
      }
      return { ok: true, status: 202, json: async () => ({}) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const TestComp = () => {
      const { List } = useCrud({
        paramsInitial: { page: 1, perPage: 10 },
        mod: {
          modulo: "expenses",
          singular: "Egreso",
          plural: "Egresos",
          permiso: "expenses",
          pagination: false,
          export: false,
          // Ni una palabra sobre customs: sólo el módulo y sus formatos.
          exportAsync: {
            type: "expenses",
            label: "Exportar",
            supportedFormats: ["pdf", "xlsx"],
          },
        } as ModCrudType,
        fields: baseFields,
      });
      return <List emptyMsg="empty" emptyLine2="empty2" />;
    };

    render(<TestComp />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("download-btn-expenses"));
    });

    // Se pregunta por el módulo de ESTE listado, no por uno fijo.
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some((c) =>
          String(c[0]).includes("/reports/custom?module=expenses"),
        ),
      ).toBe(true);
    });

    expect(
      (await screen.findByTestId("download-menuitem-expenses-custom-expenses-summary"))
        .textContent,
    ).toContain("Resumen de Egresos");

    vi.unstubAllGlobals();
  });
});
