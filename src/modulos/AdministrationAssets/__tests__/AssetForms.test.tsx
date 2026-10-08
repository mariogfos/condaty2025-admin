import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PetForm from "../PetForm";
import VehicleForm from "../VehicleForm";
import VehicleView from "../VehicleView";

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ userCan: () => true }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, open, onSave, buttonText, buttonCancel, buttonExtra, title }: any) => open ? (
    <div><h2>{title}</h2>{children}
      {buttonText ? <button onClick={onSave}>{buttonText}</button> : null}
      {buttonCancel ? <button>{buttonCancel}</button> : null}
      {buttonExtra}
    </div>
  ) : null,
}));
vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ name, label, value, onChange }: any) => (
    <label>{label}<input aria-label={name} name={name} value={value ?? ""} onChange={onChange} /></label>
  ),
}));
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ name, label, value, options, onChange }: any) => (
    <label>{label}<select aria-label={name} name={name} value={value ?? ""} onChange={onChange}>
      <option value="">Seleccionar</option>
      {options.map((option: any) => <option value={option.id} key={option.id}>{option.name}</option>)}
    </select></label>
  ),
}));
vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: ({ name, label, value, onChange }: any) => (
    <label>{label}<textarea aria-label={name} name={name} value={value ?? ""} onChange={onChange} /></label>
  ),
}));
vi.mock("@/mk/components/forms/UploadFileV3/UploadFileV3", () => ({
  default: ({ setFormState }: any) => (
    <button onClick={() => setFormState((current: any) => ({ ...current, images: ["https://example.org/pet.jpg"] }))}>
      Subir foto
    </button>
  ),
}));

describe("Formularios de mascotas y vehículos", () => {
  it("crea una mascota con los campos del formulario residente y responsable, sin enviar client_id", () => {
    const onSave = vi.fn();
    const setErrors = vi.fn();
    render(<PetForm open onClose={vi.fn()} onSave={onSave} errors={{}} setErrors={setErrors}
      extraData={{ people: [{ id: "owner-1", name: "Ana" }], species: [{ id: 1, name: "Perro" }] }} />);
    fireEvent.change(screen.getByLabelText("owner_id"), { target: { value: "owner-1" } });
    fireEvent.change(screen.getByLabelText("name"), { target: { value: "Luna" } });
    fireEvent.change(screen.getByLabelText("gender"), { target: { value: "F" } });
    fireEvent.change(screen.getByLabelText("specie_id"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("breed"), { target: { value: "Mestiza" } });
    fireEvent.change(screen.getByLabelText("color"), { target: { value: "Café" } });
    fireEvent.change(screen.getByLabelText("age_year"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("age_month"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("description"), { target: { value: "Collar azul" } });
    fireEvent.click(screen.getByRole("button", { name: "Subir foto" }));
    fireEvent.click(screen.getByRole("button", { name: "Registrar mascota" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      owner_id: "owner-1", name: "Luna", age_month: "0",
      images: ["https://example.org/pet.jpg"],
    }), setErrors);
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("client_id");
  });

  it("permite un vehículo de residente con persona de la unidad y uno de visita sin unidad", () => {
    const onSave = vi.fn();
    const setErrors = vi.fn();
    render(<VehicleForm open onClose={vi.fn()} onSave={onSave} errors={{}} setErrors={setErrors}
      extraData={{ units: [{ id: 7, name: "M5-010", people: [{ id: "owner-1", name: "Ana" }] }] }} />);
    fireEvent.change(screen.getByLabelText("dpto_id"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("owner_id"), { target: { value: "owner-1" } });
    fireEvent.change(screen.getByLabelText("plate"), { target: { value: "abc123" } });
    expect(screen.getByLabelText("plate")).toHaveValue("ABC123");
    fireEvent.click(screen.getByRole("button", { name: "Registrar vehículo" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      kind: "resident", plate: "ABC123", dpto_id: "7", owner_id: "owner-1",
    }), setErrors);

    fireEvent.change(screen.getByLabelText("kind"), { target: { value: "visitor" } });
    fireEvent.change(screen.getByLabelText("visitor_name"), { target: { value: "Invitado" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar vehículo" }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({
      kind: "visitor", dpto_id: null, owner_id: null, visitor_name: "Invitado",
    }), setErrors);
  });

  it("carga un vehículo para editarlo y conserva la placa en mayúsculas desde el input", () => {
    const onSave = vi.fn();
    const setErrors = vi.fn();
    render(<VehicleForm open item={{ id: 12, kind: "visitor", vehicle_type: "car", plate: "abc123", visitor_name: "Luz" }}
      onClose={vi.fn()} onSave={onSave} errors={{}} setErrors={setErrors} extraData={{ units: [] }} />);
    expect(screen.getByRole("heading", { name: "Editar vehículo" })).toBeInTheDocument();
    expect(screen.getByLabelText("plate")).toHaveValue("ABC123");
    fireEvent.change(screen.getByLabelText("plate"), { target: { value: "xyz789" } });
    expect(screen.getByLabelText("plate")).toHaveValue("XYZ789");
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 12, kind: "visitor", plate: "XYZ789", visitor_name: "Luz",
    }), setErrors);
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("client_id");
  });

  it("sustituye Cerrar por Editar y Eliminar en el detalle", () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const onDel = vi.fn();
    render(<VehicleView open item={{ id: 12, plate: "ABC123", kind: "resident", vehicle_type: "car" }}
      onClose={onClose} onEdit={onEdit} onDel={onDel} />);
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onDel).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
  });
});
