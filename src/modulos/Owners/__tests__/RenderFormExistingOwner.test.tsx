import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";

const mocks = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: mocks.showToast }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children, onSave, buttonText, disabled }: any) =>
    open ? (
      <section>
        {children}
        <button type="button" onClick={onSave} disabled={disabled}>
          {buttonText}
        </button>
      </section>
    ) : null,
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ label, name, value, onChange, onBlur, disabled }: any) => (
    <label>
      {label}
      <input
        aria-label={label}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
      />
    </label>
  ),
}));

vi.mock("@/mk/components/forms/InputFullName/InputFullName", () => ({
  default: () => null,
}));

vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ label }: any) => <div>{label}</div>,
}));

describe("alta administrativa de residentes existentes", () => {
  it("permite activar y asignar un preregistro del mismo condominio", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            data: {
              id: "owner-1",
              ci: "76001002",
              name: "Ana",
              last_name: "Pérez",
              email: "ana@example.test",
              phone: "70000000",
              account_status: "W",
              current_membership: { status: "W", type: "H" },
              existCondo: true,
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: { success: true, message: "Registro creado con éxito" },
      });
    const reLoad = vi.fn();
    const onClose = vi.fn();

    render(
      <RenderForm
        open
        onClose={onClose}
        item={{
          ci: "",
          name: "",
          last_name: "",
          type_owner: "Propietario",
          dptos: [{ dpto_id: 12, dpto_nro: "A-12" }],
        }}
        setItem={vi.fn()}
        execute={execute}
        extraData={{ dptosForH: [{ id: 12, nro: "A-12" }] }}
        reLoad={reLoad}
        disableUnitEditing
        disableTypeEditing
      />,
    );

    const ciInput = screen.getByLabelText("Carnet de Identidad");
    fireEvent.change(ciInput, { target: { name: "ci", value: "76001002" } });
    fireEvent.blur(ciInput);

    const activateButton = await screen.findByRole("button", {
      name: "Activar y asignar",
    });
    expect(activateButton).toBeEnabled();
    expect(
      screen.getByText(/Se conservarán sus datos y contraseña/),
    ).toBeInTheDocument();

    fireEvent.click(activateButton);

    await waitFor(() => {
      expect(execute).toHaveBeenLastCalledWith(
        "/owners",
        "POST",
        expect.objectContaining({
          ci: "76001002",
          dpto: [12],
          is_homeowner: "Y",
        }),
        true,
      );
    });
    expect(reLoad).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
