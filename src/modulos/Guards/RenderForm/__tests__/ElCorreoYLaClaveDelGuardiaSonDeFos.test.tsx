import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm";

/**
 * El correo y la clave de un guardia los cambia SÓLO FOS.
 *
 * Un guardia es una sola cuenta para todos los condominios donde trabaja, y el
 * API ignora esos campos si no los manda FOS. Antes de esto el formulario
 * dejaba al ADM editar el correo: lo cambiaba, veía «guardado» y no pasaba
 * nada. Producción: `6724c41a`.
 */
const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  user: {} as Record<string, unknown>,
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: mocks.showToast, user: mocks.user }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, onSave }: any) => (
    <section>
      {children}
      <button onClick={onSave} type="button">
        Guardar
      </button>
    </section>
  ),
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ label, name, onChange, value, disabled }: any) => (
    <label>
      {label}
      <input
        aria-label={label}
        name={name}
        onChange={onChange}
        value={value ?? ""}
        disabled={disabled}
      />
    </label>
  ),
}));

vi.mock("@/mk/components/forms/InputFullName/InputFullName", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/forms/UploadFileSingle/UploadFileSingle", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: () => null,
}));

const guardia = {
  id: "guard-1",
  ci: "1234567",
  name: "Juan",
  last_name: "Pérez",
  email: "juan@condaty.test",
  phone: "70000000",
  address: "Calle 1",
};

const abrir = (execute = vi.fn()) =>
  render(
    <RenderForm
      open
      onClose={vi.fn()}
      item={guardia}
      execute={execute}
      reLoad={vi.fn()}
    />,
  );

describe("RenderForm de Guardias — credenciales", () => {
  beforeEach(() => {
    mocks.user = {};
    vi.clearAllMocks();
  });

  it("al ADM le deja el correo bloqueado y no le ofrece la clave", () => {
    mocks.user = { fosrole_id: null };
    abrir();

    expect(screen.getByLabelText("Correo electrónico")).toBeDisabled();
    expect(screen.queryByLabelText("Nueva contraseña")).not.toBeInTheDocument();
  });

  it("FOS edita el correo y manda la clave nueva", async () => {
    mocks.user = { fosrole_id: 1 };
    const execute = vi
      .fn()
      .mockResolvedValue({ data: { success: true, message: "ok" } });
    abrir(execute);

    expect(screen.getByLabelText("Correo electrónico")).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { name: "password", value: "NuevaClave8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(execute).toHaveBeenCalledWith(
        "/v3/guards/guard-1",
        "PUT",
        expect.objectContaining({ password: "NuevaClave8" }),
      ),
    );
  });

  it("FOS no manda una clave de menos de ocho", async () => {
    mocks.user = { fosrole_id: 1 };
    const execute = vi.fn();
    abrir(execute);

    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { name: "password", value: "corta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await new Promise((r) => setTimeout(r, 0));
    expect(execute).not.toHaveBeenCalledWith(
      "/v3/guards/guard-1",
      "PUT",
      expect.anything(),
    );
  });
});
