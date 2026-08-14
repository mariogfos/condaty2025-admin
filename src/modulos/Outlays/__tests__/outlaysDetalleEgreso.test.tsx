/**
 * CDT-39 — Detalle de un egreso y modal de anular.
 *
 * Lo que reportó el tester: pantalla negra al entrar al informe de pago. Sin
 * `mod.renderView`, `useCrud` caía a su Detail genérico, que mete `item[key]`
 * crudo adentro de `KeyValue`. El campo `user` ("Responsable") viene como OBJETO
 * en `fullType=DET`, React tiraba "Objects are not valid as a React child" al
 * montar el modal y se desmontaba el árbol ENTERO: de ahí el negro y el "deja de
 * responder".
 *
 * Igual que en CDT-37, se entra por el `mod` y no por un import directo: la
 * causa raíz fue una clave perdida en la mudanza a la factory, así que un test
 * que importe el componente derecho queda verde con el bug puesto.
 *
 * El detalle y el modal de anular llevaban 23 días sin ejecutarse, y en el medio
 * `expenses.status` pasó a enum numérico. Por eso acá no alcanza con que monte:
 * se afirma el TEXTO del estado, que es donde estaba el segundo defecto.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOutlaysMod } from "../config/outlaysMod";
import { ExpenseStatus, PaymentMethod } from "@/modulos/Payments/Type/PaymentType";

const mockExecute = vi.fn();
const mockShowToast = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: mockExecute }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 1 }, showToast: mockShowToast }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children, onSave, buttonText, title }: any) =>
    open ? (
      <div>
        <h1>{title}</h1>
        {children}
        {buttonText ? (
          <button type="button" onClick={onSave}>
            {buttonText}
          </button>
        ) : null}
      </div>
    ) : null,
}));

/** Un egreso tal como lo devuelve `ExpenseController` en `fullType=DET`. */
const buildEgreso = (overrides: Record<string, any> = {}) => ({
  id: 12,
  amount: 350,
  date_at: "2026-07-15 10:00:00",
  status: ExpenseStatus.ACTIVE,
  type: PaymentMethod.CASH,
  description: "Factura de luz de julio",
  // 🔴 El back manda la relación EXPANDIDA. Éste es exactamente el tipo de
  // valor que hacía explotar al Detail genérico.
  user: { id: "u-1", name: "Mario", last_name: "Guzmán" },
  category: {
    id: 11,
    name: "Luz",
    category_id: 1,
    padre: { id: 1, name: "Servicios básicos" },
  },
  url_file: [],
  ...overrides,
});

const renderDetalle = (item: any, onDel = vi.fn()) => {
  const mod = getOutlaysMod();

  // 🔴 Sin esta clave se renderea el Detail genérico: pantalla negra.
  expect(mod.renderView).toBeDefined();

  const View = mod.renderView as React.FC<any>;
  render(<View open onClose={vi.fn()} item={item} extraData={{}} onDel={onDel} />);
  return { onDel };
};

describe("CDT-39 — detalle del egreso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra datos reales: responsable, categoría y subcategoría", () => {
    renderDetalle(buildEgreso());

    expect(screen.getByText("Servicios básicos")).toBeInTheDocument();
    expect(screen.getByText("Luz")).toBeInTheDocument();
    expect(screen.getByText("Mario Guzmán")).toBeInTheDocument();
  });

  /**
   * 🔴 Segundo defecto, tapado por el primero: el mapa de estados seguía
   * keyeado por los chars legacy 'A'/'X'. Con `status` numérico ninguna key
   * matcheaba y el `|| status` devolvía el número crudo, así que la fila
   * "Estado" mostraba "1". No se veía porque el archivo no se renderizaba.
   */
  it.each([
    [ExpenseStatus.ACTIVE, "Pagado", "1"],
    [ExpenseStatus.CANCELLED, "Anulado", "0"],
  ])(
    "traduce el estado numérico %i a '%s' y no lo muestra crudo",
    (status, etiqueta, crudo) => {
      renderDetalle(buildEgreso({ status, canceled_obs: "Duplicado" }));

      expect(screen.getByText(etiqueta)).toBeInTheDocument();
      expect(screen.queryByText(crudo)).toBeNull();
    },
  );

  it("ofrece anular un egreso activo", () => {
    renderDetalle(buildEgreso({ status: ExpenseStatus.ACTIVE }));
    expect(
      screen.getByRole("button", { name: "Anular egreso" }),
    ).toBeInTheDocument();
  });

  it("no ofrece anular un egreso que ya está anulado", () => {
    renderDetalle(
      buildEgreso({ status: ExpenseStatus.CANCELLED, canceled_obs: "Duplicado" }),
    );
    expect(screen.queryByRole("button", { name: "Anular egreso" })).toBeNull();
  });
});

describe("CDT-39 — modal de anular", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exige el motivo antes de anular", () => {
    const mod = getOutlaysMod();
    expect(mod.renderDel).toBeDefined();

    const Del = mod.renderDel as React.FC<any>;
    render(
      <Del
        open
        onClose={vi.fn()}
        item={buildEgreso()}
        onSave={vi.fn()}
        execute={mockExecute}
        reLoad={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Anular egreso" }));

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("anula con el motivo, contra el endpoint del egreso", async () => {
    mockExecute.mockResolvedValue({ data: { success: true } });

    const mod = getOutlaysMod();
    const Del = mod.renderDel as React.FC<any>;
    const reLoad = vi.fn();
    render(
      <Del
        open
        onClose={vi.fn()}
        item={buildEgreso()}
        onSave={vi.fn()}
        execute={mockExecute}
        reLoad={reLoad}
      />,
    );

    fireEvent.change(
      document.getElementById("canceled_obs") as HTMLTextAreaElement,
      { target: { name: "canceled_obs", value: "Cargado dos veces" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Anular egreso" }));

    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1));
    expect(mockExecute).toHaveBeenCalledWith(
      "/v3/expenses/12",
      "DELETE",
      expect.objectContaining({ id: 12, canceled_obs: "Cargado dos veces" }),
    );
    await waitFor(() => expect(reLoad).toHaveBeenCalled());
  });
});
