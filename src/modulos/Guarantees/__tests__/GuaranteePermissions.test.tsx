import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Guarantees from "../Guarantees";

const state = vi.hoisted(() => ({
  permissions: new Set<string>(),
  fosroleId: null as number | null,
  execute: vi.fn(),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "administrator", client_id: "condominium", fosrole_id: state.fosroleId },
    userCan: (module: string, action: string) => state.permissions.has(module + ":" + action),
    showToast: vi.fn(),
  }),
}));
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: state.execute }),
}));
vi.mock("@/components/layout/NotAccess/NotAccess", () => ({
  default: () => <p>Sin permiso financiero</p>,
}));
vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: ({ header, data }: { header: { key: string; onRender?: (value: unknown) => unknown }[]; data: unknown[] }) => (
    <div>{data.map((item, index) => <div key={index}>
      {header.find(column => column.key === "actions")?.onRender?.({ item }) as React.ReactNode}
    </div>)}</div>
  ),
}));
vi.mock("../GuaranteeDetail", () => ({
  default: ({ onRefund }: { onRefund?: () => void }) => (
    <section aria-label="Detalle de garantía">
      {onRefund && <button onClick={onRefund}>Registrar devolución</button>}
    </section>
  ),
}));
vi.mock("../GuaranteeMovementForm", () => ({
  default: ({ refund }: { refund?: unknown }) => <p>{refund ? "Formulario de devolución" : "Formulario de depósito"}</p>,
}));

describe("Permisos operativos de garantías", () => {
  beforeEach(() => {
    state.permissions = new Set(["payments:R"]);
    state.fosroleId = null;
    state.execute.mockReset().mockResolvedValue({ data: { success: true, data: {
      data: [{ id: 1, unit_id: 1, unit: "Casa 1", owner: "Titular", bank: "Custodia",
        balance_cents: 5000, committed_cents: 0, available_cents: 5000 }],
      total: 1, current_page: 1, last_page: 1,
    } } });
  });

  it("permite registrar depósitos a un administrador con creación de ingresos", async () => {
    state.permissions.add("payments:C");
    render(<Guarantees />);
    await screen.findByRole("button", { name: "Ver detalle" });
    fireEvent.click(screen.getByRole("button", { name: /Registrar depósito/ }));
    expect(screen.getByText("Formulario de depósito")).toBeInTheDocument();
  });

  it("permite devoluciones con edición de ingresos aunque no permita depósitos", async () => {
    state.permissions.add("payments:U");
    render(<Guarantees />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver detalle" }));
    expect(screen.queryByRole("button", { name: /Registrar depósito/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Registrar devolución" }));
    expect(screen.getByText("Formulario de devolución")).toBeInTheDocument();
  });

  it("mantiene la consulta sin acciones cuando sólo tiene lectura", async () => {
    render(<Guarantees />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver detalle" }));
    expect(screen.queryByRole("button", { name: /Registrar depósito/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar devolución" })).not.toBeInTheDocument();
  });

  it("crear depósitos no concede el permiso de devolver", async () => {
    state.permissions.add("payments:C");
    render(<Guarantees />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver detalle" }));
    expect(screen.getByRole("button", { name: /Registrar depósito/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar devolución" })).not.toBeInTheDocument();
  });

  it("ser FOS con configuración no sustituye los permisos financieros", () => {
    state.fosroleId = 1;
    state.permissions = new Set(["settings:R", "settings:U"]);
    render(<Guarantees />);
    expect(screen.getByText("Sin permiso financiero")).toBeInTheDocument();
    expect(state.execute).not.toHaveBeenCalled();
  });
});
