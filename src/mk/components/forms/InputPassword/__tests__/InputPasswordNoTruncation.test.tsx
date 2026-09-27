import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

/**
 * 🔴 `InputPassword` cortaba en silencio a 10 caracteres (`maxLength={10}`).
 * Lo usan el login, el perfil, el alta de usuarios y la API Key y la clave del
 * banco en la configuración del QR: una API Key más larga se guardaba cortada,
 * y un admin con una clave de más de 10 no podía entrar. El largo lo valida el
 * servidor; acá queda el tope general de `Input`, 255.
 */

vi.mock("@/components/layout/icons/IconsBiblioteca", () => ({
  IconEye: () => null,
  IconEyeOff: () => null,
}));

import InputPassword from "../InputPassword";

describe("InputPassword: no corta a 10", () => {
  afterEach(cleanup);

  it("ninguno de sus dos campos corta por debajo de 255", () => {
    const { container } = render(
      <InputPassword name="password" value="" repeatPassword />,
    );

    const topes = Array.from(container.querySelectorAll("input")).map((input) =>
      Number(input.getAttribute("maxlength") ?? Infinity),
    );

    expect(topes).toHaveLength(2);
    expect(topes.filter((tope) => tope < 255)).toEqual([]);
  });
});
