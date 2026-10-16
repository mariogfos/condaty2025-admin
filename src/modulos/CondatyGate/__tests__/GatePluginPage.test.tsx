import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GatePluginPage from "../GatePluginPage";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), showToast: vi.fn(), user: { client_id: "client-a", fosrole_id: "fos" }, status: null as { configured: boolean; enabled: boolean; connection: null; error?: string } | null }));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ user: mocks.user, showToast: mocks.showToast }) }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute: mocks.execute }) }));
vi.mock("../useGateStatus", () => ({ useGateStatus: () => mocks.status, GATE_STATUS_EVENT: "condaty-gate-status" }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ open, children, onSave, buttonText }: { open: boolean; children: ReactNode; onSave: () => void; buttonText: string }) => open ? <section role="dialog">{children}<button onClick={onSave}>{buttonText}</button></section> : null }));
vi.mock("@/components/layout/NotAccess/NotAccess", () => ({ default: () => <p>Sin acceso</p> }));

beforeEach(() => {
  mocks.execute.mockReset(); mocks.showToast.mockReset();
  mocks.user = { client_id: "client-a", fosrole_id: "fos" };
  mocks.status = { configured: true, enabled: false, connection: null };
});

describe("Gate installation", () => {
  it("keeps the loading state distinct from missing server configuration", () => {
    mocks.status = null;
    render(<GatePluginPage view="detail" />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando integración");
    expect(screen.queryByText(/necesita ser configurado/)).not.toBeInTheDocument();
  });

  it("does not present a failed status request as an available installation", () => {
    mocks.status = { configured: false, enabled: false, connection: null, error: "No pudimos consultar el estado" };
    render(<GatePluginPage view="detail" />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos consultar el estado");
    expect(screen.queryByLabelText("Condominio en NewCondaty")).not.toBeInTheDocument();
  });

  it("ignores a late installation result after switching condominium", async () => {
    let complete: (value: unknown) => void = () => {};
    mocks.execute.mockImplementation((url: string) => {
      if (url === "/gate-plugin/install") return new Promise(resolve => { complete = resolve; });
      if (url === "/gate-plugin/preview") return Promise.resolve({ data: { success: true, data: { preview: { preview_id: "preview-a", condominium: { name: "Prueba" }, requires_replacement: false, incoming_units: 1, incoming_people: 1, warnings: [] } } } });
      return Promise.resolve({ data: { success: true, data: [{ id: "target-a", name: "Prueba", handle: "prueba", connected: false }] } });
    });
    const view = render(<GatePluginPage view="detail" />);
    await screen.findByRole("option", { name: "Prueba · @prueba" });
    fireEvent.change(screen.getByLabelText("Condominio en NewCondaty"), { target: { value: "target-a" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Instalar y sincronizar" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith("/gate-plugin/install", "POST", expect.anything(), false, false));
    mocks.user = { client_id: "client-b", fosrole_id: "fos" };
    view.rerender(<GatePluginPage view="detail" />);
    await act(async () => { complete({ data: { success: true, data: {} } }); });
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
