import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm";

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: mocks.showToast }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, disabled, onSave }: any) => (
    <section>
      <button disabled={disabled} onClick={onSave} type="button">
        Guardar
      </button>
      {children}
    </section>
  ),
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ disabled, error, label, name, onBlur, onChange, onKeyDown, value }: any) => (
    <label>
      {label}
      <input
        aria-label={label}
        disabled={disabled}
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        onKeyDown={onKeyDown}
        value={value ?? ""}
      />
      {error?.[name] && <span>{error[name]}</span>}
    </label>
  ),
}));

vi.mock("@/mk/components/forms/InputFullName/InputFullName", () => ({
  default: ({ disabled, errors, onChange, value }: any) => (
    <>
      {[
        ["name", "Primer nombre"],
        ["last_name", "Apellido paterno"],
        ["middle_name", "Segundo nombre"],
        ["mother_last_name", "Apellido materno"],
      ].map(([name, label]) => (
        <label key={name}>
          {label}
          <input
            aria-label={label}
            disabled={disabled}
            name={name}
            onChange={onChange}
            value={value[name] ?? ""}
          />
          {errors?.[name] && <span>{errors[name]}</span>}
        </label>
      ))}
    </>
  ),
}));

vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({
  default: ({ error, label, name, onChange, value }: any) => (
    <label>
      {label}
      <textarea
        aria-label={label}
        name={name}
        onChange={onChange}
        value={value ?? ""}
      />
      {error?.[name] && <span>{error[name]}</span>}
    </label>
  ),
}));

vi.mock("@/mk/components/forms/UploadFileSingle/UploadFileSingle", () => ({
  default: ({ onUploadStateChange }: any) => (
    <button onClick={() => onUploadStateChange?.(true)} type="button">
      Simular subida
    </button>
  ),
}));

const renderForm = (execute: any, item: Record<string, any> = {}) =>
  render(
    <RenderForm
      execute={execute}
      item={{
        ci: "CI-100",
        name: "Ana",
        last_name: "Pérez",
        email: "guardias@condaty.test",
        ...item,
      }}
      onClose={vi.fn()}
      open
      reLoad={vi.fn()}
    />,
  );

describe("RenderForm de Guardias", () => {
  it("permite guardar con segundo nombre y apellido materno vacíos, incluso si el correo ya existe", async () => {
    const execute = vi.fn().mockResolvedValue({
      data: { success: true, message: "Registro creado con éxito" },
    });

    renderForm(execute, { middle_name: "", mother_last_name: "" });

    fireEvent.blur(screen.getByLabelText("Correo electrónico"));
    expect(execute).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(execute).toHaveBeenCalledWith(
        "/guards",
        "POST",
        expect.objectContaining({
          email: "guardias@condaty.test",
          middle_name: "",
          mother_last_name: "",
        }),
        false,
        true,
      );
    });
  });

  it("no envía el POST cuando el CI ya está vinculado al condominio actual", async () => {
    const execute = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: { data: { id: "guard-1", ci: "CI-100", existCondo: true } },
      },
    });

    renderForm(execute, { ci: "" });

    const ciInput = screen.getByLabelText("Carnet de identidad");
    fireEvent.change(ciInput, { target: { name: "ci", value: "CI-100" } });
    fireEvent.blur(ciInput);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("bloquea el guardado mientras la foto sigue subiendo", () => {
    const execute = vi.fn();

    renderForm(execute);
    fireEvent.click(screen.getByRole("button", { name: "Simular subida" }));

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });
});
