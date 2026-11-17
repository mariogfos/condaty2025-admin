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
  <table><tbody>{data.map((item: any) => <tr key={item.key}>{header.map((column: any) =>
    <td key={column.key}>{column.onRender ? column.onRender({ item }) : String(item[column.key] ?? "")}</td>)}</tr>)}</tbody></table> }));

const future = { key: "period:2027-01", debt_id: null, period: "2027-01", title: "Expensa 2027-01", due_at: "2027-01-31",
  future: true, available: true, can_discount: true, gross: 120000, fees: 0, existing_discount: 0 };
const blocked = { ...future, key: "debt:2", future: false, available: false, title: "Expensa con comprobante", reason: "Por confirmar" };
const execute = vi.fn();
const onChange = vi.fn();
const latest = () => onChange.mock.calls.at(-1)![0];
const plan = (version: string) => ({ data: { success: true, data: { version, original: 120000, discount: 0, net: 120000,
  items: [{ ...future, discount: 0, discount_percent: 0, net: 120000 }] } } });

describe("Registrar ingreso con períodos futuros y descuentos", () => {
  beforeEach(() => {
    execute.mockReset(); onChange.mockReset();
    execute.mockImplementation(async (url: string) => url.endsWith("/candidates")
      ? { data: { success: true, data: { rows: [future, blocked], max_through: "2030-01" } } } : plan("current"));
  });

  it("explora períodos sin emitir deudas y bloquea las que tienen comprobante pendiente", async () => {
    render(<AdvancePaymentFields unitId={1} type="E" execute={execute} onChange={onChange} />);
    expect(await screen.findByRole("button", { name: "Seleccionar Expensa con comprobante" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Añadir próximo período/ }));
    await waitFor(() => expect(execute.mock.calls.filter(call => call[0].endsWith("/candidates"))).toHaveLength(2));
    expect(execute.mock.calls.every(call => call[1] === "GET")).toBe(true);
    expect(latest().ready).toBe(false);
    expect(nextPeriod("2026-12")).toBe("2027-01");
  });

  it("usa el resumen del servidor y conserva el identificador del intento al editar el descuento", async () => {
    render(<AdvancePaymentFields unitId={1} type="E" execute={execute} onChange={onChange} />);
    fireEvent.click(await screen.findByRole("button", { name: "Seleccionar Expensa 2027-01" }));
    await waitFor(() => expect(latest().preview?.version).toBe("current"));
    expect(latest().ready).toBe(false); // Falta el motivo.
    const key = latest().requestKey;
    fireEvent.change(screen.getByLabelText("Aplicar descuento"), { target: { value: "latest" } });
    fireEvent.change(screen.getByLabelText("Descuento total"), { target: { value: "600" } });
    fireEvent.change(screen.getByLabelText("Motivo de la operación"), { target: { value: "Anticipo autorizado" } });
    await waitFor(() => expect(latest().ready).toBe(true));
    expect(latest().requestKey).toBe(key);
    const call = execute.mock.calls.filter(call => call[0].endsWith("/preview")).at(-1)!;
    expect(call[2]).toMatchObject({ unit_id: 1, selected: [future.key], discount: { mode: "latest", type: "fixed", value: 600 } });
    fireEvent.click(screen.getByRole("button", { name: "Limpiar selección" }));
    await waitFor(() => expect(latest().ready).toBe(false));
    expect(latest().preview).toBeNull();
  });

  it("ignora respuestas anteriores cuando cambia la selección o el descuento", async () => {
    let resolveFirst!: (response: any) => void;
    let count = 0;
    execute.mockImplementation(async (url: string) => {
      if (url.endsWith("/candidates")) return { data: { success: true, data: { rows: [future], max_through: "2030-01" } } };
      if (++count === 1) return new Promise(resolve => { resolveFirst = resolve; });
      return plan("new");
    });
    render(<AdvancePaymentFields unitId={1} type="E" execute={execute} onChange={onChange} />);
    fireEvent.click(await screen.findByRole("button", { name: "Seleccionar Expensa 2027-01" }));
    await waitFor(() => expect(resolveFirst).toBeDefined());
    fireEvent.change(screen.getByLabelText("Aplicar descuento"), { target: { value: "latest" } });
    await waitFor(() => expect(latest().preview?.version).toBe("new"));
    await act(async () => { resolveFirst(plan("old")); });
    expect(latest().preview.version).toBe("new");
  });

  it("no envía descuentos personalizados de deudas que se deseleccionaron", async () => {
    const second = { ...future, key: "period:2027-02", title: "Expensa 2027-02", period: "2027-02" };
    execute.mockImplementation(async (url: string) => url.endsWith("/candidates")
      ? { data: { success: true, data: { rows: [future, second], max_through: "2030-01" } } } : plan("current"));
    render(<AdvancePaymentFields unitId={1} type="E" execute={execute} onChange={onChange} />);
    fireEvent.click(await screen.findByRole("button", { name: "Seleccionar Expensa 2027-01" }));
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar Expensa 2027-02" }));
    fireEvent.change(screen.getByLabelText("Aplicar descuento"), { target: { value: "custom" } });
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "25" } });
    await waitFor(() => expect(latest().payload.discount.items).toEqual([{ key: future.key, type: "fixed", value: 25 }]));
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar Expensa 2027-01" }));
    await waitFor(() => expect(latest().payload.discount.items).toEqual([]));
    expect(latest().payload.selected).toEqual([second.key]);
  });
});
