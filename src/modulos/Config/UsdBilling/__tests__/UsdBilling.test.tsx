import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsdBilling from "../UsdBilling";
import { UsdDebtInfo } from "@/features/financial-records/UsdDebtInfo";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), reload: vi.fn(), toast: vi.fn(), result: null as any }));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ userCan: () => true, showToast: mocks.toast }) }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ data: { data: mocks.result }, error: null, execute: mocks.execute, reLoad: mocks.reload }) }));
vi.mock("@/mk/components/forms/Button/Button", () => ({ default: ({ children, onClick, disabled }: any) => <button disabled={disabled} onClick={onClick}>{children}</button> }));
vi.mock("@/mk/components/forms/Input/Input", () => ({ default: ({ label, name, value, onChange, disabled, type }: any) => <label>{label}<input aria-label={label} name={name} value={value} onChange={onChange} disabled={disabled} type={type === "currency" ? "text" : type} /></label> }));
vi.mock("@/mk/components/forms/Select/Select", () => ({ default: ({ label, name, options, value, onChange, disabled }: any) => <label>{label}<select aria-label={label} name={name} value={value} onChange={onChange} disabled={disabled}>{options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label> }));
vi.mock("@/mk/components/forms/Switch/Switch", () => ({ default: ({ label, value, onChange, disabled }: any) =>
  <label>{label}<input type="checkbox" checked={value === "Y"} onChange={onChange} disabled={disabled} /></label> }));
vi.mock("@/mk/components/ui/DetailModal/DetailModal", () => ({ default: ({ open, title, children, buttonText, onSave }: any) =>
  open ? <div role="dialog" aria-label={title}>{children}{buttonText && <button onClick={onSave}>{buttonText}</button>}</div> : null }));

const settings = {
  expense_currency: "BOB", penalty_currency: "USD", rate_mode: "fixed", fixed_rate: "6.960000",
  expense_valuation: "issue", daily_indicator: 1000, effective_from: "2026-11-01", penalty_type: 3,
  penalty_delay_months: 0, first_amount: "2.50", second_amount: "5.00",
};
const queued = { id: 8, status: "queued", total: 3, processed: 0, updated: 0, skipped: 0, failed: 0, attempts: 0 };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.result = { settings: { ...settings }, version: "policy-version", can_edit: true, rate: { value: "6.960000", date: "2026-11-06", source: "fixed" } };
  mocks.reload.mockResolvedValue(undefined);
});

describe("Moneda y cambio", () => {
  it("muestra solo el TCO oficial cuando el cambio diario está guardado", () => {
    mocks.result.settings.rate_mode = "daily";
    mocks.result.rate = { value: "11.810000", date: "2026-11-08", source: "bcb" };
    render(<UsdBilling />);
    expect(screen.queryByLabelText("Cotización del BCB")).not.toBeInTheDocument();
    expect(screen.getByText("Cotización vigente: Bs 11,81 por USD · 2026-11-08")).toBeInTheDocument();
  });

  it("evita mostrar el cambio fijo guardado como cotización diaria al editar", () => {
    render(<UsdBilling />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Modalidad de cambio"), { target: { value: "daily" } });
    expect(screen.getByText("Tipo de cambio oficial (TCO) publicado por el BCB.")).toBeInTheDocument();
    expect(screen.getByText("La cotización vigente se mostrará al guardar.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cotización del BCB")).not.toBeInTheDocument();
  });

  it("muestra la configuración a un administrador de lectura sin exponer acciones de edición", () => {
    mocks.result.can_edit = false;
    render(<UsdBilling />);
    expect(screen.getByLabelText("Moneda de las multas")).toBeDisabled();
    expect(screen.getByLabelText("Multa desde el día 11 (USD)")).toHaveValue("2.50");
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar USD" })).not.toBeInTheDocument();
    expect(screen.queryByText("Revisar multas anteriores")).not.toBeInTheDocument();
  });

  it("envía la versión de la política y bloquea un doble envío mientras guarda", async () => {
    let finish!: (value: any) => void;
    mocks.execute.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<UsdBilling />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Bolivianos por USD"), { target: { value: "7.10" } });
    fireEvent.change(screen.getByLabelText("Motivo del cambio"), { target: { value: "Cambio acordado" } });
    const save = screen.getByRole("button", { name: "Guardar cambios" });
    fireEvent.click(save); fireEvent.click(save);
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.execute).toHaveBeenCalledWith("/finance/usd/settings", "PUT", {
      settings: { ...settings, fixed_rate: "7.10" }, version: "policy-version", reason: "Cambio acordado",
    }, false, true);
    finish({ data: { success: true } });
    await waitFor(() => expect(mocks.reload).toHaveBeenCalledTimes(1));
  });

  it("conserva el formulario si el servidor rechaza una política obsoleta", async () => {
    mocks.execute.mockResolvedValue({ error: { data: { message: "La configuración cambió. Actualiza antes de guardar." } } });
    render(<UsdBilling />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Bolivianos por USD"), { target: { value: "8.00" } });
    fireEvent.change(screen.getByLabelText("Motivo del cambio"), { target: { value: "Nueva tasa" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("La configuración cambió");
    expect(screen.getByLabelText("Bolivianos por USD")).toHaveValue("8.00");
    expect(mocks.reload).not.toHaveBeenCalled();
  });

  it("descarta la edición y guarda la tasa base para todo el condominio", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true } });
    render(<UsdBilling />);
    const baseRate = "Tasa base de las expensas (Bs por USD)";
    const selectUsd = () => {
      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      fireEvent.change(screen.getByLabelText("Moneda de las expensas"), { target: { value: "USD" } });
    };
    selectUsd();
    expect(screen.getByLabelText(baseRate)).toHaveValue("6.960000");
    fireEvent.change(screen.getByLabelText(baseRate), { target: { value: "7.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(screen.queryByLabelText(baseRate)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Moneda de las expensas")).toHaveValue("BOB");
    expect(mocks.execute).not.toHaveBeenCalled();

    selectUsd();
    fireEvent.change(screen.getByLabelText(baseRate), { target: { value: "7.00" } });
    fireEvent.change(screen.getByLabelText("Motivo del cambio"), { target: { value: "Conversión acordada" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith("/finance/usd/settings", "PUT", {
      settings: { ...settings, expense_currency: "USD", expense_base_rate: "7.00" },
      version: "policy-version", reason: "Conversión acordada",
    }, false, true));
    expect(screen.queryByText("Importes de expensa por unidad")).not.toBeInTheDocument();
  });

  it("aplica la política existente a expensas anteriores solo al marcar el interruptor", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true, data: { adoption: queued } } });
    render(<UsdBilling />);
    const apply = screen.getByLabelText("Aplicar también a expensas anteriores");
    expect(apply).toBeDisabled();
    expect(apply).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const save = screen.getByRole("button", { name: "Guardar cambios" });
    expect(save).toBeDisabled();
    fireEvent.click(apply);
    expect(save).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Motivo del cambio"), { target: { value: "Aplicar a deudas abiertas" } });
    fireEvent.click(save);
    expect(await screen.findByRole("dialog", { name: "Recálculo de expensas anteriores" })).toBeInTheDocument();
    expect(await screen.findByText(/0 de 3 revisadas/)).toBeInTheDocument();
    expect(mocks.execute).toHaveBeenCalledWith("/finance/usd/settings", "PUT", {
      settings, version: "policy-version", reason: "Aplicar a deudas abiertas", apply_to_open_expenses: true,
      adoption_key: expect.any(String),
    }, false, true);
    expect(apply).not.toBeChecked();
  });

  it("recupera una operación activa al volver y muestra sus contadores finales", async () => {
    vi.useFakeTimers();
    try {
      mocks.result.adoption = queued;
      mocks.execute.mockResolvedValue({ data: { success: true, data: {
        ...queued, status: "completed", processed: 3, updated: 2, skipped: 1,
      } } });
      render(<UsdBilling />);
      expect(screen.getByText(/0 de 3 revisadas/)).toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
      expect(mocks.execute).toHaveBeenCalledWith("/finance/usd/adoptions/8", "GET", {}, false, true);
      expect(screen.getByText("Recálculo terminado.")).toBeInTheDocument();
      expect(screen.getByText("3 de 3 revisadas · 2 actualizadas · 1 omitidas")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Información USD en el detalle", () => {
  it("no muestra información de cambio en registros BOB históricos", () => {
    render(<UsdDebtInfo terms={null} />);
    expect(screen.queryByRole("region", { name: "Importes en dólares" })).not.toBeInTheDocument();
  });
  it("muestra fuente y vigencia y conserva precisión en saldos pequeños", () => {
    render(<UsdDebtInfo terms={{ principal: { currency: "BOB", amount: "100", rate: { value: "6.96", source: "fixed", date: "2026-11-01" } },
      penalty: { currency: "USD", amount: "2.50", remaining: "0.004", rate: { value: "12.000000", source: "bcb", date: "2026-11-06" } } }} />);
    expect(screen.getByRole("region", { name: "Importes en dólares" })).toHaveTextContent("12.000000");
    expect(screen.getByText(/Saldo:/)).toHaveTextContent("0,004");
    expect(screen.queryByText(/Capital:/)).not.toBeInTheDocument();
  });
});
