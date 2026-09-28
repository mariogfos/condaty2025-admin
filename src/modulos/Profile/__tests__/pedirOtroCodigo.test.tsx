/**
 * «Pedir otro código» en el paso del código del cambio de correo o contraseña.
 *
 * A los 5 PIN incorrectos el API borra el código y contesta «Pin no válido»,
 * igual que a un error suelto: sin este link la única salida era cerrar el
 * modal y volver a abrirlo. La espera entre pedidos protege el cupo del
 * `throttle` (`pin-session`: 10 cada 15 minutos por cuenta).
 */
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { messages } from "@/i18n/messages";

vi.mock("@/i18n/useScopedI18n", () => ({
  useScopedI18n: () => ({
    translate: (key: string, values?: Record<string, any>) =>
      String((messages.es.auth as Record<string, string>)[key] ?? key).replace(
        /\{(\w+)\}/g,
        (_: string, k: string) => String(values?.[k] ?? `{${k}}`),
      ),
  }),
}));

import Authentication from "../Authentication";

const THROTTLED = "Demasiados intentos. Intente de nuevo en 15 minutos.";
const { requestNewCode, newCodeSent } = messages.es.auth;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const renderCodeStep = (execute: ReturnType<typeof vi.fn>) => {
  const props = {
    showToast: vi.fn(),
    setFormState: vi.fn(),
    setErrors: vi.fn(),
  };
  render(
    <Authentication
      open
      onClose={() => {}}
      formState={{ pinned: 1, code: "9999", newEmail: "nuevo@condaty.com" }}
      errors={{ code: "Pin no válido" }}
      execute={execute}
      getUser={() => {}}
      type="M"
      user={{ email: "admin@condaty.com" }}
      {...props}
    />,
  );
  return props;
};

const link = () => screen.getByText(/Pedir otro código/) as HTMLButtonElement;

/** Un segundo por `act`: cada tic agenda el siguiente recién al re-renderizar. */
const waitCountdown = async () => {
  for (let second = 0; second < 60; second++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
  }
};

describe("pedir otro código", () => {
  it("la espera lo deshabilita y al terminar lo habilita", async () => {
    renderCodeStep(vi.fn());

    expect(link().disabled).toBe(true);
    expect(link().textContent).toMatch(/en 0:\d\d/);

    await waitCountdown();

    expect(link().disabled).toBe(false);
    expect(link().textContent).toBe(requestNewCode);
  });

  it("pide el código de nuevo, avisa, limpia el código y el error, y vuelve a esperar", async () => {
    const execute = vi.fn(async () => ({
      data: { success: true, message: "PIN enviado" },
      error: null,
    }));
    const { showToast, setFormState, setErrors } = renderCodeStep(execute);
    await waitCountdown();

    await act(async () => {
      fireEvent.click(link());
    });

    expect(execute).toHaveBeenCalledWith("/v3/adm-getpin", "POST", { type: "email" });
    expect(showToast).toHaveBeenCalledWith(newCodeSent, "success");
    expect(setFormState).toHaveBeenCalledWith(
      expect.objectContaining({ pinned: 1, code: "", newEmail: "nuevo@condaty.com" }),
    );
    expect(setErrors).toHaveBeenLastCalledWith({});
    expect(link().disabled).toBe(true);
  });

  it("un 429 al pedirlo muestra el mensaje del API", async () => {
    const execute = vi.fn(async () => ({
      data: null,
      error: {
        message: "Request failed with status code 429",
        status: 429,
        data: { success: false, message: THROTTLED, errors: [] },
      },
    }));
    const { showToast } = renderCodeStep(execute);
    await waitCountdown();

    await act(async () => {
      fireEvent.click(link());
    });

    expect(showToast).toHaveBeenCalledWith(THROTTLED, "error");
  });
});
