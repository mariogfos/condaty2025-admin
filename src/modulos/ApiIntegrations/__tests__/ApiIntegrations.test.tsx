import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiIntegrations from "../ApiIntegrations";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), setStore: vi.fn(), fos: true, write: true }));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ user: { fosrole_id: mocks.fos ? "fos" : null },
  userCan: (_module: string, action: string) => action === "R" || mocks.write, setStore: mocks.setStore }) }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute: mocks.execute }) }));
vi.mock("@/components/auth/NotAccess/NotAccess", () => ({ default: () => <p>Sin acceso</p> }));
vi.mock("@/mk/components/ui/TabsButton/TabsButtons", () => ({ default: ({ tabs, sel, setSel }: any) => <div>
  {tabs.map((tab: any) => <button key={tab.value} aria-pressed={sel === tab.value} onClick={() => setSel(tab.value)}>{tab.text}</button>)}</div> }));
vi.mock("@/mk/components/forms/Button/Button", () => ({ default: ({ children, onClick, disabled }: any) => <button disabled={disabled} onClick={onClick}>{children}</button> }));
vi.mock("@/mk/components/forms/DataSearch/DataSearch", () => ({ default: ({ name, value, setSearch }: any) => <input aria-label={name} value={value} onChange={(e) => setSearch(e.target.value)} /> }));
vi.mock("@/mk/components/forms/Input/Input", () => ({ default: ({ name, label, value, onChange, disabled, type }: any) => <label>{label}<input name={name} aria-label={name} value={value} onChange={onChange} disabled={disabled} type={type} /></label> }));
vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({ default: ({ name, label, value, onChange, disabled }: any) => <label>{label}<textarea name={name} aria-label={name} value={value} onChange={onChange} disabled={disabled} /></label> }));
vi.mock("@/mk/components/forms/Select/Select", () => ({ default: ({ name, value, options, onChange, disabled }: any) => <select name={name} aria-label={name} value={value} onChange={onChange} disabled={disabled}>
  <option value="">Seleccionar</option>{options.map((item: any, i: number) => <option key={item.id + i} value={item.id}>{item.name}</option>)}</select> }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ open, title, children, onSave, buttonText, onClose, disabled }: any) => open ? <div role="dialog" aria-label={title}>
  {children}{buttonText ? <button disabled={disabled} onClick={onSave}>{buttonText}</button> : null}<button onClick={onClose}>Cerrar modal</button></div> : null }));
vi.mock("@/mk/components/ui/Table/Table", () => ({ default: ({ data, header }: any) => <table><tbody>{data.map((row: any) => <tr key={row.id}>{header.map((column: any) =>
  <td key={column.key}>{column.onRender ? column.onRender({ item: row, value: row[column.key] }) : String(row[column.key] ?? "")}</td>)}</tr>)}</tbody></table> }));
vi.mock("@/mk/components/ui/Pagination/Pagination", () => ({ default: ({ currentPage, onPageChange }: any) => <button onClick={() => onPageChange(currentPage + 1)}>Siguiente página</button> }));

const connection = { id: "integration-1", client_id: "client-1", name: "Sistema QA", scopes: ["units:read"], is_active: true,
  expires_at: null, token_hint: "abc123", version: "v1", webhook_url: null, webhook_status: null };
const log = { id: "trace-1", integration_id: "integration-1", integration_name: "Sistema QA", client_id: "client-1",
  method: "GET", path: "/api/integrations/v1/debts", status: 200, duration_ms: 32, created_at: "2026-10-20T12:00:00Z", replayed: false };
const page = (items: any[]) => ({ data: { success: true, data: { items, pagination: { page: 1, last_page: 2, total: items.length } } } });

beforeEach(() => {
  mocks.fos = true; mocks.write = true; mocks.execute.mockReset(); mocks.setStore.mockReset();
  mocks.execute.mockImplementation(async (url: string, method: string) => {
    if (url.endsWith("/catalogs")) return { data: { success: true, data: { clients: [{ id: "client-1", name: "Condominio QA" }],
      integrations: [{ id: "integration-1", name: "Sistema QA", client_id: "client-1" }], scopes: ["units:read", "payments:create"], notice: "Datos sensibles ocultos." } } };
    if (url.endsWith("/logs/trace-1")) return { data: { success: true, data: { ...log, query: { type: "expense" }, payload: {}, response: { success: true, data: { amount: "150.00", ci: "[oculto]" } } } } };
    if (url.endsWith("/logs")) return page([log]);
    if (url.endsWith("/events")) return page([]);
    if (url.endsWith("/automations")) return { data: { success: true, data: { settings: { auto_expenses: true, auto_penalties: true, auto_maintenance: true, auto_delinquency: true }, version: "auto-v1" } } };
    if (method === "POST") return { data: { success: true, data: { integration: connection, credential: "qa-only-credential" } } };
    return page([connection]);
  });
});

describe("Integraciones API de Backoffice", () => {
  it("sólo permite acceso FOS y no consulta datos de un administrador normal", () => {
    mocks.fos = false; render(<ApiIntegrations />);
    expect(screen.getByText("Sin acceso")).toBeInTheDocument();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("reutiliza las secciones y carga el detalle sanitizado sólo al abrir una llamada", async () => {
    render(<ApiIntegrations />);
    await screen.findByText("Sistema QA");
    expect(screen.getByRole("button", { name: "Nueva integración" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actividad API" }));
    await screen.findByText(log.path);
    expect(mocks.execute).not.toHaveBeenCalledWith(expect.stringContaining("/logs/trace-1"), expect.anything(), expect.anything(), expect.anything(), expect.anything());
    fireEvent.click(screen.getByRole("button", { name: "Ver llamada trace-1" }));
    const dialog = await screen.findByRole("dialog", { name: "Detalle de llamada API" });
    await waitFor(() => expect(within(dialog).getByText(/150.00/)).toBeInTheDocument());
    expect(within(dialog).getByRole("heading", { name: "Filtros y parámetros" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Payload enviado" })).toBeInTheDocument();
    expect(within(dialog).getByText(/\[oculto\]/)).toBeInTheDocument();
  });

  it("reinicia página al filtrar y envía filtros de condominio y endpoint", async () => {
    render(<ApiIntegrations />); await screen.findByText("Sistema QA");
    fireEvent.click(screen.getByRole("button", { name: "Actividad API" })); await screen.findByText(log.path);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente página" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith("/backoffice/integrations/logs", "GET", expect.objectContaining({ page: 2 }), false, true));
    fireEvent.change(screen.getByLabelText("client_id"), { target: { value: "client-1" } });
    fireEvent.change(screen.getByLabelText("integration-search"), { target: { value: "debts" } });
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith("/backoffice/integrations/logs", "GET", expect.objectContaining({ client_id: "client-1", query: "debts", page: 1 }), false, true));
  });

  it("no ofrece acciones de escritura con permisos de sólo lectura", async () => {
    mocks.write = false; render(<ApiIntegrations />); await screen.findByText("Sistema QA");
    expect(screen.queryByRole("button", { name: "Nueva integración" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Sistema QA" })).not.toBeInTheDocument();
  });

  it("bloquea envíos duplicados y muestra la credencial una sola vez sin guardarla en localStorage", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    render(<ApiIntegrations />); await screen.findByText("Sistema QA");
    fireEvent.click(screen.getByRole("button", { name: "Nueva integración" }));
    const dialog = screen.getByRole("dialog", { name: "Nueva integración" });
    fireEvent.change(within(dialog).getByLabelText("name"), { target: { value: "Nueva conexión" } });
    fireEvent.change(within(dialog).getByLabelText("client_id"), { target: { value: "client-1" } });
    const save = within(dialog).getByRole("button", { name: "Crear integración" });
    fireEvent.click(save); fireEvent.click(save);
    await screen.findByText("qa-only-credential");
    expect(mocks.execute.mock.calls.filter((call) => call[0] === "/backoffice/integrations" && call[1] === "POST")).toHaveLength(1);
    expect(storage).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog", { name: "Guarda la credencial" })).getByRole("button", { name: "Cerrar modal" }));
    expect(screen.queryByText("qa-only-credential")).not.toBeInTheDocument();
    storage.mockRestore();
  });

  it("muestra automatizaciones del condominio sin confundirlas con permisos de una credencial", async () => {
    render(<ApiIntegrations />); await screen.findByText("Sistema QA");
    fireEvent.click(screen.getByRole("button", { name: "Automatizaciones" }));
    expect(screen.getByText("Selecciona un condominio en el filtro superior.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("client_id"), { target: { value: "client-1" } });
    await screen.findByRole("checkbox", { name: "Generar expensas mensuales automáticamente" });
    expect(mocks.execute).toHaveBeenCalledWith("/backoffice/integrations/clients/client-1/automations", "GET", {}, false, true);
  });
});
