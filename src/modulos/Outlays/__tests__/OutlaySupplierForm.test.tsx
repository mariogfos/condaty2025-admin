import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, open, onSave }: any) =>
    open ? <div>{children}<button onClick={onSave}>Guardar egreso</button></div> : null,
}));
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ name, value, options, onChange }: any) => (
    <select aria-label={name} name={name} value={value} onChange={onChange}>
      {options.map((option: any) => (
        <option key={option.id} value={option.id}>{option.name}</option>
      ))}
    </select>
  ),
}));
vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ name, value, onChange }: any) =>
    <input aria-label={name} name={name} value={value} onChange={onChange} />,
}));
vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: ({ name, value, onChange }: any) =>
    <textarea aria-label={name} name={name} value={value} onChange={onChange} />,
}));
vi.mock("@/mk/components/forms/UploadFileV3/UploadFileV3", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/ui/Toast/Toast", () => ({ default: () => null }));

describe("Proveedor opcional en nuevo egreso", () => {
  it("envía el proveedor seleccionado y permite quitarlo", () => {
    const onSave = vi.fn();
    render(
      <RenderForm
        open
        onClose={vi.fn()}
        onSave={onSave}
        showToast={vi.fn()}
        execute={vi.fn()}
        reLoad={vi.fn()}
        item={{
          date_at: "2026-10-08",
          category_id: 1,
          subcategory_id: 2,
          description: "Pago por mantenimiento",
          amount: 100,
          type: "T",
        }}
        extraData={{
          categories: [{ id: 1, name: "Mantenimiento" }],
          subcategories: [{ id: 2, name: "Jardines", category_id: 1 }],
          bankAccounts: [],
          suppliers: [{ id: 7, name: "Jardines del Norte", type: "company" }],
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("supplier_id"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar egreso" }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ supplier_id: 7 }));

    fireEvent.change(screen.getByLabelText("supplier_id"), { target: { value: "NONE" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar egreso" }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ supplier_id: null }));
  });
});
