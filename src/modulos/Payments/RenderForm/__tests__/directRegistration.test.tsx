import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FullPaymentForm from "../RenderForm";
import PartialPaymentForm from "@/modulos/PartialPayments/RenderForm/RenderForm";

vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ store: {}, userCan: () => true }) }));
vi.mock("@/features/advance-payments/AdvancePaymentFields", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ children, onSave, buttonText, disabled, buttonExtra }: any) =>
  <div role="dialog">{children}<button disabled={disabled} onClick={onSave}>{buttonText}</button>{buttonExtra}</div> }));
vi.mock("@/mk/components/forms/UploadFileV3/UploadFileV3", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/UploadFile2", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/Toast/Toast", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/Select/Select", () => ({ default: ({ label, name, value, options, onChange, disabled }: any) =>
  <select aria-label={label} name={name} value={value} onChange={onChange} disabled={disabled}>
    <option value="">Elegir</option>{options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}
  </select> }));
vi.mock("@/mk/components/forms/Input/Input", () => ({ default: ({ label, name, value, onChange, disabled }: any) =>
  <input aria-label={label} name={name} value={value} onChange={onChange} disabled={disabled} /> }));
vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({ default: ({ label, name, value, onChange }: any) =>
  <textarea aria-label={label} name={name} value={value} onChange={onChange} /> }));

const execute = vi.fn();
const onClose = vi.fn();
const reLoad = vi.fn();
const toast = vi.fn();
const unit = { id: 42, nro: "CASA-A", description: "", holder: "H", homeowner: { id: "holder-42" } };
const extra = {
  categories: [{ id: 10, name: "Otros ingresos", fixed: "N", hijos: [{ id: 20, name: "Servicios", fixed: "N" }] }],
  client_config: {}, bankAccounts: [{ id: 8, is_main: 1 }], subcategories: [],
};

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  execute.mockReset(); onClose.mockReset(); reLoad.mockReset(); toast.mockReset();
  execute.mockResolvedValue({ data: { success: true, data: { deudas: [] } } });
});

describe.each([
  { name: "Ingresos", Form: FullPaymentForm, wizard: true },
  { name: "Pagos parciales", Form: PartialPaymentForm, wizard: false },
])("Pago directo desde $name", ({ Form, wizard }) => {
  async function mount(units = [unit], selected: string | number = unit.nro, ownerId?: string) {
    render(<Form open item={{ type: "I", dpto_id: selected, method: "Q", paid_at: "2026-11-20", amount: 68, owner_id: ownerId }}
      extraData={{ ...extra, dptos: units } as any} execute={execute} onClose={onClose} reLoad={reLoad} showToast={toast} />);
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "10" } });
    await screen.findByRole("option", { name: "Servicios" });
    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "20" } });
    if (wizard) {
      const next = screen.getByRole("button", { name: "Continuar" });
      await waitFor(() => expect(next).toBeEnabled());
      fireEvent.click(next);
      fireEvent.click(screen.getByRole("button", { name: "Revisar ingreso" }));
    }
    return screen.getByRole("button", { name: "Registrar ingreso" });
  }

  async function expectSaved(button: HTMLElement, ownerId = unit.homeowner.id) {
    fireEvent.click(button);
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    const writes = execute.mock.calls.filter(call => call[1] === "POST");
    expect(writes).toHaveLength(1);
    expect(writes[0].slice(0, 3)).toMatchObject(["/payments", "POST", {
      nro_id: unit.id, owner_id: ownerId, type: "I", subcategory_id: "20", amount: 68, method: "Q", bank_account_id: 8,
    }]);
    expect(reLoad).toHaveBeenCalledOnce();
  }

  it("envía el ID interno de una unidad con nombre alfanumérico", async () => {
    await expectSaved(await mount());
  });

  it("prioriza el número seleccionado aunque coincida con el ID de otra unidad", async () => {
    const units = [{ ...unit, id: 7, nro: "OTRA", homeowner: { id: "holder-7" } }, { ...unit, nro: "7" }];
    await expectSaved(await mount(units, "7"));
  });

  it("conserva la apertura desde un detalle que ya entrega el ID interno", async () => {
    await expectSaved(await mount([unit], unit.id));
  });

  it("conserva el pagador explícito al resolver la unidad", async () => {
    await expectSaved(await mount([unit], unit.nro, "member-42"), "member-42");
  });

  it("no registra el ingreso si la unidad no existe en el catálogo activo", async () => {
    fireEvent.click(await mount([], "UNIDAD-AUSENTE"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Selecciona una unidad válida del condominio activo.", "warning"));
    expect(execute.mock.calls.some(call => call[1] === "POST")).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    expect(reLoad).not.toHaveBeenCalled();
  });
});

it("mantiene el pago parcial por deuda y consulta la unidad elegida por su número", async () => {
  execute.mockResolvedValue({ data: { success: true, data: { deudas: [{ id: 99, amount: 100, penalty_amount: 0, maintenance_amount: 0, status: "A" }] } } });
  const units = [{ ...unit, id: 7, nro: "OTRA" }, { ...unit, nro: "7" }];
  render(<PartialPaymentForm open debtId={99} item={{ type: "E", dpto_id: "7", method: "E", paid_at: "2026-11-20", amount: 50 }}
    extraData={{ ...extra, dptos: units } as any} execute={execute} onClose={onClose} reLoad={reLoad} showToast={toast} />);
  await waitFor(() => expect(execute).toHaveBeenCalledWith("/payments-v2/admin/partial-debts", "GET", { dptoId: 42, type: "E" }, false, true));
  await waitFor(() => expect(screen.getByLabelText("Monto del ingreso")).toHaveValue("100.00"));
  fireEvent.change(screen.getByLabelText("Monto del ingreso"), { target: { value: "50" } });
  fireEvent.click(screen.getByRole("button", { name: "Registrar ingreso" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  const writes = execute.mock.calls.filter(call => call[1] === "POST");
  expect(writes).toHaveLength(1);
  expect(writes[0].slice(0, 3)).toMatchObject(["/payments-v2/partial", "POST", { debt_dpto_id: 99, amount: 50 }]);
  expect(writes[0][2]).not.toHaveProperty("nro_id");
});
