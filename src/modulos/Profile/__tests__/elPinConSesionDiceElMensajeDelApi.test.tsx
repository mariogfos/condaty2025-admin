/**
 * 🔴 El PIN con sesión (cambiar correo o contraseña) ante un 429 del `throttle`.
 *
 * `adm-getpin`, `adm-setemail` y `adm-setpass` responden con HTTP 429 y el
 * sobre del proyecto pasado el límite (10 pedidos cada 15 minutos por cuenta).
 * `useAxios` devuelve eso con `data: null` y el sobre en `error.data`. La
 * pantalla leía `data.message` a secas: al validar el código y al guardar el
 * cambio TIRABA una excepción y no se veía nada; al pedir el código mostraba el
 * texto de axios, en inglés.
 */
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "@/i18n/messages";

vi.mock("@/i18n/useScopedI18n", () => ({
  useScopedI18n: () => ({
    translate: (key: string) =>
      (messages.es.auth as Record<string, string>)[key] ?? key,
  }),
}));

import Authentication from "../Authentication";

const THROTTLED = "Demasiados intentos. Intente de nuevo en 15 minutos.";

/** Lo que devuelve `useAxios.execute` ante un 429: `data` en null. */
const throttled = async () => ({
  data: null,
  error: {
    message: "Request failed with status code 429",
    status: 429,
    data: { success: false, message: THROTTLED, errors: [] },
  },
});

afterEach(() => cleanup());

const renderStep = (formState: Record<string, any>) => {
  const showToast = vi.fn();
  const setErrors = vi.fn();
  render(
    <Authentication
      open
      onClose={() => {}}
      formState={formState}
      setFormState={() => {}}
      errors={{}}
      execute={vi.fn(throttled)}
      showToast={showToast}
      setErrors={setErrors}
      getUser={() => {}}
      type="P"
      user={{ email: "admin@condaty.com" }}
    />,
  );
  return { showToast, setErrors };
};

const press = async (label: string) => {
  await act(async () => {
    fireEvent.click(screen.getByText(label, { selector: "button, button *" }));
  });
};

describe("el PIN con sesión del admin ante un 429", () => {
  it("pedir el código muestra el mensaje del API, no el de axios", async () => {
    const { showToast } = renderStep({ pinned: 0 });
    await press("Obtener código");

    expect(showToast).toHaveBeenCalledWith(THROTTLED, "error");
    expect(JSON.stringify(showToast.mock.calls)).not.toContain("Request failed");
  });

  it("validar el código muestra el mensaje del API y no tira", async () => {
    const { showToast, setErrors } = renderStep({ pinned: 1, code: "1234" });
    await press("Continuar");

    expect(showToast).toHaveBeenCalledWith(THROTTLED, "error");
    expect(setErrors).toHaveBeenLastCalledWith({});
  });

  it("guardar la contraseña muestra el mensaje del API y no tira", async () => {
    const { showToast } = renderStep({
      pinned: 2,
      code: "1234",
      password: "Secreta123",
      passwordRepeat: "Secreta123",
    });
    await press("Cambiar contraseña");

    expect(showToast).toHaveBeenCalledWith(THROTTLED, "error");
  });
});
