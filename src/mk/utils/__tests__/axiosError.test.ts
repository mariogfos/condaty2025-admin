import { describe, expect, it } from "vitest";
import { getRequestErrorMessage, toSafeAxiosError } from "../axiosError";

describe("axiosError", () => {
  it("prioriza el mensaje del endpoint", () => {
    expect(
      getRequestErrorMessage({
        status: 422,
        data: { message: "El CI ya existe." },
      }),
    ).toBe("El CI ya existe.");
  });

  it("mantiene el mensaje específico de la operación si no hay un error de transporte", () => {
    expect(getRequestErrorMessage(null, "No se pudo guardar el guardia.")).toBe(
      "No se pudo guardar el guardia.",
    );
  });

  it("no incluye el payload sensible del request en el log", () => {
    const safeError = toSafeAxiosError({
      message: "Request failed",
      config: {
        method: "post",
        url: "/adm-login",
        data: { password: "secreto" },
      },
      response: { status: 401, data: { message: "No autenticado." } },
    });

    expect(safeError).toEqual({
      message: "Request failed",
      status: 401,
      method: "post",
      url: "/adm-login",
      responseMessage: "No autenticado.",
    });
    expect(JSON.stringify(safeError)).not.toContain("secreto");
  });
});
