import { describe, expect, it } from "vitest";
import { errorForTheConsole } from "../useAxios";

describe("errorForTheConsole", () => {
  it("no lleva el cuerpo del pedido, que en un login es la contraseña", () => {
    const err = {
      message: "Request failed with status code 401",
      config: { url: "/v3/adm-login", data: JSON.stringify({ email: "a@b.c", password: "secreta" }) },
      response: { status: 401, data: { success: false, message: "Acceso incorrecto" } },
    };

    const logged = JSON.stringify(errorForTheConsole(err));

    expect(logged).not.toContain("secreta");
    expect(errorForTheConsole(err)).toEqual({
      message: "Request failed with status code 401",
      status: 401,
      url: "/v3/adm-login",
      response: { success: false, message: "Acceso incorrecto" },
    });
  });
});
