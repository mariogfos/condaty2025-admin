import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrAccountConfig, {
  QrAccountConfigHandle,
} from "../QrAccountConfig/QrAccountConfig";
import { BankAccountStatus } from "../../BankAccounts/Type/BankType";

const executeMock = vi.fn();
const showToast = vi.fn();

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

/**
 * ⚠️ El sobre imita al del API **con fidelidad**: el estado es el enum
 * numérico, el banco es un número, los proveedores vienen DENTRO de la
 * configuración, y las credenciales no vienen nunca. Un doble que devolviera
 * un booleano o un uuid mediría a la rama `test`, no a este repo.
 */
const laConfiguracion = (extra: Record<string, unknown> = {}) => ({
  bank_account_id: 7,
  qr_dynamic_status: BankAccountStatus.ACTIVE,
  qr_dynamic_bank_id: 3,
  qr_dynamic_account_reference: "CTA-001",
  cobra_por_qr: true,
  has_credentials: true,
  qr_dynamic_username_masked: "c••••••y",
  qr_providers: [
    { id: 3, name: "Banco Ganadero", bank_code: "BG" },
    { id: 9, name: "Otro banco con QR", bank_code: "XX" },
  ],
  ...extra,
});

const elApiContesta = (config = laConfiguracion()) => {
  executeMock.mockImplementation(async (_url: string, method: string) =>
    method === "GET"
      ? { data: { success: true, data: config } }
      : { data: { success: true, message: "ok", data: config } },
  );
};

/** El `input[type=checkbox]` que el `Switch` compartido dibuja. */
const elInterruptor = (container: HTMLElement) =>
  container.querySelector(
    'input[name="qr_dynamic_status"]',
  ) as HTMLInputElement;

const yaCargo = () =>
  waitFor(() => expect(screen.getByText(/c••••••y/)).toBeInTheDocument());

describe("La configuración del QR de una cuenta bancaria", () => {
  beforeEach(() => {
    executeMock.mockReset();
    showToast.mockReset();
  });

  it("muestra el usuario enmascarado y no precarga ninguna credencial", async () => {
    elApiContesta();
    const { container } = render(<QrAccountConfig bankAccountId={7} />);
    await yaCargo();

    for (const campo of [
      "qr_dynamic_api_key",
      "qr_dynamic_username",
      "qr_dynamic_password",
    ]) {
      const input = container.querySelector(
        `input[name="${campo}"]`,
      ) as HTMLInputElement;
      expect(input, `falta el campo ${campo}`).toBeTruthy();
      expect(input.value, `${campo} llegó precargado`).toBe("");
    }
  });

  /**
   * 🔴 Con el QR apagado, los demás campos NO se dibujan.
   *
   * Ofrecer banco, referencia y credenciales sobre una cuenta que no cobra es
   * pedirle al operador que llene algo que no va a hacer nada.
   */
  it("con el interruptor apagado esconde el resto de los campos", async () => {
    elApiContesta();
    const { container } = render(<QrAccountConfig bankAccountId={7} />);
    await yaCargo();

    expect(
      container.querySelector('input[name="qr_dynamic_account_reference"]'),
    ).toBeTruthy();

    // ⚠️ Por CLICK y no por `change` con un value: el `Switch` compartido arma
    // su evento sintético desde `e.target.checked`, no desde el valor.
    fireEvent.click(elInterruptor(container));

    await waitFor(() =>
      expect(
        container.querySelector('input[name="qr_dynamic_account_reference"]'),
      ).toBeNull(),
    );
  });

  /**
   * 🔴🔴 Una credencial vacía NO viaja.
   *
   * El backend nunca las devuelve, así que el campo arranca en blanco. Si ese
   * blanco se mandara, cambiar la referencia de la cuenta **borraría la clave
   * del banco**, y el síntoma sería «el banco dejó de responder» días después.
   */
  it("guarda solo lo tocado, y una credencial vacía no viaja", async () => {
    elApiContesta();
    const ref = createRef<QrAccountConfigHandle>();
    const { container } = render(
      <QrAccountConfig ref={ref} bankAccountId={7} />,
    );
    await yaCargo();

    fireEvent.change(
      container.querySelector(
        'input[name="qr_dynamic_account_reference"]',
      ) as HTMLInputElement,
      { target: { name: "qr_dynamic_account_reference", value: "CTA-002" } },
    );

    // 🔴 El operador entra al campo de la clave, escribe y BORRA. Sin este
    // paso el campo nunca queda en el formulario y la guarda del vacío no se
    // ejecuta: el test pasaría igual con la guarda sacada.
    const clave = container.querySelector(
      'input[name="qr_dynamic_password"]',
    ) as HTMLInputElement;
    fireEvent.change(clave, {
      target: { name: "qr_dynamic_password", value: "algo" },
    });
    fireEvent.change(clave, {
      target: { name: "qr_dynamic_password", value: "" },
    });

    await ref.current!.save();

    const put = executeMock.mock.calls.find((c) => c[1] === "PUT");
    expect(put, "no se llamó al guardado").toBeTruthy();
    expect(put?.[2]).toEqual({ qr_dynamic_account_reference: "CTA-002" });
  });

  /** El interruptor viaja como el ENUM numérico, no como booleano. */
  it("el interruptor se guarda como el estado numerico de la cuenta", async () => {
    elApiContesta();
    const ref = createRef<QrAccountConfigHandle>();
    const { container } = render(
      <QrAccountConfig ref={ref} bankAccountId={7} />,
    );
    await yaCargo();

    fireEvent.click(elInterruptor(container));

    await ref.current!.save();

    const put = executeMock.mock.calls.find((c) => c[1] === "PUT");
    expect(put?.[2]).toEqual({
      qr_dynamic_status: BankAccountStatus.INACTIVE,
    });
  });

  /**
   * 🔴 Los proveedores vienen CON la configuración, en un solo pedido.
   *
   * Si el front los pidiera aparte, la lista que ofrece y la que el guardado
   * acepta serían dos definiciones distintas del mismo criterio — y la que se
   * desactualice deja al operador eligiendo un banco que después da 422.
   */
  it("no pide los proveedores por separado", async () => {
    elApiContesta();
    render(<QrAccountConfig bankAccountId={7} />);
    await yaCargo();

    const lecturas = executeMock.mock.calls.filter((c) => c[1] === "GET");
    expect(lecturas).toHaveLength(1);
    expect(lecturas[0][0]).toContain("/qr-dynamic/accounts/7/config");
  });

  /**
   * 🔴 Un 403 es el ÚNICO motivo para no dibujar nada: la configuración no le
   * corresponde a este usuario.
   */
  it("con un 403 no dibuja la seccion", async () => {
    executeMock.mockResolvedValue({ data: null, error: { status: 403 } });
    const { container } = render(<QrAccountConfig bankAccountId={7} />);

    await waitFor(() =>
      expect(container.querySelector("#qr-account-config")).toBeNull(),
    );
  });

  /**
   * 🔴🔴 Y cualquier OTRO fallo se muestra.
   *
   * Sin esta cara, un error de red se ve idéntico a un 403: la sección
   * desaparece y el operador concluye que esa cuenta no tiene QR.
   */
  it("un fallo que no es de permiso se muestra, no se calla", async () => {
    executeMock.mockResolvedValue({
      data: null,
      error: { status: 500, data: { message: "se cayó la base" } },
    });

    render(<QrAccountConfig bankAccountId={7} />);

    await waitFor(() =>
      expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/se cayó la base/)).toBeInTheDocument();
  });

  /** Si el guardado falla, el padre se entera: devuelve `false`. */
  it("avisa al formulario padre cuando el guardado falla", async () => {
    executeMock.mockImplementation(async (_url: string, method: string) =>
      method === "GET"
        ? { data: { success: true, data: laConfiguracion() } }
        : { data: null, error: { status: 422, data: { message: "falta el banco" } } },
    );

    const ref = createRef<QrAccountConfigHandle>();
    const { container } = render(
      <QrAccountConfig ref={ref} bankAccountId={7} />,
    );
    await yaCargo();

    fireEvent.change(
      container.querySelector(
        'input[name="qr_dynamic_account_reference"]',
      ) as HTMLInputElement,
      { target: { name: "qr_dynamic_account_reference", value: "CTA-002" } },
    );

    await expect(ref.current!.save()).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith("falta el banco", "error");
  });

  /** Sin nada tocado no se llama al API, y eso NO es un fallo. */
  it("sin cambios no llama al guardado y devuelve exito", async () => {
    elApiContesta();
    const ref = createRef<QrAccountConfigHandle>();
    render(<QrAccountConfig ref={ref} bankAccountId={7} />);
    await yaCargo();

    await expect(ref.current!.save()).resolves.toBe(true);
    expect(executeMock.mock.calls.some((c) => c[1] === "PUT")).toBe(false);
  });
});
