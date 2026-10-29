import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("selecciona un rubro existente y deja el condominio fuera del formulario", () => {
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
        extraData={{ serviceCategories: [{ id: "Jardinería", name: "Jardinería" }] }}
      />,
    );

    fireEvent.change(screen.getByLabelText("type"), { target: { value: "person" } });
    fireEvent.change(screen.getByLabelText("name"), { target: { value: "  Ana Rojas  " } });
    fireEvent.change(screen.getByRole("combobox", { name: "Rubro o servicio (opc)" }), { target: { value: "Jardi" } });
    fireEvent.click(screen.getByRole("option", { name: "Jardinería" }));
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

  it("filtra los rubros y crea uno nuevo al final del dropdown antes de guardar", async () => {
    const onSave = vi.fn();
    const getExtraData = vi.fn();
    const execute = vi.fn().mockResolvedValue({
      data: { success: true, data: { id: "Empresa de seguridad", name: "Empresa de seguridad" } },
    });
    render(
      <SupplierForm
        open item={{}} onClose={vi.fn()} onSave={onSave}
        errors={{}} setErrors={vi.fn()} execute={execute} showToast={vi.fn()}
        getExtraData={getExtraData}
        extraData={{ serviceCategories: [{ id: "Jardinería", name: "Jardinería" }] }}
      />,
    );

    fireEvent.change(screen.getByLabelText("name"), { target: { value: "Seguridad del Sur" } });
    fireEvent.focus(screen.getByRole("combobox", { name: "Rubro o servicio (opc)" }));
    expect(screen.getByRole("option", { name: "Jardinería" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Rubro o servicio (opc)" }), { target: { value: "Empresa de seguridad" } });
    expect(screen.queryByRole("option", { name: "Jardinería" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: 'Crear “Empresa de seguridad”' }));

    await waitFor(() => expect(execute).toHaveBeenCalledWith(
      "/suppliers/service-categories", "POST", { name: "Empresa de seguridad" }, false, true,
    ));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Rubro o servicio (opc)" })).toHaveValue("Empresa de seguridad"));
    expect(getExtraData).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Crear proveedor" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ service_category: "Empresa de seguridad" }),
      expect.any(Function),
    );
  });

  it("no guarda texto que todavía no fue seleccionado ni creado", () => {
    const onSave = vi.fn();
    const setErrors = vi.fn();
    render(
      <SupplierForm
        open item={{}} onClose={vi.fn()} onSave={onSave}
        errors={{}} setErrors={setErrors}
        extraData={{ serviceCategories: [] }}
      />,
    );
    fireEvent.change(screen.getByLabelText("name"), { target: { value: "Proveedor" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Rubro o servicio (opc)" }), { target: { value: "Gasfitería" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear proveedor" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(setErrors).toHaveBeenCalled();
  });

  it("encuentra rubros sin exigir tildes y permite seleccionarlos con teclado", () => {
    const onSave = vi.fn();
    render(
      <SupplierForm
        open item={{}} onClose={vi.fn()} onSave={onSave}
        errors={{}} setErrors={vi.fn()}
        extraData={{ serviceCategories: [{ id: "Jardinería", name: "Jardinería" }] }}
      />,
    );
    const picker = screen.getByRole("combobox", { name: "Rubro o servicio (opc)" });
    fireEvent.change(screen.getByLabelText("name"), { target: { value: "Jardines" } });
    fireEvent.change(picker, { target: { value: "jardineria" } });
    expect(screen.getByRole("option", { name: "Jardinería" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Crear/ })).not.toBeInTheDocument();
    fireEvent.keyDown(picker, { key: "Enter" });
    expect(picker).toHaveValue("Jardinería");
    fireEvent.click(screen.getByRole("button", { name: "Crear proveedor" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ service_category: "Jardinería" }), expect.any(Function),
    );
  });
});
