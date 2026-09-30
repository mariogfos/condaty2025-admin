/**
 * La pestaña de la Directiva se abre con `aprovebudgets`, la habilidad que los
 * directores tienen.
 *
 * ## 🔴 Por qué existe
 *
 * `useCrud` no pide el listado sin la R de `mod.permiso` (admin#931). La
 * pestaña declaraba `permiso: "budgets"`, y los 2 vínculos de Directiva de la
 * copia de producción tienen `aprovebudgets:CRUD` sin ningún `budgets`: se
 * quedaban con la lista vacía, y `onView` —la única puerta al modal que aprueba—
 * ya les decía «No tiene permisos para visualizar».
 */
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

let abilities: string[] = [];
// Como el `userCan` real: por prefijo `modulo:` y la letra adentro.
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

// La tabla pinta el nombre de cada fila como un botón que dispara `onRowClick`.
vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: ({ data, onRowClick }: any) => (
    <div>
      {(data || []).map((row: any) => (
        <button key={row.id} onClick={() => onRowClick?.(row)}>
          {row.name}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, title, children }: any) =>
    open ? (
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({ Avatar: () => null }));
vi.mock("@/mk/hooks/useMediaQuery", () => ({ default: () => false }));
vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) mocked[key] = () => null;
  return mocked;
});

import BudgetDir from "../BudgetDir";

const PENDIENTE = {
  id: 42,
  name: "Pintura de fachada",
  amount: 1500,
  status: "P",
  period: "M",
  type: "F",
  user: { name: "Ana", last_name: "Pérez" },
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("la pestaña de la Directiva", () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue({
      data: { success: true, data: [PENDIENTE], message: { total: 1 } },
      error: null,
    });
  });

  afterEach(() => cleanup());

  it("un ADM con aprovebudgets:R y sin budgets pide la lista, la ve y abre el detalle", async () => {
    abilities = ["home:R", "aprovebudgets:R"];
    render(<BudgetDir />);

    await waitFor(() =>
      expect(execute).toHaveBeenCalledWith(
        "/v3/budgets",
        "GET",
        expect.objectContaining({ fullType: "P" }),
        false,
        expect.anything(),
      ),
    );
    const fila = await screen.findByText("Pintura de fachada");

    // Desde acá es el único lugar donde el director revisa y aprueba.
    fireEvent.click(fila);
    expect(
      await screen.findByText("Detalle del presupuesto"),
    ).toBeInTheDocument();
  });

  it("un ADM sin aprovebudgets (aunque tenga budgets:R) no pide nada", async () => {
    abilities = ["home:R", "budgets:CRUD"];
    render(<BudgetDir />);
    await flush();

    expect(execute).not.toHaveBeenCalled();
    expect(screen.queryByText("Pintura de fachada")).toBeNull();
  });

  it("un ADM sin ninguna de las dos no pide nada", async () => {
    abilities = ["home:R"];
    render(<BudgetDir />);
    await flush();

    expect(execute).not.toHaveBeenCalled();
  });
});
