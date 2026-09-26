import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClientOwnerStatus, OwnerStatus } from "@/modulos/Payments/Type/PaymentType";
import RenderForm from "../RenderForm/RenderForm";

vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ showToast: vi.fn() }) }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children, buttonText }: any) =>
    open ? (
      <section>
        {children}
        <button type="button">{buttonText}</button>
      </section>
    ) : null,
}));
vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ label, name, value, onChange, onBlur, error }: any) => (
    <label>
      {label}
      <input aria-label={label} name={name} value={value ?? ""} onChange={onChange} onBlur={onBlur} />
      {error?.[name] ? <span>{error[name]}</span> : null}
    </label>
  ),
}));
vi.mock("@/mk/components/forms/InputFullName/InputFullName", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/Select/Select", () => ({ default: ({ label }: any) => <div>{label}</div> }));

const buscarCi = async (persona: Record<string, unknown>) => {
  const execute = vi.fn().mockResolvedValue({
    data: { success: true, data: { data: { id: "owner-1", ci: "76001002", name: "Ana", last_name: "Pérez", ...persona } } },
  });
  render(<RenderForm open onClose={vi.fn()} item={{ ci: "", name: "", last_name: "" }} setItem={vi.fn()} execute={execute} extraData={{}} reLoad={vi.fn()} />);
  const ci = screen.getByLabelText("Carnet de Identidad");
  fireEvent.change(ci, { target: { name: "ci", value: "76001002" } });
  fireEvent.blur(ci, { target: { value: "76001002" } });
  await waitFor(() => expect(execute).toHaveBeenCalled());
};

describe("el alta con un CI que ya existe en el condominio", () => {
  it("un prerregistrado no se bloquea: se ofrece activarlo y asignarlo", async () => {
    await buscarCi({
      account_status: OwnerStatus.WAITING,
      current_membership: { status: ClientOwnerStatus.WAITING },
      existCondo: true,
    });

    expect(await screen.findByText("Activar y asignar")).toBeInTheDocument();
    expect(screen.queryByText(/ya está en uso en este Condominio/)).not.toBeInTheDocument();
    expect(screen.getByText("La contraseña actual se conservará sin cambios.")).toBeInTheDocument();
  });

  it("un residente activo del condominio puede recibir otra unidad", async () => {
    await buscarCi({
      account_status: OwnerStatus.ACTIVE,
      current_membership: { status: ClientOwnerStatus.ACTIVE },
      existCondo: true,
    });

    expect(await screen.findByText(/Cuenta existente/)).toBeInTheDocument();
    expect(screen.getByText("Guardar")).toBeInTheDocument();
    expect(screen.queryByText(/ya está en uso en este Condominio/)).not.toBeInTheDocument();
  });
});
