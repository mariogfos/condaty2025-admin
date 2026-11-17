import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import AdvancePayments from "../AdvancePayments";

vi.mock("@/modulos/Payments/RenderForm/RenderForm", () => ({ default: () => <div>Formulario compartido de ingreso</div> }));
vi.mock("@/modulos/Payments/RenderView/RenderView", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/Select/Select", () => ({ default: ({ name, label, value, options, onChange }: any) =>
  <select aria-label={label} name={name} value={value} onChange={onChange}>{options.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}</select> }));
vi.mock("@/mk/components/forms/Input/Input", () => ({ default: ({ label, type, value, onChange }: any) => <input aria-label={label} type={type} value={value} onChange={onChange} /> }));
vi.mock("@/mk/components/ui/Table/Table", () => ({ default: ({ id, header, data }: any) =>
  <table data-testid={id}><tbody>{data.map((item: any) => <tr key={item.id}>{header.map((col: any) =>
    <td key={col.key}>{col.onRender ? col.onRender({ item }) : String(item[col.key] ?? "")}</td>)}</tr>)}</tbody></table> }));
const instance = axios.create();
const adapter = new MockAdapter(instance);
const row = { id: "operation-1", unit_label: "U-01", actor_label: "Administración", period_from: "2026-12", period_to: "2027-01", debt_count: 2,
  created_at: "2026-11-17T12:00:00Z", status: "applied", original_amount: "2400.00", discount_amount: "1800.00", paid_amount: "600.00",
  payment_id: "payment-1", payment: { status: "P" } };

function mount() {
  render(<AxiosContext.Provider value={{ contextInstance: instance, waiting: 0, setWaiting: vi.fn() }}><AdvancePayments /></AxiosContext.Provider>);
}
describe("Página de pagos anticipados", () => {
  beforeEach(() => {
    adapter.reset();
    adapter.onGet(/\/advance-payments\?/).reply(200, { success: true, data: { data: [row], current_page: 1, last_page: 1, total: 1 } });
    adapter.onGet(/\/payments\?/).reply(200, { success: true, data: { dptos: [], bankAccounts: [] } });
  });
  it("lista una fila por grupo y omite filtros vacíos", async () => {
    mount();
    await screen.findByTestId("advance-payments");
    expect(screen.getByText("2 deudas")).toBeInTheDocument();
    expect(screen.getByText("Ingreso registrado")).toBeInTheDocument();
    const query = new URL(adapter.history.get[0].url!, "https://api.test").searchParams;
    expect([...query.keys()]).toEqual(["search", "page"]);
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "cancelled" } });
    await waitFor(() => expect(adapter.history.get.at(-1)?.url).toContain("status=cancelled"));
  });
  it("abre el mismo formulario de registrar ingreso con su configuración del servidor", async () => {
    mount(); await screen.findByTestId("advance-payments");
    fireEvent.click(screen.getByRole("button", { name: /Registrar pago anticipado/ }));
    expect(await screen.findByText("Formulario compartido de ingreso")).toBeInTheDocument();
    expect(adapter.history.get.at(-1)?.url).toContain("fullType=EXTRA");
  });
});
