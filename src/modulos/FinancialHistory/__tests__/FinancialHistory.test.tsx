import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FinancialHistory from "../FinancialHistory";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: mocks.execute }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    userCan: () => true,
    showToast: mocks.showToast,
  }),
}));

vi.mock("@/mk/components/forms/Button/Button", () => ({
  default: ({ children, disabled, onClick }: any) => (
    <button disabled={disabled} onClick={onClick} type="button">{children}</button>
  ),
}));

vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: ({ data, header }: any) => (
    <table>
      <tbody>
        {data.map((item: any) => (
          <tr key={item.id}>
            {header.map((column: any) => (
              <td key={column.key}>
                {column.onRender
                  ? column.onRender({ item, value: item[column.key] })
                  : String(item[column.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe("Historial financiero", () => {
  beforeEach(() => {
    mocks.execute.mockReset();
    mocks.showToast.mockReset();
    mocks.execute.mockImplementation(async (url: string) => {
      if (url.endsWith("/clients")) {
        return { data: { success: true, data: [] } };
      }

      return {
        data: {
          success: true,
          data: {
            items: [{
              id: "event-1",
              type: "penalty_accrual",
              label: "Multa reconciliada automáticamente",
              client: "Hacienda del Urubó",
              record: { title: "Unidad H-17", subtitle: "Expensa agosto" },
              before: { status: "P", penalty_amount: 0 },
              after: { status: "I", penalty_amount: 17.4 },
              actor: { name: "Sistema de multas" },
              occurred_at: "2026-09-03T02:15:00-04:00",
            }],
            pagination: { page: 1, per_page: 25, total: 1, last_page: 1 },
            available_types: [
              { id: "all", label: "Todos los tipos" },
              { id: "penalty_accrual", label: "Multas y saldos por mora" },
            ],
            notice: "Historial inmutable.",
          },
        },
      };
    });
  });

  it("muestra el cambio de multa, estado y responsable del sistema", async () => {
    render(<FinancialHistory />);

    expect(await screen.findByText("Multa reconciliada automáticamente")).toBeInTheDocument();
    expect(screen.getByText("Sistema de multas")).toBeInTheDocument();
    expect(screen.getByText("Pagado")).toBeInTheDocument();
    expect(screen.getByText("Pago parcial")).toBeInTheDocument();
    expect(screen.getByText(/17,40/)).toBeInTheDocument();
  });
});
