import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderView from "../RenderView/RenderView";
import PaymentRenderView from "@/modulos/Payments/RenderView/RenderView";
import { getAvailableActions } from "../../constants";
import type { FinancialWorkspace } from "@/features/financial-records/types";

const state = vi.hoisted(() => ({
  debt: {} as any,
  response: {} as any,
  payment: {} as any,
  terms: null as FinancialWorkspace["record"]["usd_terms"],
  execute: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: (url?: string) => ({
    data: url === "/debt-dptos" ? state.response : null,
    execute: state.execute,
    loaded: true,
  }),
}));
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "admin" }, showToast: state.showToast }),
}));
vi.mock("@/features/financial-records/FinancialDetailModal", () => ({
  FinancialDetailModal: ({ open, title, children, footer }: any) => open ? (
    <section role="dialog" aria-label={title}>
      {typeof children === "function" ? children({ record: { usd_terms: state.terms } }) : children}
      <footer>{footer}</footer>
    </section>
  ) : null,
}));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, title, children, onSave, buttonText, disabled }: any) => open ? (
    <section role="dialog" aria-label={title}>{children}<button disabled={disabled} onClick={onSave}>{buttonText}</button></section>
  ) : null,
}));
vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: ({ label, name, value, onChange, error }: any) => (
    <><label>{label}<textarea name={name} value={value} onChange={onChange} /></label>{error?.[name] && <p role="alert">{error[name]}</p>}</>
  ),
}));
vi.mock("@/modulos/Expenses/ExpensesDetails/RenderView/RenderView", () => ({ default: () => null }));
vi.mock("@/modulos/Reservas/RenderView/RenderView", () => ({ default: () => null }));
vi.mock("@/modulos/Payments/RenderForm/RenderForm", () => ({ default: () => <section role="dialog" aria-label="Registrar pago" /> }));
vi.mock("@/modulos/QrDinamico/DebtQrSection/DebtQrSection", () => ({ default: () => null }));
vi.mock("@/modulos/QrDinamico/PaymentQrSection/PaymentQrSection", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/Table/Table", () => ({ default: () => null }));

const setDebt = (status = "S", type = 0, paymentId: string | null = "payment-1") => {
  state.debt = {
    id: "debt-1", status, type, amount: 250, payment_id: paymentId,
    dpto: { id: "unit-1", nro: "A-1", holder: "H", homeowner: { name: "Vecino" } },
    subcategory: { id: 2, name: "Agua", padre: { name: "Servicios" } },
  };
  state.response = { success: true, data: [state.debt] };
};

beforeEach(() => {
  vi.clearAllMocks();
  setDebt();
  state.terms = null;
  state.payment = { id: "payment-1", status: "S", amount: 250, details: [], url_file: ["https://example.invalid/comprobante.jpg"] };
  state.execute.mockImplementation(async (url: string, method: string) => {
    if (url.endsWith("/resolved-payment")) return { data: { success: true, data: { payment_id: "payment-1", payment_status: "S" } } };
    if (url === "/payments-v2/payment-1" && method === "GET") return { data: { success: true, data: state.payment } };
    if (url === "/payments-v2/payment-1/confirm") return { data: { success: true, message: "Ingreso actualizado" } };
    return { data: { success: true, data: [state.debt] } };
  });
});

const openDebt = () => {
  const onClose = vi.fn(); const onReload = vi.fn();
  render(<RenderView open onClose={onClose} onReload={onReload} item={state.debt} />);
  return { onClose, onReload };
};

describe("importes en el detalle de deuda", () => {
  it("muestra la multa USD, su saldo y cotización dentro de Importes y estado", () => {
    setDebt("M", 1, null);
    state.terms = {
      principal: { currency: "BOB", amount: "250", rate: { value: "6.96", source: "fixed", date: "2026-11-01" } },
      penalty: { currency: "USD", amount: "5.00", remaining: "0.004",
        rate: { value: "11.810000", source: "bcb", date: "2026-11-07", effective_date: "2026-11-08" } },
    };
    openDebt();
    const toggle = screen.getByRole("button", { name: "Importes y estado" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Multa (USD)")).not.toBeInTheDocument();
    fireEvent.click(toggle);

    const section = within(toggle.closest("section")!);
    expect(section.getByText("Multa")).toBeInTheDocument();
    expect(section.getByText("Multa (USD)")).toBeInTheDocument();
    expect(section.getByText(/USD\s+0,004/)).toBeInTheDocument();
    expect(section.getByText("Bs 11.810000 por USD · BCB · 2026-11-08")).toBeInTheDocument();
    expect(section.queryByText("Capital (USD)")).not.toBeInTheDocument();
  });

  it("muestra solo los importes en Bs cuando la deuda no tiene términos USD", () => {
    setDebt("M", 1, null);
    openDebt();
    fireEvent.click(screen.getByRole("button", { name: "Importes y estado" }));
    expect(screen.getByText("Multa")).toBeInTheDocument();
    expect(screen.queryByText("Multa (USD)")).not.toBeInTheDocument();
  });
});

describe("acciones del pago por confirmar desde una deuda", () => {
  it.each([0, 1, 2, 3, 4])("reutiliza las acciones de ingresos para una deuda de tipo %s", async (type) => {
    setDebt("S", type);
    openDebt();
    expect(await screen.findByRole("button", { name: "Aprobar pago" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar pago" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver comprobante" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Registrar Pago/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Detalle del ingreso" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Detalle de deuda" })).toBeInTheDocument();
  });

  it("resuelve el ingreso aun cuando la deuda no trae payment_id", async () => {
    setDebt("S", 0, null); openDebt();
    expect(await screen.findByRole("button", { name: "Aprobar pago" })).toBeInTheDocument();
    expect(state.execute).toHaveBeenCalledWith("/payments-v2/debts/debt-1/resolved-payment", "GET", {}, false, true);
  });

  it("espera a resolver el ingreso antes de ofrecer acciones", async () => {
    let finish!: (value: any) => void;
    const original = state.execute.getMockImplementation()!;
    state.execute.mockImplementation((url: string, ...args: any[]) => url.endsWith("/resolved-payment") ? new Promise(resolve => { finish = resolve; }) : original(url, ...args));
    openDebt();
    expect(screen.getByRole("status")).toHaveTextContent("Consultando el pago asociado");
    expect(screen.queryByRole("button", { name: "Aprobar pago" })).not.toBeInTheDocument();
    finish({ data: { success: true, data: { payment_id: "payment-1" } } });
    expect(await screen.findByRole("button", { name: "Aprobar pago" })).toBeInTheDocument();
  });

  it("permite revisar un ingreso sin mostrar un comprobante inexistente", async () => {
    state.payment.url_file = [];
    openDebt();
    expect(await screen.findByRole("button", { name: "Aprobar pago" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar pago" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver comprobante" })).not.toBeInTheDocument();
  });

  it("aprueba el ingreso vinculado, bloquea doble envío y recarga el listado", async () => {
    let finish!: (value: any) => void;
    const original = state.execute.getMockImplementation()!;
    state.execute.mockImplementation((url: string, ...args: any[]) => url.endsWith("/confirm") ? new Promise(resolve => { finish = resolve; }) : original(url, ...args));
    const { onClose, onReload } = openDebt();
    const approve = await screen.findByRole("button", { name: "Aprobar pago" });
    fireEvent.click(approve); fireEvent.click(approve);
    expect(approve).toBeDisabled();
    expect(state.execute.mock.calls.filter(([url]) => url.endsWith("/confirm"))).toHaveLength(1);
    expect(state.execute).toHaveBeenCalledWith("/payments-v2/payment-1/confirm", "POST", { confirm: "P", confirm_obs: "" }, false, true);
    finish({ data: { success: true, message: "Ingreso aprobado" } });
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("exige motivo al rechazar y usa la misma operación que ingresos", async () => {
    const { onClose } = openDebt();
    fireEvent.click(await screen.findByRole("button", { name: "Rechazar pago" }));
    const dialog = screen.getByRole("dialog", { name: "Rechazar pago" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Rechazar" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("La observación es obligatoria");
    expect(state.execute.mock.calls.some(([url]) => url.endsWith("/confirm"))).toBe(false);
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Observaciones" }), { target: { value: "Comprobante incorrecto" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Rechazar" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(state.execute).toHaveBeenCalledWith("/payments-v2/payment-1/confirm", "POST", { confirm: "R", confirm_obs: "Comprobante incorrecto" }, false, true);
  });

  it("abre el comprobante del ingreso y no el de la deuda", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.href).toBe("https://example.invalid/comprobante.jpg");
    });
    openDebt(); fireEvent.click(await screen.findByRole("button", { name: "Ver comprobante" }));
    expect(click).toHaveBeenCalledOnce(); click.mockRestore();
  });

  it("conserva la deuda abierta si Backend rechaza la aprobación", async () => {
    const original = state.execute.getMockImplementation()!;
    state.execute.mockImplementation((url: string, ...args: any[]) => url.endsWith("/confirm") ? Promise.resolve({ error: { data: { message: "El ingreso ya cambió de estado" } } }) : original(url, ...args));
    const { onClose } = openDebt();
    fireEvent.click(await screen.findByRole("button", { name: "Aprobar pago" }));
    await waitFor(() => expect(state.showToast).toHaveBeenCalledWith("El ingreso ya cambió de estado", "error"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("no ofrece registrar otro pago si no existe un ingreso resoluble", async () => {
    setDebt("S", 0, null);
    state.execute.mockResolvedValue({ data: { success: true, data: { payment_id: null } } });
    openDebt();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se encontró el ingreso asociado");
    expect(screen.queryByRole("button", { name: /Registrar Pago/i })).not.toBeInTheDocument();
  });

  it("no ofrece aprobación si falla la carga del ingreso", async () => {
    const original = state.execute.getMockImplementation()!;
    state.execute.mockImplementation((url: string, ...args: any[]) => url === "/payments-v2/payment-1" ? Promise.resolve({ error: { status: 404 } }) : original(url, ...args));
    openDebt();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el ingreso asociado");
    expect(screen.queryByRole("button", { name: "Aprobar pago" })).not.toBeInTheDocument();
  });

  it.each(["P", "I"])("conserva Ver pago para el estado %s", async (status) => {
    setDebt(status); openDebt();
    expect(await screen.findByRole("button", { name: "Ver pago" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar pago" })).not.toBeInTheDocument();
  });

  it.each(["A", "M"])("conserva Registrar Pago para una deuda %s", (status) => {
    setDebt(status, 0, null); openDebt();
    expect(screen.getByRole("button", { name: "Registrar Pago" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar pago" })).not.toBeInTheDocument();
  });

  it("conserva la presentación original del detalle de ingresos", async () => {
    render(<PaymentRenderView open payment_id="payment-1" onClose={vi.fn()} />);
    expect(await screen.findByRole("button", { name: "Aprobar pago" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Detalle del ingreso" })).toBeInTheDocument();
  });
});

describe("política de acciones para deudas por confirmar", () => {
  it.each([0, 1, 2, 3, 4])("nunca permite un segundo pago para el tipo %s", (type) => {
    expect(getAvailableActions("S", type)).toMatchObject({ showRegistrarPago: false, showVerPago: true, showEditar: false, showAnular: false });
  });
});
