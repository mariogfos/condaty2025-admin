import { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm";

const mocks = vi.hoisted(() => ({ draft: {} as any, unitId: 0 }));
// Direct navigation has no CRUD catalog store initialized by the Ingresos page.
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ store: null, userCan: () => true }) }));
vi.mock("@/features/advance-payments/AdvancePaymentFields", () => ({ default: function FieldsMock({ onChange, unitId }: any) {
  mocks.unitId = unitId;
  useEffect(() => { onChange(mocks.draft); }, [onChange]);
  return <div>Períodos y descuentos</div>;
} }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ children, onSave, buttonText, disabled, buttonExtra }: any) =>
  <div role="dialog">{children}{buttonText && <button disabled={disabled} onClick={onSave}>{buttonText}</button>}{buttonExtra}</div> }));
vi.mock("@/mk/components/forms/UploadFileV3/UploadFileV3", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/Toast/Toast", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/Select/Select", () => ({ default: ({ label, name, value, options, onChange, disabled }: any) =>
  <select aria-label={label} name={name} value={value} onChange={onChange} disabled={disabled}>
    <option value="">Elegir</option>{options.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
  </select> }));
vi.mock("@/mk/components/forms/Input/Input", () => ({ default: ({ label, value, onChange, disabled }: any) =>
  <input aria-label={label} value={value} onChange={onChange} disabled={disabled} /> }));
vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({ default: ({ label, value, onChange }: any) =>
  <textarea aria-label={label} value={value} onChange={onChange} /> }));

const execute = vi.fn(); const onClose = vi.fn(); const reLoad = vi.fn(); const toast = vi.fn();
const extra = { dptos: [{ id: 1, nro: "U-01", description: "Unidad" }], categories: [], bankAccounts: [], subcategories: [] };
function mount(method = "E") {
  render(<RenderForm open item={{ type: "E", dpto_id: "U-01", method, paid_at: "2026-11-17" }} extraData={extra as any}
    execute={execute} onClose={onClose} reLoad={reLoad} showToast={toast} />);
}

async function review() {
  const next = await screen.findByRole("button", { name: "Continuar" });
  await waitFor(() => expect(next).toBeEnabled());
  fireEvent.click(next);
  const confirm = screen.getByRole("button", { name: "Revisar ingreso" });
  await waitFor(() => expect(confirm).toBeEnabled());
  fireEvent.click(confirm);
}

describe("Confirmación desde el formulario de ingresos", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    execute.mockReset(); onClose.mockReset(); reLoad.mockReset(); toast.mockReset();
    execute.mockResolvedValue({ data: { success: true, data: { deudas: [] } } });
    mocks.draft = {
      ready: true, operation: true, reason: "Anticipo autorizado", requestKey: "intent-1",
      payload: { unit_id: 1, type: "E", selected: ["period:2026-12"], discount: { mode: "latest", type: "fixed", value: 600 } },
      preview: { version: "version-1", original: 120000, discount: 60000, net: 60000,
        items: [{ debt_id: null, key: "period:2026-12", gross: 120000, penalty: 0, maintenance: 0, fees: 0, net: 60000 }] },
    };
  });
  it("envía el grupo, la versión y el mismo intento una sola vez aunque se pulse dos veces", async () => {
    let resolve!: (response: any) => void;
    execute.mockImplementation(async (_url: string, method: string) => method === "POST"
      ? new Promise(r => { resolve = r; }) : { data: { success: true, data: { deudas: [] } } });
    mount();
    await review();
    const button = screen.getByRole("button", { name: "Registrar ingreso" });
    fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(execute.mock.calls.filter(call => call[1] === "POST")).toHaveLength(1));
    expect(execute.mock.calls.find(call => call[1] === "POST")?.slice(0, 3)).toMatchObject([
      "/advance-payments", "POST", { unit_id: 1, version: "version-1", request_key: "intent-1", method: "E" },
    ]);
    expect(screen.getByLabelText("Seleccionar Unidad")).toBeDisabled();
    resolve({ data: { success: true } });
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
  it("permite saldar por descuento sin pedir método ni generar un ingreso por cero", async () => {
    mocks.draft.preview.net = 0; mocks.draft.preview.items[0].net = 0;
    mount("");
    await review();
    const button = screen.getByRole("button", { name: "Aplicar descuentos" });
    fireEvent.click(button);
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(execute.mock.calls.find(call => call[1] === "POST")?.[2].method).toBeNull();
    expect(execute.mock.calls.some(call => call[0] === "/payments-v2/full")).toBe(false);
  });
  it("conserva la ruta normal para una deuda existente sin un descuento nuevo", async () => {
    mocks.draft.operation = false;
    mocks.draft.preview.items[0] = { debt_id: 15, key: "debt:15", net: 120000 };
    mocks.draft.preview.net = 120000;
    mount();
    await review();
    const button = screen.getByRole("button", { name: "Registrar ingreso" }); fireEvent.click(button);
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(execute.mock.calls.find(call => call[1] === "POST")?.slice(0, 3)).toMatchObject([
      "/payments-v2/full", "POST", { asignados: [{ id: 15 }], amount: 1200 },
    ]);
  });
  it("prioriza el número elegido si coincide con el ID de otra unidad", async () => {
    mocks.draft.payload.unit_id = 2;
    const units = [{ id: 1, nro: "Otra" }, { id: 2, nro: "1" }];
    render(<RenderForm open item={{ type: "E", dpto_id: "1", method: "E", paid_at: "2026-11-17" }}
      extraData={{ ...extra, dptos: units } as any} execute={execute} onClose={onClose} reLoad={reLoad} showToast={toast} />);
    await review();
    const button = screen.getByRole("button", { name: "Registrar ingreso" });
    expect(mocks.unitId).toBe(2);
    fireEvent.click(button);
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(execute.mock.calls.find(call => call[1] === "POST")?.[2].unit_id).toBe(2);
  });

  it("no guarda al navegar y conserva el respaldo al volver al primer paso", async () => {
    mount();
    expect(screen.getByRole("button", { name: /Revisar y confirmar/ })).toBeDisabled();
    const next = screen.getByRole("button", { name: "Continuar" });
    await waitFor(() => expect(next).toBeEnabled()); fireEvent.click(next);
    fireEvent.change(screen.getByLabelText("Número de respaldo de pago"), { target: { value: "ABC123" } });
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    expect(execute.mock.calls.some(call => call[1] === "POST")).toBe(false);
    await review();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(execute.mock.calls.find(call => call[1] === "POST")?.[2]).toMatchObject({ voucher: "ABC123", request_key: "intent-1" });
  });

  it("conserva el registro de pago directo y sus categorías fuera del flujo de anticipos", async () => {
    const directExtra = { ...extra, categories: [{ id: 10, name: "Otros ingresos", fixed: "N", hijos: [{ id: 20, name: "Servicios", fixed: "N" }] }], client_config: {} };
    render(<RenderForm open item={{ type: "I", dpto_id: "U-01", method: "E", paid_at: "2026-11-17", amount: 125 }}
      extraData={directExtra as any} execute={execute} onClose={onClose} reLoad={reLoad} showToast={toast} />);
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "10" } });
    await screen.findByRole("option", { name: "Servicios" });
    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "20" } });
    await review();
    fireEvent.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(execute.mock.calls.find(call => call[1] === "POST")?.slice(0, 3)).toMatchObject([
      "/payments", "POST", { type: "I", nro_id: 1, amount: 125, subcategory_id: "20" },
    ]);
    expect(execute.mock.calls.some(call => call[0] === "/advance-payments")).toBe(false);
  });

  it("mantiene el cobro de reservas y su cuenta congelada sin usar anticipos", async () => {
    const debt = { id: 99, type: 2, amount: 100, penalty_amount: 5, maintenance_amount: 0,
      status: "A", reservation: { area: { title: "Salón" } }, reservation_charge: { bank_account_id: 15 } };
    execute.mockResolvedValue({ data: { success: true, data: { deudas: [debt] } } });
    render(<RenderForm open item={{ type: "R", dpto_id: "U-01", method: "E", paid_at: "2026-11-17" }}
      extraData={extra as any} execute={execute} onClose={onClose} reLoad={reLoad} showToast={toast} />);
    fireEvent.click(await screen.findByRole("button", { name: "Seleccionar deuda 99" }));
    await review();
    fireEvent.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(execute.mock.calls.find(call => call[1] === "POST")?.slice(0, 3)).toMatchObject([
      "/payments-v2/full", "POST", { asignados: [{ id: 99 }], amount: 105, bank_account_id: 15 },
    ]);
    expect(execute.mock.calls.some(call => call[0] === "/advance-payments")).toBe(false);
  });
});
