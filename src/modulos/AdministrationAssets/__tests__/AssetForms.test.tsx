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

  it("registra únicamente vehículos de una unidad", () => {
    const onSave = vi.fn();
    const setErrors = vi.fn();
    render(<VehicleForm open onClose={vi.fn()} onSave={onSave} errors={{}} setErrors={setErrors}
      extraData={{
        units: [{ id: 7, name: "M5-010", people: [{ id: "owner-1", name: "Ana" }] }],
        vehicleColors: [{ id: "Azul marino", name: "Azul marino" }],
      }} />);
    fireEvent.change(screen.getByLabelText("dpto_id"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("owner_id"), { target: { value: "owner-1" } });
    fireEvent.change(screen.getByLabelText("plate"), { target: { value: "abc123" } });
    fireEvent.change(screen.getByLabelText("color"), { target: { value: "Azul marino" } });
    fireEvent.click(screen.getByRole("button", { name: "Subir foto" }));
    expect(screen.getByLabelText("plate")).toHaveValue("ABC123");
    fireEvent.click(screen.getByRole("button", { name: "Registrar vehículo" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      kind: "resident", plate: "ABC123", dpto_id: "7", owner_id: "owner-1",
      color: "Azul marino", images: ["https://example.org/pet.jpg"],
    }), setErrors);
    expect(screen.queryByLabelText("kind")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("visitor_name")).not.toBeInTheDocument();
  });

  it("carga un vehículo para editarlo y conserva la placa en mayúsculas desde el input", () => {
    const onSave = vi.fn();
    const setErrors = vi.fn();
    render(<VehicleForm open item={{ id: 12, kind: "resident", vehicle_type: "car", plate: "abc123", dpto_id: "7",
      images: ["https://example.org/vehicle.jpg"], color: "Plateado" }}
      onClose={vi.fn()} onSave={onSave} errors={{}} setErrors={setErrors}
      extraData={{ units: [{ id: 7, name: "M5-010", people: [] }] }} />);
    expect(screen.getByRole("heading", { name: "Editar vehículo" })).toBeInTheDocument();
    expect(screen.getByLabelText("plate")).toHaveValue("ABC123");
    fireEvent.change(screen.getByLabelText("plate"), { target: { value: "xyz789" } });
    expect(screen.getByLabelText("plate")).toHaveValue("XYZ789");
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 12, kind: "resident", plate: "XYZ789", dpto_id: "7",
      color: "Plateado", images: ["https://example.org/vehicle.jpg"],
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

  it("muestra fotografías en el detalle solo cuando existen", () => {
    const { rerender } = render(<VehicleView open item={{ id: 12, plate: "ABC123", images: [] }}
      onClose={vi.fn()} onEdit={vi.fn()} onDel={vi.fn()} />);
    expect(screen.queryByText("Fotografías")).not.toBeInTheDocument();
    rerender(<VehicleView open item={{ id: 12, plate: "ABC123", images: ["https://example.org/vehicle.jpg"] }}
      onClose={vi.fn()} onEdit={vi.fn()} onDel={vi.fn()} />);
    expect(screen.getByText("Fotografías")).toBeInTheDocument();
    expect(screen.getByAltText("Vehículo ABC123, fotografía 1")).toBeInTheDocument();
  });

});
