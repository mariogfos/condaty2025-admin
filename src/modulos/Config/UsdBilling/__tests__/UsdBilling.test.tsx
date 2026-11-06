import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsdBilling from "../UsdBilling";
import { UsdDebtInfo } from "@/features/financial-records/UsdDebtInfo";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), reload: vi.fn(), reloadUnits: vi.fn(), toast: vi.fn(), result: null as any }));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ userCan: () => true, showToast: mocks.toast }) }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: (url: string) => url?.endsWith("/units")
  ? { data: { data: { data: [{ id: 7, nro: "A-07", expense_amount: "100", expense_amount_usd: "10.00", version: "unit-version" }], last_page: 1 } }, reLoad: mocks.reloadUnits }
  : { data: { data: mocks.result }, error: null, execute: mocks.execute, reLoad: mocks.reload } }));
vi.mock("@/mk/components/forms/Button/Button", () => ({ default: ({ children, onClick, disabled }: any) => <button disabled={disabled} onClick={onClick}>{children}</button> }));
vi.mock("@/mk/components/forms/Input/Input", () => ({ default: ({ label, name, value, onChange, disabled, type }: any) => <label>{label}<input aria-label={label} name={name} value={value} onChange={onChange} disabled={disabled} type={type === "currency" ? "text" : type} /></label> }));
vi.mock("@/mk/components/forms/Select/Select", () => ({ default: ({ label, name, options, value, onChange, disabled }: any) => <label>{label}<select aria-label={label} name={name} value={value} onChange={onChange} disabled={disabled}>{options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label> }));
vi.mock("@/mk/components/ui/Table/Table", () => ({ default: ({ data, onButtonActions }: any) => <div>{data.map((row: any) => <div key={row.id}>{row.nro}{onButtonActions?.(row)}</div>)}</div> }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ children, title, onSave, disabled, buttonText }: any) => <div role="dialog" aria-label={title}>{children}<button disabled={disabled} onClick={onSave}>{buttonText}</button></div> }));

const settings = {
  expense_currency: "BOB", penalty_currency: "USD", rate_mode: "fixed", fixed_rate: "6.960000",
  expense_valuation: "issue", daily_indicator: 1000, effective_from: "2026-11-01", penalty_type: 3,
  penalty_delay_months: 0, first_amount: "2.50", second_amount: "5.00",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.result = { settings: { ...settings }, version: "policy-version", can_edit: true, rate: { value: "6.960000", date: "2026-11-06", source: "fixed" } };
  mocks.reload.mockResolvedValue(undefined);
});

describe("Moneda y cambio", () => {
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

  it("guarda el precio USD separado por unidad sin reenviar el precio en bolivianos", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true } });
    render(<UsdBilling />);
    fireEvent.click(screen.getByRole("button", { name: "Editar USD" }));
    fireEvent.change(screen.getByLabelText("Importe de expensa (USD)"), { target: { value: "15.00" } });
    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Cuota actualizada" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar importe" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith("/finance/usd/units/7", "PUT", {
      amount: "15.00", version: "unit-version", reason: "Cuota actualizada",
    }, false, true));
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
