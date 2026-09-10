import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";

const showToast = vi.fn();
const guardarLaConfigDelQr = vi.fn();

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast }),
}));

/**
 * El doble de la sección de QR expone el MISMO handle que la real: el
 * formulario padre la llama por `ref` después de guardar la cuenta.
 */
vi.mock("@/modulos/QrDinamico/QrAccountConfig/QrAccountConfig", async () => {
  const React = await import("react");
  return {
    default: React.forwardRef(function QrAccountConfigDoble(_props: any, ref: any) {
      React.useImperativeHandle(ref, () => ({ save: guardarLaConfigDelQr }));
      return React.createElement("div", { "data-testid": "qr-config" });
    }),
  };
});

/** `DataModal` reducido a lo que este test mide: el botón de guardar. */
vi.mock("@/mk/components/ui/DataModal/DataModal", async () => {
  const React = await import("react");
  return {
    default: ({ open, children, onSave, title }: any) =>
      open
        ? React.createElement(
            "div",
            null,
            React.createElement("h2", null, title),
            children,
            React.createElement(
              "button",
              { onClick: onSave, "data-testid": "guardar" },
              "Guardar",
            ),
          )
        : null,
  };
});

const LA_CUENTA = {
  id: 7,
  bank_entity_id: 1,
  currency_type_id: 1,
  account_number: "123",
  holder: "Titular",
  ci_holder: "1234567",
  alias_holder: "Cuenta",
  images: "una-imagen.png",
  initial_amount: 0,
};

const montar = (execute: any, reLoad = vi.fn(), onClose = vi.fn()) => {
  render(
    <RenderForm
      open
      onClose={onClose}
      item={LA_CUENTA}
      execute={execute}
      extraData={{ bankEntities: [], currencyTypes: [] }}
      reLoad={reLoad}
    />,
  );
  return { reLoad, onClose };
};

describe("El formulario de la cuenta bancaria", () => {
  beforeEach(() => {
    showToast.mockReset();
    guardarLaConfigDelQr.mockReset();
    guardarLaConfigDelQr.mockResolvedValue(true);
  });

  /**
   * 🔴 UN SOLO botón guarda las dos cosas.
   *
   * La configuración del QR vive detrás de su propio endpoint —el CRUD de
   * cuentas descarta esos campos—, pero eso es un detalle del backend. Dos
   * botones de guardar en un mismo modal es una pregunta que el usuario no
   * tiene por qué contestar.
   */
  it("guarda la cuenta y la configuracion del QR con un solo boton", async () => {
    const execute = vi.fn().mockResolvedValue({
      data: { success: true, message: "Cuenta guardada" },
    });
    const { onClose } = montar(execute);

    screen.getByTestId("guardar").click();

    await waitFor(() => expect(guardarLaConfigDelQr).toHaveBeenCalledTimes(1));
    expect(execute).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(showToast).toHaveBeenCalledWith("Cuenta guardada", "success");
  });

  /**
   * 🔴 El orden importa: la cuenta primero.
   *
   * En un alta no hay id contra el cual guardar la configuración hasta que la
   * cuenta existe.
   */
  it("guarda la cuenta ANTES que la configuracion del QR", async () => {
    const orden: string[] = [];
    const execute = vi.fn().mockImplementation(async () => {
      orden.push("cuenta");
      return { data: { success: true, message: "ok" } };
    });
    guardarLaConfigDelQr.mockImplementation(async () => {
      orden.push("qr");
      return true;
    });

    montar(execute);
    screen.getByTestId("guardar").click();

    await waitFor(() => expect(orden).toEqual(["cuenta", "qr"]));
  });

  /**
   * 🔴🔴 Si la configuración del QR falla, el modal QUEDA ABIERTO.
   *
   * Cerrarlo igual diría «guardado» sobre una configuración que no entró, y el
   * operador se enteraría el día del primer cobro.
   */
  it("si la configuracion del QR falla no cierra ni dice que guardo", async () => {
    const execute = vi.fn().mockResolvedValue({
      data: { success: true, message: "Cuenta guardada" },
    });
    guardarLaConfigDelQr.mockResolvedValue(false);

    const { onClose, reLoad } = montar(execute);
    screen.getByTestId("guardar").click();

    await waitFor(() => expect(guardarLaConfigDelQr).toHaveBeenCalled());

    expect(onClose).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalledWith("Cuenta guardada", "success");
    // La cuenta SÍ se guardó: el listado tiene que reflejarlo igual.
    expect(reLoad).toHaveBeenCalled();
  });

  /** Si falla la cuenta, ni se intenta la configuración del QR. */
  it("si falla la cuenta no toca la configuracion del QR", async () => {
    const execute = vi.fn().mockResolvedValue({
      data: { success: false, message: "número repetido" },
    });

    const { onClose } = montar(execute);
    screen.getByTestId("guardar").click();

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("número repetido", "error"),
    );
    expect(guardarLaConfigDelQr).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
