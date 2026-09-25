import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditProfile from "@/components/ProfileModal/EditProfile/EditProfile";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  showToast: vi.fn(),
  user: {},
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mocks.user, showToast: mocks.showToast }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: mocks.execute }),
}));

vi.mock("@/mk/components/ui/DetailModal/DetailModal", () => ({
  default: ({ children, onSave }: any) => (
    <section>
      {children}
      <button onClick={onSave} type="button">Guardar cambios</button>
    </section>
  ),
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ label, name, onChange, value }: any) => (
    <label>
      {label}
      <input aria-label={label} name={name} onChange={onChange} value={value ?? ""} />
    </label>
  ),
}));

vi.mock("@/mk/components/forms/UploadFileProfile/UploadFileProfile", () => ({
  default: () => null,
}));

const initialState = {
  id: "owner-1",
  ci: "1234567",
  name: "Ana",
  middle_name: "",
  last_name: "Pérez",
  mother_last_name: "",
  phone: "70000000",
  email: "ana@condaty.test",
  url_avatar: [],
};

const ProfileEditor = () => {
  const [formState, setFormState] = useState(initialState);
  const [errors, setErrors] = useState({});
  return (
    <EditProfile
      open
      onClose={vi.fn()}
      formState={formState}
      setFormState={setFormState}
      onChange={(event: any) =>
        setFormState((current) => ({ ...current, [event.target.name]: event.target.value }))
      }
      errors={errors}
      setErrors={setErrors}
      url="/owners"
      type="owner"
    />
  );
};

/**
 * La clave y el correo de un perfil los cambia SÓLO FOS.
 *
 * Residentes, guardias y usuarios son UNA cuenta para todos sus condominios, y
 * el API ignora esos dos campos si no los manda FOS (`181c2f24` en producción,
 * `LasCredencialesDeUnPerfilLasCambiaSoloFosTest` en el API). Este lado mide
 * que el admin no se los ofrezca a quien no puede usarlos, y que FOS sí los
 * mande. Viene de producción (`6724c41a`).
 */
describe("EditProfile — credenciales FOS", () => {
  beforeEach(() => {
    mocks.user = {};
    mocks.execute.mockReset();
    mocks.showToast.mockReset();
  });

  it("no muestra el cambio de credenciales a un administrador no FOS", () => {
    render(<ProfileEditor />);

    expect(screen.queryByLabelText("Correo electrónico")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nueva contraseña")).not.toBeInTheDocument();
  });

  it("un FOS envía la nueva contraseña sin revelar ni precargar la anterior", async () => {
    mocks.user = { fosrole_id: 1 };
    mocks.execute.mockResolvedValue({ data: { success: true } });
    render(<ProfileEditor />);

    const password = screen.getByLabelText("Nueva contraseña");
    expect(password).toHaveValue("");
    fireEvent.change(password, {
      target: { name: "password", value: "NuevaClave8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(mocks.execute).toHaveBeenCalledWith(
        "/owners/owner-1",
        "PUT",
        expect.objectContaining({
          email: "ana@condaty.test",
          password: "NuevaClave8",
        }),
      );
    });
  });
});
