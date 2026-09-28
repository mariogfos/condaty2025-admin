/**
 * 🔴 El 429 del `throttle` (api#676) tiene que decir SU mensaje.
 *
 * Las puertas sin sesión —login, PIN, olvidé mi contraseña— responden al pasar
 * el límite con HTTP 429 y el sobre del proyecto:
 * `{success:false, message:"Demasiados intentos. Intente de nuevo en N
 * minutos.", errors:[]}`. El admin mostraba «Datos incorrectos.», «Código
 * incorrecto…» o «No se pudo enviar el código…»: mandaba a reintentar justo
 * cuando reintentar alarga el bloqueo.
 *
 * El test pasa por la cadena entera —la instancia de axios rechaza, `useAxios`
 * guarda el sobre en `error.data`, `rejectionMessage` lo lee y la pantalla lo
 * pinta—, así que una rotura en cualquiera de los eslabones lo pone rojo.
 */
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { messages } from "@/i18n/messages";

const THROTTLED = "Demasiados intentos. Intente de nuevo en 15 minutos.";
const showToast = vi.fn();

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: null, getUser: vi.fn(), showToast }),
}));
vi.mock("@/mk/utils/logs", () => ({
  logError: vi.fn(),
  log: vi.fn(),
  logInfo: vi.fn(),
  logWaning: vi.fn(),
}));
vi.mock("@fingerprintjs/fingerprintjs", () => ({
  default: { load: async () => ({ get: async () => ({ visitorId: "fp" }) }) },
}));
vi.mock("next/image", () => ({
  default: (props: any) => <img alt={props.alt} />,
}));
vi.mock("@/components/req/Logo", () => ({ default: () => <div /> }));
vi.mock("@/i18n/useScopedI18n", () => ({
  useScopedI18n: () => ({
    locale: "es",
    translate: (key: string, values?: Record<string, any>) =>
      String((messages.es.auth as Record<string, string>)[key] ?? key).replace(
        /\{(\w+)\}/g,
        (_: string, k: string) => String(values?.[k] ?? `{${k}}`),
      ),
  }),
}));

import Login from "../Login";
import ForgotPass from "@/components/auth/ForgotPass";

/** Lo que axios rechaza ante un 429: su `message` es el texto en inglés. */
const throttled = () =>
  Promise.reject({
    message: "Request failed with status code 429",
    response: {
      status: 429,
      headers: { "retry-after": "900" },
      data: { success: false, message: THROTTLED, errors: [] },
    },
  });

const renderWith = (
  ui: React.ReactElement,
  request: (config: any) => Promise<any>,
) =>
  render(
    <AxiosContext.Provider
      value={
        {
          contextInstance: { request: vi.fn(request) },
          waiting: 0,
          setWaiting: () => {},
        } as any
      }
    >
      {ui}
    </AxiosContext.Provider>,
  );

const expectNoAxiosText = () => {
  expect(screen.queryByText(/Request failed/)).toBeNull();
  expect(JSON.stringify(showToast.mock.calls)).not.toContain("Request failed");
};

beforeAll(() => {
  process.env.NEXT_PUBLIC_AUTH_LOGIN = "/v3/adm-login";
});
afterEach(() => {
  cleanup();
  showToast.mockReset();
  localStorage.clear();
});

const submitLogin = async () => {
  fireEvent.change(document.querySelector('input[name="email"]')!, {
    target: { name: "email", value: "1234567" },
  });
  fireEvent.change(document.querySelector('input[name="password"]')!, {
    target: { name: "password", value: "Secreta123" },
  });
  await act(async () => {
    fireEvent.submit(document.querySelector("form")!);
  });
};

describe("el login del admin ante un 429", () => {
  it("muestra el mensaje del API, no «Datos incorrectos.»", async () => {
    renderWith(<Login />, throttled);
    await submitLogin();

    expect(await screen.findByText(THROTTLED)).toBeTruthy();
    expect(screen.queryByText(messages.es.auth.invalidCredentials)).toBeNull();
    expectNoAxiosText();
  });

  it("en el paso del PIN muestra el mensaje del API, no «Código incorrecto»", async () => {
    renderWith(<Login />, ({ url }) =>
      url === "/v3/adm-login"
        ? Promise.resolve({
            data: {
              success: false,
              message: "Se envió el PIN",
              errors: { device: "untrusted" },
            },
          })
        : throttled(),
    );
    await submitLogin();
    const verify = await screen.findByText(messages.es.auth.verify);

    await act(async () => {
      fireEvent.click(verify);
    });

    expect(await screen.findByText(THROTTLED)).toBeTruthy();
    expect(screen.queryByText(/Código incorrecto/)).toBeNull();
    expectNoAxiosText();
  });
});

describe("el «olvidé mi contraseña» del admin ante un 429", () => {
  it("getpinreset avisa con el mensaje del API", async () => {
    renderWith(<ForgotPass open setOpen={() => {}} mod="adm" />, throttled);
    // Sin `pinned` el modal arranca en el paso del CI.
    const ci = await waitFor(() => {
      const input = document.querySelector('input[name="ci"]');
      expect(input).toBeTruthy();
      return input!;
    });
    fireEvent.change(ci, { target: { name: "ci", value: "1234567" } });
    await act(async () => {
      fireEvent.click(screen.getByText(messages.es.auth.getCode));
    });

    await waitFor(() => expect(showToast).toHaveBeenCalledWith(THROTTLED, "error"));
    expectNoAxiosText();
  });
});
