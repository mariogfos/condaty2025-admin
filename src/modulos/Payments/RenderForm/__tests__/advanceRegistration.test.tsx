import { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm";

const mocks = vi.hoisted(() => ({ draft: {} as any }));
vi.mock("@/features/advance-payments/AdvancePaymentFields", () => ({ default: function FieldsMock({ onChange }: any) {
  useEffect(() => { onChange(mocks.draft); }, [onChange]);
  return <div>Períodos y descuentos</div>;
} }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ children, onSave, buttonText, disabled }: any) =>
  <div role="dialog">{children}<button disabled={disabled} onClick={onSave}>{buttonText}</button></div> }));
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

describe("Confirmación desde el formulario de ingresos", () => {
  beforeEach(() => {
    execute.mockReset(); onClose.mockReset(); reLoad.mockReset(); toast.mockReset();
    execute.mockResolvedValue({ data: { success: true, data: { deudas: [] } } });
    mocks.draft = {
      ready: true, operation: true, reason: "Anticipo autorizado", requestKey: "intent-1",
      payload: { unit_id: 1, type: "E", selected: ["period:2026-12"], discount: { mode: "latest", type: "fixed", value: 600 } },
      preview: { version: "version-1", original: 120000, discount: 60000, net: 60000,
        items: [{ debt_id: null, key: "period:2026-12", net: 60000 }] },
    };
  });
  it("envía el grupo, la versión y el mismo intento una sola vez aunque se pulse dos veces", async () => {
    let resolve!: (response: any) => void;
    execute.mockImplementation(async (_url: string, method: string) => method === "POST"
      ? new Promise(r => { resolve = r; }) : { data: { success: true, data: { deudas: [] } } });
    mount();
    const button = await screen.findByRole("button", { name: "Crear ingreso" });
    await waitFor(() => expect(button).toBeEnabled());
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
    const button = await screen.findByRole("button", { name: "Aplicar descuentos" });
    await waitFor(() => expect(button).toBeEnabled());
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
    const button = await screen.findByRole("button", { name: "Crear ingreso" });
    await waitFor(() => expect(button).toBeEnabled()); fireEvent.click(button);
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(execute.mock.calls.find(call => call[1] === "POST")?.slice(0, 3)).toMatchObject([
      "/payments-v2/full", "POST", { asignados: [{ id: 15 }], amount: 1200 },
    ]);
  });
});
