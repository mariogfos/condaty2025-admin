import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdvancePaymentFields, { nextPeriod } from "../AdvancePaymentFields";

vi.mock("@/mk/components/forms/Select/Select", () => ({ default: ({ label, name, value, options, onChange, disabled }: any) =>
  <select aria-label={label} name={name} value={value} onChange={onChange} disabled={disabled}>
    {options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}
  </select> }));
vi.mock("@/mk/components/forms/Input/Input", () => ({ default: ({ label, value, onChange, disabled, type }: any) =>
  <input aria-label={label} value={value} type={type} onChange={onChange} disabled={disabled} /> }));
vi.mock("@/mk/components/forms/Button/Button", () => ({ default: ({ children, onClick, disabled }: any) =>
  <button type="button" onClick={onClick} disabled={disabled}>{children}</button> }));
vi.mock("@/mk/components/ui/Table/Table", () => ({ default: ({ header, data }: any) =>
  <table><thead><tr>{header.map((column: any) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{data.map((item: any) => <tr key={item.key}>{header.map((column: any) =>
    <td key={column.key}>{column.onRender ? column.onRender({ item }) : String(item[column.key] ?? "")}</td>)}</tr>)}</tbody></table> }));

const future = { key: "period:2027-01", debt_id: null, period: "2027-01", title: "Expensa 2027-01", due_at: "2027-01-31",
  future: true, available: true, can_discount: true, gross: 120000, penalty: 2500, maintenance: 500, fees: 3000, existing_discount: 0 };
const blocked = { ...future, key: "debt:2", future: false, available: false, title: "Expensa con comprobante", reason: "Por confirmar" };
const execute = vi.fn(); const onChange = vi.fn();
const latest = () => onChange.mock.calls.at(-1)![0];
const candidates = (maintenance = false, rows = [future, blocked]) => ({ data: { success: true, data: { rows, maintenance_enabled: maintenance, max_through: "2030-01" } } });
const plan = (version: string) => ({ data: { success: true, data: { version, original: 123000, discount: 0, net: 123000,
  items: [{ ...future, discount: 0, discount_percent: 0, net: 123000 }] } } });
const fields = (phase: 1 | 2 | 3 = 1, revision = 0) => <AdvancePaymentFields unitId={1} type="E" execute={execute} onChange={onChange} phase={phase} revision={revision} />;

describe("Selección, descuento y revisión de deudas", () => {
  beforeEach(() => {
    execute.mockReset(); onChange.mockReset();
    execute.mockImplementation(async (url: string) => url.endsWith("/candidates") ? candidates() : plan("current"));
  });
  it("muestra las columnas solicitadas y permite consultar bloqueos sin mezclarlos con las deudas disponibles", async () => {
    render(fields());
    await screen.findByRole("button", { name: "Seleccionar Expensa 2027-01" });
    expect(screen.getAllByRole("columnheader").map(node => node.textContent)).toEqual(["", "Tipo", "Concepto", "Monto", "Multa"]);
    expect(screen.queryByRole("button", { name: "Seleccionar Expensa con comprobante" })).not.toBeInTheDocument();
    expect(screen.getByText("1 deuda no disponible")).toBeInTheDocument();
    expect(screen.queryByLabelText("Distribución del descuento")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Añadir próximo período/ }));
    await waitFor(() => expect(execute.mock.calls.filter(call => call[0].endsWith("/candidates"))).toHaveLength(2));
    expect(execute.mock.calls.every(call => call[1] === "GET")).toBe(true);
    expect(latest().ready).toBe(false);
    expect(nextPeriod("2026-12")).toBe("2027-01");
  });
  it("muestra Mant. Valor sólo cuando el servidor indica que está habilitado", async () => {
    const view = render(fields());
    await screen.findByRole("columnheader", { name: "Monto" });
    expect(screen.queryByRole("columnheader", { name: "Mant. Valor" })).not.toBeInTheDocument();
    execute.mockImplementation(async (url: string) => url.endsWith("/candidates") ? candidates(true) : plan("current"));
    view.rerender(fields(1, 1));
    expect(await screen.findByRole("columnheader", { name: "Mant. Valor" })).toBeInTheDocument();
  });
  it("conserva la selección, el descuento y el mismo intento al avanzar y retroceder", async () => {
    const view = render(fields());
    fireEvent.click(await screen.findByRole("button", { name: "Seleccionar Expensa 2027-01" }));
    await waitFor(() => expect(latest().preview?.version).toBe("current"));
    const key = latest().requestKey;
    view.rerender(fields(2));
    fireEvent.change(screen.getByLabelText("Distribución del descuento"), { target: { value: "latest" } });
    fireEvent.change(screen.getByLabelText("Descuento total"), { target: { value: "600" } });
    fireEvent.change(screen.getByLabelText("Motivo de la operación"), { target: { value: "Anticipo autorizado" } });
    await waitFor(() => expect(latest().ready).toBe(true));
    expect(latest().requestKey).toBe(key);
    expect(execute.mock.calls.filter(call => call[0].endsWith("/preview")).at(-1)?.[2]).toMatchObject({
      unit_id: 1, selected: [future.key], discount: { mode: "latest", type: "fixed", value: 600 },
    });
    view.rerender(fields());
    expect(screen.getByRole("button", { name: "Seleccionar Expensa 2027-01" })).toHaveAttribute("aria-pressed", "true");
    expect(latest().requestKey).toBe(key);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    await waitFor(() => expect(latest().ready).toBe(false));
    expect(latest().preview).toBeNull();
  });
  it("ignora respuestas anteriores cuando cambia la selección o el descuento", async () => {
    let resolveFirst!: (response: any) => void; let count = 0;
    execute.mockImplementation(async (url: string) => {
      if (url.endsWith("/candidates")) return candidates(false, [future]);
      if (++count === 1) return new Promise(resolve => { resolveFirst = resolve; });
      return plan("new");
    });
    const view = render(fields());
    fireEvent.click(await screen.findByRole("button", { name: "Seleccionar Expensa 2027-01" }));
    await waitFor(() => expect(resolveFirst).toBeDefined());
    view.rerender(fields(2));
    fireEvent.change(screen.getByLabelText("Distribución del descuento"), { target: { value: "latest" } });
    await waitFor(() => expect(latest().preview?.version).toBe("new"));
    await act(async () => { resolveFirst(plan("old")); });
    expect(latest().preview.version).toBe("new");
  });
  it("edita descuentos fuera de la tabla y no envía los de una deuda deseleccionada", async () => {
    const second = { ...future, key: "period:2027-02", title: "Expensa 2027-02", period: "2027-02" };
    execute.mockImplementation(async (url: string) => url.endsWith("/candidates") ? candidates(false, [future, second]) : plan("current"));
    const view = render(fields());
    fireEvent.click(await screen.findByRole("button", { name: "Seleccionar Expensa 2027-01" }));
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar Expensa 2027-02" }));
    view.rerender(fields(2));
    fireEvent.change(screen.getByLabelText("Distribución del descuento"), { target: { value: "custom" } });
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "25" } });
    await waitFor(() => expect(latest().payload.discount.items).toContainEqual({ key: future.key, type: "fixed", value: 25 }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    view.rerender(fields());
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar Expensa 2027-01" }));
    await waitFor(() => expect(latest().payload.discount.items).toEqual([{ key: second.key, type: "fixed", value: 0 }]));
    expect(latest().payload.selected).toEqual([second.key]);
  });
});
