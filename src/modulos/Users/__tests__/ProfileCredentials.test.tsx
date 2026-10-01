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

vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ label, name, onChange, value, options }: any) => (
    <label>
      {label}
      <select aria-label={label} name={name} onChange={onChange} value={value ?? ""}>
        {options.map((option: any) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  ),
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
  role_id: 2,
};

const ProfileEditor = ({
  type = "owner",
  canChangeRole = false,
}: { type?: string; canChangeRole?: boolean }) => {
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
      url={type === "admin" ? "/users" : "/owners"}
      type={type}
      canChangeRole={canChangeRole}
      currentRoleId={2}
      roleOptions={[{ id: 2, name: "Operador" }, { id: 3, name: "Tesorero" }]}
    />
  );
};

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

  it("solo un perfil autorizado muestra y envía un rol cambiado", async () => {
    mocks.execute.mockResolvedValue({ data: { success: true } });
    const { rerender } = render(<ProfileEditor type="admin" />);
    expect(screen.queryByLabelText("Rol del condominio")).not.toBeInTheDocument();

    rerender(<ProfileEditor type="admin" canChangeRole />);
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Rol del condominio"), {
      target: { name: "role_id", value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(mocks.execute).toHaveBeenCalledWith(
        "/users/owner-1",
        "PUT",
        { role_id: "3" },
      );
    });
  });
});
