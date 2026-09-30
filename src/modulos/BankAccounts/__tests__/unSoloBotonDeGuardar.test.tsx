import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";
import { BankAccountType } from "../Type/BankType";

const showToast = vi.fn();
const guardarLaConfigDelQr = vi.fn();

/** El equipo de Condaty: el único al que el API le deja configurar el QR. */
const EQUIPO_CONDATY = { id: 1, type: "ADM", fosrole_id: 3 };
/** Un administrador de condominio: `fosrole_id` vacío. */
const ADM_DEL_CONDOMINIO = { id: 2, type: "ADM", fosrole_id: null };

let usuario: Record<string, unknown> = EQUIPO_CONDATY;

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast, user: usuario }),
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
  images: ["https://res.cloudinary.com/condaty/qr-de-la-cuenta.png"],
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
    usuario = EQUIPO_CONDATY;
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

  /**
   * 🔴 Lo que viaja es lo que valida `BankAccountStoreRequest` del API, y nada
   * más: los `qr_dynamic_*` tienen su propia puerta (el CRUD de cuentas los
   * descarta), y `is_main`/`is_reserve`/`is_expense` los escribe Configuración.
   * `images` va como array de URLs (`images.*` es `url`).
   */
  it("la edicion manda al API las claves que valida, contra la cuenta", async () => {
    const execute = vi.fn().mockResolvedValue({
      data: { success: true, message: "ok" },
    });
    montar(execute);

    screen.getByTestId("guardar").click();

    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    expect(execute).toHaveBeenCalledWith("/v3/bank-accounts/7", "PUT", {
      images: ["https://res.cloudinary.com/condaty/qr-de-la-cuenta.png"],
      bank_entity_id: 1,
      account_type: BankAccountType.SAVINGS,
      account_number: "123",
      currency_type_id: 1,
      holder: "Titular",
      ci_holder: "1234567",
      alias_holder: "Cuenta",
      initial_amount: 0,
    });
  });
});

/**
 * 🔴🔴 La sección del QR es SÓLO del equipo de Condaty.
 *
 * El API decide con `BankAccountPolicy::configureQrDinamico` —usuario `ADM` con
 * `fosrole_id`— y le contesta 403 a cualquier otro, en la lectura y en la
 * escritura. Dibujarla para un administrador de condominio es ofrecerle un 403:
 * el encabezado «QR Dinámico» aparecía mientras cargaba y desaparecía después.
 */
describe("La seccion del QR dinamico en la edicion de la cuenta", () => {
  beforeEach(() => {
    showToast.mockReset();
    guardarLaConfigDelQr.mockReset();
    guardarLaConfigDelQr.mockResolvedValue(true);
  });

  it("se muestra al equipo de Condaty", () => {
    usuario = EQUIPO_CONDATY;
    montar(vi.fn());

    expect(screen.getByTestId("qr-config")).toBeInTheDocument();
  });

  it("no se dibuja para un administrador de condominio", () => {
    usuario = ADM_DEL_CONDOMINIO;
    montar(vi.fn());

    expect(screen.queryByTestId("qr-config")).toBeNull();
  });

  /** Sin la sección, guardar la cuenta no depende de ella: cierra y avisa. */
  it("un administrador de condominio guarda la cuenta igual", async () => {
    usuario = ADM_DEL_CONDOMINIO;
    const execute = vi.fn().mockResolvedValue({
      data: { success: true, message: "Cuenta guardada" },
    });
    const { onClose } = montar(execute);

    screen.getByTestId("guardar").click();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(guardarLaConfigDelQr).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Cuenta guardada", "success");
  });

  /** En el alta no hay id contra el cual guardarla: aparece al reabrir. */
  it("no aparece en el alta, ni para el equipo de Condaty", () => {
    usuario = EQUIPO_CONDATY;
    render(
      <RenderForm
        open
        onClose={vi.fn()}
        item={{}}
        execute={vi.fn()}
        extraData={{ bankEntities: [], currencyTypes: [] }}
        reLoad={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("qr-config")).toBeNull();
  });
});
