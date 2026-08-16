/**
 * Reemplaza al pin de texto "S128 pin: AxiosInstanceProvider baseURL viene de
 * NEXT_PUBLIC_API_URL" (CDT-46, corte 4), que sólo miraba que el string
 * `NEXT_PUBLIC_API_URL` estuviera escrito en el archivo.
 *
 * Se comprobó reponiendo el bug (hardcodear `http://localhost:8000/api` en
 * el provider): de 772 tests, el ÚNICO que se ponía rojo era ese pin. Como
 * era la única red, no se borra: se cambia por esto, que arma el provider y
 * mira el `baseURL` con el que quedó configurado el axios que usa toda la app.
 *
 * Por qué importa: si el baseURL se hardcodea, el build de producción sigue
 * pegándole a localhost y NADA carga. No lo ve tsc, no lo ve eslint, y en
 * local anda perfecto.
 */
import { describe, it, expect } from "vitest";
import { useContext } from "react";
import { render, screen } from "@testing-library/react";
import AxiosInstanceProvider, { AxiosContext } from "../AxiosInstanceProvider";

function MuestraElBaseUrl() {
  const { contextInstance } = useContext(AxiosContext);
  return (
    <>
      <span data-testid="base">{String(contextInstance?.defaults?.baseURL)}</span>
      <span data-testid="creds">
        {String(contextInstance?.defaults?.withCredentials)}
      </span>
    </>
  );
}

describe("AxiosInstanceProvider — de dónde sale el baseURL", () => {
  it("el baseURL del axios compartido es el de NEXT_PUBLIC_API_URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.condaty.test/api";
    render(
      <AxiosInstanceProvider>
        <MuestraElBaseUrl />
      </AxiosInstanceProvider>,
    );
    expect(screen.getByTestId("base").textContent).toBe(
      "https://api.condaty.test/api",
    );
  });

  it("si cambia el env, cambia el baseURL (no quedó hardcodeado)", () => {
    // Dos valores distintos: un hardcode pasa el primer caso por casualidad
    // si alguien elige justo esa URL, pero no puede pasar los dos.
    process.env.NEXT_PUBLIC_API_URL = "https://otro.condaty.test/api";
    render(
      <AxiosInstanceProvider>
        <MuestraElBaseUrl />
      </AxiosInstanceProvider>,
    );
    expect(screen.getByTestId("base").textContent).toBe(
      "https://otro.condaty.test/api",
    );
  });

  it("un config.baseURL explícito del parent gana (back-compat)", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.condaty.test/api";
    render(
      <AxiosInstanceProvider config={{ baseURL: "https://fijo.test/api" }}>
        <MuestraElBaseUrl />
      </AxiosInstanceProvider>,
    );
    expect(screen.getByTestId("base").textContent).toBe("https://fijo.test/api");
  });

  it("manda las credenciales: el back tiene supports_credentials", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.condaty.test/api";
    render(
      <AxiosInstanceProvider>
        <MuestraElBaseUrl />
      </AxiosInstanceProvider>,
    );
    expect(screen.getByTestId("creds").textContent).toBe("true");
  });
});
