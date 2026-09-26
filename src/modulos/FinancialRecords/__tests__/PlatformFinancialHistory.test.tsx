import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlatformFinancialHistory from "../PlatformFinancialHistory";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  showToast: vi.fn(),
  user: { fosrole_id: 1 } as { fosrole_id?: number } | null,
}));

vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute: mocks.execute }) }));
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mocks.user, setStore: vi.fn(), showToast: mocks.showToast }),
}));
vi.mock("@/components/auth/NotAccess/NotAccess", () => ({ default: () => <p>Sin acceso</p> }));
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
              <td key={column.key}>{column.onRender({ item, value: item[column.key] })}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

/** Lo que devuelve `v3/backoffice/financial-history` en `dev`: estados por NOMBRE. */
const payload = {
  items: [
    {
      id: "e-1",
      label: "Multa editada",
      client: "Hacienda del Urubó",
      record: { kind: "debt", title: "Unidad H-17", subtitle: "Expensa · Mes 8 2026" },
      before: { amount: 100, penalty_amount: 0, status: "PAID" },
      after: { amount: 100, penalty_amount: 17.4, status: "OVERDUE" },
      reason: "Multa por pago fuera de plazo",
      actor: { name: "Ana Rojas" },
      occurred_at: "2026-09-03T06:15:00.000000Z",
    },
    {
      id: "e-2",
      label: "Fecha de pago editada",
      client: "Hacienda del Urubó",
      record: { kind: "payment", title: "Ingreso ING-25", subtitle: "Bs 250.00" },
      before: { paid_at: "2026-09-20 21:00:00" },
      after: { paid_at: "2026-09-18 21:00:00" },
      reason: "El banco acreditó el 18",
      actor: { name: "FOS Finanzas" },
      occurred_at: "2026-09-22T14:00:00.000000Z",
    },
  ],
  pagination: { page: 1, per_page: 25, total: 2, last_page: 1 },
  notice: "Historial inmutable.",
};

describe("Historial financiero de la plataforma", () => {
  beforeEach(() => {
    mocks.user = { fosrole_id: 1 };
    mocks.execute.mockReset();
    mocks.showToast.mockReset();
    mocks.execute.mockImplementation(async (url: string) =>
      url.endsWith("/clients")
        ? { data: { success: true, data: [{ id: "c-2", name: "Las Palmas" }] } }
        : { data: { success: true, data: payload } },
    );
  });

  it("traduce los estados por nombre, muestra la fecha corregida y el motivo", async () => {
    render(<PlatformFinancialHistory />);

    expect(await screen.findByText("Multa editada")).toBeInTheDocument();
    expect(screen.getByText("Cobrada")).toBeInTheDocument();
    expect(screen.getByText("En mora")).toBeInTheDocument();
    expect(screen.getByText(/17,40/)).toBeInTheDocument();
    expect(screen.getByText("Motivo: Multa por pago fuera de plazo")).toBeInTheDocument();
    // Producción decía «Datos derivados sincronizados» para una corrección de fecha.
    expect(screen.getByText(/20 sept/)).toBeInTheDocument();
    expect(screen.getByText(/18 sept/)).toBeInTheDocument();
    expect(screen.getByText("FOS Finanzas")).toBeInTheDocument();
  });

  it("filtra por condominio contra el endpoint v3", async () => {
    render(<PlatformFinancialHistory />);
    await screen.findByText("Las Palmas");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "c-2" } });

    await waitFor(() =>
      expect(mocks.execute).toHaveBeenCalledWith(
        "/v3/backoffice/financial-history",
        "GET",
        { client_id: "c-2", page: 1, per_page: 25 },
        false,
        true,
      ),
    );
  });

  it("un administrador de condominio no la ve ni la pide", () => {
    mocks.user = { fosrole_id: 0 };
    render(<PlatformFinancialHistory />);

    expect(screen.getByText("Sin acceso")).toBeInTheDocument();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
