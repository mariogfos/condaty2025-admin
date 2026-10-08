import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SupplierForm from "../SupplierForm";

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, open, onSave, buttonText }: any) =>
    open ? (
      <div>
        {children}
        <button onClick={onSave}>{buttonText}</button>
      </div>
    ) : null,
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ name, label, value, onChange }: any) => (
    <label>
      {label}
      <input aria-label={name} name={name} value={value} onChange={onChange} />
    </label>
  ),
}));

vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ name, label, value, options, onChange }: any) => (
    <label>
      {label}
      <select aria-label={name} name={name} value={value} onChange={onChange}>
        {options.map((option: any) => (
          <option value={option.id} key={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: ({ name, label, value, onChange }: any) => (
    <label>
      {label}
      <textarea aria-label={name} name={name} value={value} onChange={onChange} />
    </label>
  ),
}));

describe("Formulario de proveedores", () => {
  it("registra una persona y deja el condominio fuera del formulario", () => {
    const onSave = vi.fn();
    const setErrors = vi.fn();
    render(
      <SupplierForm
        open
        item={{}}
        onClose={vi.fn()}
        onSave={onSave}
        errors={{}}
        setErrors={setErrors}
      />,
    );

    fireEvent.change(screen.getByLabelText("type"), { target: { value: "person" } });
    fireEvent.change(screen.getByLabelText("name"), { target: { value: "  Ana Rojas  " } });
    fireEvent.change(screen.getByLabelText("service_category"), { target: { value: "Jardinería" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear proveedor" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "person",
        name: "Ana Rojas",
        service_category: "Jardinería",
      }),
      setErrors,
    );
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("client_id");
  });
});
