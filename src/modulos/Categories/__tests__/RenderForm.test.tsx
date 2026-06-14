import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CategoryForm from "../RenderForm/RenderForm";

// Mock de DataModal para renderizar sus hijos directamente
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, title, open, onSave, onClose, buttonText, buttonCancel }: any) => {
    if (!open) return null;
    return (
      <div data-testid="data-modal">
        <h3>{title}</h3>
        {children}
        <button onClick={onSave}>{buttonText}</button>
        <button onClick={onClose}>{buttonCancel}</button>
      </div>
    );
  },
}));

// Mock de Inputs y Select
vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ label, value, onChange, disabled }: any) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`input-${label}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  ),
}));

vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ label, value, onChange, options }: any) => (
    <div>
      <label>{label}</label>
      <select
        data-testid={`select-${label}`}
        value={value}
        onChange={onChange}
      >
        {options?.map((opt: any) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <textarea
        data-testid={`textarea-${label}`}
        value={value}
        onChange={onChange}
      />
    </div>
  ),
}));

describe("CategoryForm Component", () => {
  const mockOnClose = vi.fn();
  const mockSetItem = vi.fn();
  const mockOnSave = vi.fn();
  const mockGetExtraData = vi.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    item: {},
    setItem: mockSetItem,
    errors: {},
    onSave: mockOnSave,
    extraData: {
      categories: [{ id: "1", name: "Servicios Básicos" }],
      bankAccounts: [
        { id: "3", holder: "Juan", alias_holder: "Banco Unión", account_number: "12345" },
      ],
    },
    getExtraData: mockGetExtraData,
    action: "add",
    categoryType: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no renderiza nada si open es false", () => {
    render(<CategoryForm {...defaultProps} open={false} />);
    expect(screen.queryByTestId("data-modal")).not.toBeInTheDocument();
  });

  it("renderiza modal y campos básicos en modo creación de categoría principal", () => {
    render(<CategoryForm {...defaultProps} />);
    expect(screen.getByTestId("data-modal")).toBeInTheDocument();
    expect(screen.getByText("Crear categoría")).toBeInTheDocument();
    expect(screen.getByTestId("input-Nombre")).toBeInTheDocument();
    expect(screen.getByTestId("select-Asignar cuenta bancaria")).toBeInTheDocument();
    expect(screen.getByTestId("textarea-Descripción")).toBeInTheDocument();
  });

  it("renderiza el label de categoría padre cuando es una subcategoría", () => {
    const props = {
      ...defaultProps,
      item: { category_id: "1" },
    };
    render(<CategoryForm {...props} />);
    expect(screen.getByText("Crear subcategoría")).toBeInTheDocument();
    expect(screen.getByTestId("input-Categoría padre")).toBeInTheDocument();
    expect(screen.getByTestId("input-Categoría padre")).toHaveValue("Servicios Básicos");
  });

  it("mapea y renderiza las opciones de cuentas bancarias correctamente usando useMemo", () => {
    render(<CategoryForm {...defaultProps} />);
    const select = screen.getByTestId("select-Asignar cuenta bancaria");
    expect(select.children[0]).toHaveTextContent("Juan - Banco Unión - 12345");
  });

  it("llama a onSave con datos limpios al enviar el formulario válido", () => {
    render(<CategoryForm {...defaultProps} />);

    // Rellenamos el nombre de la categoría
    const inputName = screen.getByTestId("input-Nombre");
    fireEvent.change(inputName, { target: { name: "name", value: "Internet" } });

    // Guardamos
    const btnSave = screen.getByRole("button", { name: "Guardar" });
    fireEvent.click(btnSave);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Internet",
        type: 1,
        category_id: null,
      })
    );
  });
});
