import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DebtBulkUploadModal from "../DebtBulkUploadModal";

const executeMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: toastMock }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, title, children, buttonText, onSave, onClose, disabled }: any) => open ? (
    <section>
      <h2>{title}</h2>
      {children}
      {buttonText && <button type="button" onClick={onSave} disabled={disabled}>{buttonText}</button>}
      <button type="button" onClick={onClose}>Cancelar</button>
    </section>
  ) : null,
}));

vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ label, name, value, options, onChange }: any) => (
    <label>{label}
      <select name={name} value={value} onChange={onChange}>
        <option value="">Seleccionar</option>
        {options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  ),
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ label, name, type, value, onChange }: any) => (
    <label>{label}<input name={name} type={type} value={value} onChange={onChange} /></label>
  ),
}));

const categories = [{ id: 10, name: "Servicios", fixed: "X", hijos: [{ id: 11, name: "Agua" }] }];

describe("DebtBulkUploadModal", () => {
  beforeEach(() => {
    executeMock.mockReset();
    toastMock.mockReset();
  });

  it("validates one file before confirming and sends the same selections on both requests", async () => {
    executeMock
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            valid: true,
            row_count: 2,
            total_amount: "492.00",
            fingerprint: "a".repeat(64),
            rows: [{ row: 2, unit: "001", description: "Agua Septiembre", amount: "246.00" }],
            errors: [],
            error_count: 0,
          },
        },
      })
      .mockResolvedValueOnce({ data: { success: true, message: "Se crearon 2 deudas." } });
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <DebtBulkUploadModal open categories={categories} onClose={onClose} onSuccess={onSuccess} />,
    );

    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "11" } });
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Fecha de vencimiento"), { target: { value: "2026-10-15" } });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["xlsx"], "deudas.xlsx")] } });

    fireEvent.click(screen.getByRole("button", { name: "Validar archivo" }));
    await waitFor(() => expect(screen.getByText("Lista para confirmar")).toBeInTheDocument());
    expect(screen.getByText("Agua Septiembre")).toBeInTheDocument();
    expect((executeMock.mock.calls[0][2] as FormData).get("mode")).toBe("preview");

    fireEvent.click(screen.getByRole("button", { name: "Crear 2 deudas" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    const body = executeMock.mock.calls[1][2] as FormData;
    expect(body.get("mode")).toBe("commit");
    expect(body.get("fingerprint")).toBe("a".repeat(64));
    expect(body.get("category_id")).toBe("10");
    expect(body.get("subcategory_id")).toBe("11");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not offer confirmation when preview reports row errors", async () => {
    executeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          valid: false,
          row_count: 0,
          total_amount: "0.00",
          fingerprint: null,
          rows: [],
          errors: [{ row: 2, message: "El monto pagado debe ser 0.00." }],
          error_count: 1,
        },
      },
    });
    const { container } = render(
      <DebtBulkUploadModal open categories={categories} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "11" } });
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Fecha de vencimiento"), { target: { value: "2026-10-15" } });
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(["xlsx"], "deudas.xlsx")] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Validar archivo" }));
    await waitFor(() => expect(screen.getByText(/Fila 2: El monto pagado/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Crear.*deudas/ })).not.toBeInTheDocument();
    expect(executeMock).toHaveBeenCalledOnce();
  });
});
