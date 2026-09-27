import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

/**
 * Un campo de contraseña con `autocomplete="off"` NO frena al gestor de
 * contraseñas: la clave guardada del admin puede caer en el alta de un usuario
 * o en las credenciales del banco. Todo `InputPassword` pide `new-password`,
 * salvo el login, que pide la clave propia.
 */

vi.mock("@/components/layout/icons/IconsBiblioteca", () => ({
  IconEye: () => null,
  IconEyeOff: () => null,
}));

import InputPassword from "../InputPassword";

const passwordInputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("input")) as HTMLInputElement[];

describe("InputPassword: autocomplete", () => {
  afterEach(cleanup);

  it("por defecto pide new-password, también en el campo de repetir", () => {
    const { container } = render(
      <InputPassword name="password" value="" repeatPassword />,
    );

    const inputs = passwordInputs(container);
    expect(inputs).toHaveLength(2);
    expect(inputs.map((input) => input.getAttribute("autocomplete"))).toEqual([
      "new-password",
      "new-password",
    ]);
  });

  it("el login puede pedir current-password", () => {
    const { container } = render(
      <InputPassword
        name="password"
        value=""
        autoComplete="current-password"
      />,
    );

    expect(passwordInputs(container)[0].getAttribute("autocomplete")).toBe(
      "current-password",
    );
  });
});
