import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrProviders from "../QrProviders/QrProviders";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

const PROVEEDOR = {
  id: "bank-1",
  bank_code: "BG",
  bank_name: "Banco Ganadero",
  is_active: true,
  base_url: "https://api.bg.test/prod",
  sandbox_base_url: "https://api.bg.test/qa",
  webhook_username: "condaty",
  has_webhook_password: true,
  pending_orders: 0,
};

/** Doble fiel: un 2xx llega en res.data, un no-2xx en res.error.data. */
const ok = (data: any, message = "") => ({
  data: { success: true, data, message },
  error: null,
});

const listar = (proveedores: any[] = [PROVEEDOR]) =>
  executeMock.mockImplementation(async (url?: string, method?: string) => {
    if (String(method) === "PUT") return ok(proveedores[0]);
    return ok(proveedores);
  });

const esperarCargado = async () =>
  waitFor(() => expect(screen.getByText("BG")).toBeInTheDocument());

const escribir = (label: RegExp, texto: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value: texto } });
};

const guardar = () =>
  fireEvent.click(screen.getByRole("button", { name: /Guardar/i }));

const ultimoPut = () =>
  executeMock.mock.calls.filter((c) => String(c[1]) === "PUT").at(-1);

describe("QrProviders", () => {
  beforeEach(() => executeMock.mockReset());

  it("no muestra la contraseña ni su hash, sólo si está configurada", async () => {
    listar();
    render(<QrProviders />);
    await esperarCargado();

    expect(screen.getByText("Contraseña configurada")).toBeInTheDocument();
    // El campo de contraseña arranca vacío: no hay nada del valor guardado
    expect(
      (screen.getByLabelText(/Contraseña nueva/i) as HTMLInputElement).value,
    ).toBe("");
  });

  it("una contraseña vacía no viaja, para no borrar la guardada", async () => {
    listar();
    render(<QrProviders />);
    await esperarCargado();

    escribir(/^Nombre/i, "Banco Ganadero S.A.");
    guardar();

    await waitFor(() => expect(ultimoPut()).toBeTruthy());
    const cuerpo = ultimoPut()![2] as Record<string, unknown>;
    expect(cuerpo.bank_name).toBe("Banco Ganadero S.A.");
    expect(cuerpo).not.toHaveProperty("webhook_password");
  });

  it("manda la contraseña nueva cuando se escribe una", async () => {
    listar();
    render(<QrProviders />);
    await esperarCargado();

    escribir(/Contraseña nueva/i, "una-clave-larga-y-nueva");
    guardar();

    await waitFor(() => expect(ultimoPut()).toBeTruthy());
    expect((ultimoPut()![2] as any).webhook_password).toBe(
      "una-clave-larga-y-nueva",
    );
  });

  it("avisa los pagos en vuelo antes de apagar un proveedor", async () => {
    listar([{ ...PROVEEDOR, pending_orders: 3 }]);
    render(<QrProviders />);
    await esperarCargado();

    // Sin tocar nada el aviso no aparece: sólo importa al desactivar
    expect(screen.queryByText(/esperando pago/i)).toBeNull();

    // El Switch es un checkbox por dentro: se apaga con un click.
    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(screen.getByText(/3 QR esperando pago/i)).toBeInTheDocument(),
    );
  });

  it("muestra el mensaje del API cuando el guardado falla", async () => {
    executeMock.mockImplementation(async (url?: string, method?: string) => {
      if (String(method) === "PUT") {
        return {
          data: null,
          error: {
            status: 422,
            data: { message: "El usuario del webhook ya está en uso." },
          },
        };
      }
      return ok([PROVEEDOR]);
    });

    render(<QrProviders />);
    await esperarCargado();

    escribir(/Usuario del webhook/i, "otro");
    guardar();

    await waitFor(() =>
      expect(
        screen.getByText(/El usuario del webhook ya está en uso/),
      ).toBeInTheDocument(),
    );
  });
});
