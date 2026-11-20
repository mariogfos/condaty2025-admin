import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinancialDetailModal } from "../FinancialDetailModal";
import type { FinancialWorkspace } from "../types";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), showToast: vi.fn() }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute: mocks.execute }) }));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ showToast: mocks.showToast }) }));

const workspace: FinancialWorkspace = {
  record: {
    type: "debt", id: "42", amount: 100, penalty_amount: 50,
    penalty_edit: { minimum_amount: 35, applied_payments_amount: 145, blocked_reason: null },
  },
  capabilities: { can_edit_amount: true, can_edit_penalty: true, can_verify_payment: true, can_edit_paid_at: false },
  history: [],
};

const openEditor = (overrides: Partial<FinancialWorkspace["record"]> = {}) => {
  const onChanged = vi.fn();
  render(<FinancialDetailModal open onClose={vi.fn()} title="Detalle de deuda"
    record={{ type: "debt", id: 42, penaltyAmount: 999 }}
    workspaceOverride={{ ...workspace, record: { ...workspace.record, ...overrides } }}
    onRecordChanged={onChanged}>
    <p>Detalle</p>
  </FinancialDetailModal>);
  fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Editar multa" }));
  fireEvent.change(screen.getByLabelText("Motivo de la corrección"), { target: { value: "Corrección autorizada" } });
  return { amount: screen.getByLabelText("Monto en bolivianos"), save: screen.getByRole("button", { name: "Guardar corrección" }), onChanged };
};

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.showToast.mockClear();
});

describe("Edición de multa", () => {
  it("usa la multa y el mínimo del workspace, aunque el listado esté desactualizado", () => {
    const { amount } = openEditor();
    expect(amount).toHaveValue(50);
    expect(amount).toHaveAttribute("min", "35");
    expect(screen.getByText("Bs 35.00")).toBeVisible();
    expect(screen.getByText(/confirmados o por confirmar ya aplicados/)).toBeVisible();
  });

  it("no convierte un campo vacío en una orden de retirar la multa", () => {
    const { amount, save } = openEditor();
    fireEvent.change(amount, { target: { value: "" } });
    fireEvent.click(save);
    expect(screen.getByRole("alert")).toHaveTextContent("Para quitar la multa, escribe 0");
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("explica el mínimo y evita enviar una reducción que deje sobrepagos", () => {
    const { amount, save } = openEditor();
    fireEvent.change(amount, { target: { value: "34.99" } });
    fireEvent.click(save);
    expect(screen.getByRole("alert")).toHaveTextContent("La multa no puede ser menor a Bs 35.00");
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("acepta exactamente el mínimo y realiza una sola corrección", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true, message: "Multa actualizada" } });
    const { amount, save, onChanged } = openEditor();
    fireEvent.change(amount, { target: { value: "35" } });
    fireEvent.click(save);
    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
    expect(mocks.execute).toHaveBeenCalledExactlyOnceWith("/financial-records/debt/42/penalty", "PUT",
      { amount: 35, reason: "Corrección autorizada" }, false, true);
    expect(mocks.showToast).toHaveBeenCalledWith("Multa actualizada", "success");
  });

  it("permite retirar la multa con un cero explícito cuando el mínimo es cero", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true } });
    const { amount, save, onChanged } = openEditor({ penalty_edit: { minimum_amount: 0, applied_payments_amount: 100, blocked_reason: null } });
    fireEvent.change(amount, { target: { value: "0" } });
    fireEvent.click(save);
    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
    expect(mocks.execute).toHaveBeenCalledWith("/financial-records/debt/42/penalty", "PUT",
      { amount: 0, reason: "Corrección autorizada" }, false, true);
  });

  it("recupera el mínimo si entró otro pago y la respuesta del rechazo no es legible", async () => {
    mocks.execute.mockResolvedValueOnce({ error: { status: 0, message: "Network Error" } })
      .mockResolvedValueOnce({ data: { success: true, data: { ...workspace, record: {
        ...workspace.record, penalty_edit: { minimum_amount: 40, applied_payments_amount: 150, blocked_reason: null },
      } } } });
    const { amount, save, onChanged } = openEditor();
    fireEvent.change(amount, { target: { value: "35" } });
    fireEvent.click(save);
    expect(await screen.findByRole("alert")).toHaveTextContent("La multa no puede ser menor a Bs 40.00");
    expect(amount).toHaveValue(35);
    expect(save).toBeEnabled();
    expect(mocks.execute).toHaveBeenCalledTimes(2);
    expect(mocks.execute.mock.calls.filter((call) => call[1] === "PUT")).toHaveLength(1);
    expect(mocks.execute).toHaveBeenLastCalledWith("/financial-records/debt/42/workspace", "GET", {}, false, true);
    expect(onChanged).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Editar multa" }));
    expect(screen.getByText("Bs 40.00")).toBeVisible();
  });

  it("no supone éxito ni repite el pago si la respuesta perdida no se puede confirmar", async () => {
    mocks.execute.mockResolvedValueOnce({ error: { status: 0, message: "Network Error" } })
      .mockResolvedValueOnce({ data: { success: true, data: workspace } });
    const { save } = openEditor();
    fireEvent.click(save);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo confirmar la corrección");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Network Error");
    expect(mocks.execute.mock.calls.filter((call) => call[1] === "PUT")).toHaveLength(1);
  });

  it("ignora límites recuperados para otro registro", async () => {
    mocks.execute.mockResolvedValueOnce({ error: { status: 0, message: "Network Error" } })
      .mockResolvedValueOnce({ data: { success: true, data: { ...workspace, record: {
        ...workspace.record, id: "43", penalty_edit: { minimum_amount: 999, applied_payments_amount: 999, blocked_reason: null },
      } } } });
    const { save } = openEditor();
    fireEvent.click(save);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo confirmar la corrección");
    expect(screen.getByText("Bs 35.00")).toBeVisible();
    expect(screen.queryByText("Bs 999.00")).not.toBeInTheDocument();
  });

  it("muestra la protección de un comprobante USD pendiente antes de enviar", () => {
    const message = "Resuelve primero el comprobante por confirmar antes de corregir una obligación USD.";
    const { save } = openEditor({ penalty_edit: { minimum_amount: 0, applied_payments_amount: 20, blocked_reason: message } });
    fireEvent.click(save);
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("tolera un backend anterior sin los nuevos límites", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true } });
    const { amount, save, onChanged } = openEditor({ penalty_edit: undefined });
    fireEvent.change(amount, { target: { value: "0" } });
    fireEvent.click(save);
    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
    expect(mocks.execute.mock.calls[0][2].amount).toBe(0);
  });
});
