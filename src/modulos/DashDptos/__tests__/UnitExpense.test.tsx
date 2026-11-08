import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UnitExpense from "../UnitInfo/UnitExpense";

type Expense = {
  amount_usd: string;
  amount_bob: string;
  rate: { value: string; date: string };
  can_edit: boolean;
  version: string;
};

const mocks = vi.hoisted(() => ({
  result: null as Expense | null,
  execute: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("@/mk/hooks/useAxios", async () => {
  const { useState } = await import("react");
  return {
    default: function useAxiosMock() {
      const [data, setData] = useState({ data: mocks.result });
      return {
        data,
        execute: async (...args: unknown[]) => {
          const response = await mocks.execute(...args);
          if (args[3] && response.data) setData(response.data);
          return response;
        },
      };
    },
  };
});

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: mocks.showToast }),
}));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, onSave, disabled }: { children: ReactNode; onSave: () => void; disabled: boolean }) => (
    <div role="dialog">
      {children}
      <button disabled={disabled} onClick={onSave}>Guardar</button>
    </div>
  ),
}));

describe("cuota de expensa en el detalle de la unidad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.result = {
      amount_usd: "100.00000000", amount_bob: "696.00", rate: { value: "6.96", date: "2026-11-07" },
      can_edit: true, version: "initial",
    };
  });

  it("muestra bolivianos cuando el condominio cobra en BOB", () => {
    mocks.result = null;
    render(<UnitExpense unitId={7} amountBob="696.00" />);
    expect(screen.getByText("Bs 696.00")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar cuota USD" })).not.toBeInTheDocument();
  });

  it("muestra las dos monedas y respeta el permiso de lectura", () => {
    mocks.result!.can_edit = false;
    render(<UnitExpense unitId={7} amountBob="696.00" />);
    expect(screen.getByText("USD 100.00")).toBeInTheDocument();
    expect(screen.getByText("Equivalente: Bs 696.00")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar cuota USD" })).not.toBeInTheDocument();
  });

  it("guarda la cuota para futuras emisiones y muestra la respuesta del servidor", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true, data: {
      ...mocks.result, amount_usd: "105.00", amount_bob: "730.80", version: "saved",
    } } });
    render(<UnitExpense unitId={7} amountBob="696.00" />);
    fireEvent.click(screen.getByRole("button", { name: "Editar cuota USD" }));
    fireEvent.change(screen.getByLabelText("Cuota de expensa (USD)"), { target: { value: "105.00" } });
    fireEvent.change(screen.getByLabelText("Motivo del cambio"), { target: { value: "Cuota acordada" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith("/finance/usd/units/7/expense", "PUT", {
      amount: "105.00", reason: "Cuota acordada", version: "initial",
    }, true, true));
    expect(await screen.findByText("USD 105.00")).toBeInTheDocument();
    expect(screen.getByText("Equivalente: Bs 730.80")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
