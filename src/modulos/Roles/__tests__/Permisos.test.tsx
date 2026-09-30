/**
 * La cadena de habilidades que arma el editor de roles.
 *
 * ## 🔴 Por qué existe
 *
 * La casilla de una letra se llama `<modulo>_<letra>` y `onSelItem` la partía
 * por el PRIMER `_`: tildar «Ver» en `bank_accounts` guardaba `bank:accounts`
 * —sin la letra— y la casilla seguía destildada. El API ahora exige
 * `<módulo del catálogo>:<CRUD>` (`RoleWriteRequest`, api#706). Los únicos
 * nombres del catálogo con `_` son `bank_accounts` y `debts_manager`.
 */
import { render, fireEvent, cleanup, screen } from "@testing-library/react";
import { vi, describe, it, expect, afterEach } from "vitest";
import Permisos from "../Permisos";

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 1, client_id: 7 } }),
}));

const options = [
  { id: 1, name: "bank_accounts", ability_category_id: 1, description: "Cuentas bancarias" },
  { id: 2, name: "debts_manager", ability_category_id: 1, description: "Deudas" },
  { id: 3, name: "roles", ability_category_id: 1, description: "Roles" },
];

const renderEditor = (abilities: string, error: any = {}) => {
  const setItem = vi.fn();
  const view = render(
    <Permisos data={{ abilities }} options={options} setItem={setItem} error={error} />,
  );
  const box = (name: string) =>
    view.container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
  const saved = () => setItem.mock.calls.at(-1)?.[0].abilities;
  return { box, saved };
};

afterEach(cleanup);

describe("Permisos: el nombre de la habilidad", () => {
  it("tildar una letra de un módulo con `_` guarda `modulo:LETRA`", () => {
    const { box, saved } = renderEditor("");

    fireEvent.click(box("bank_accounts_R"));
    fireEvent.click(box("debts_manager_U"));

    expect(saved()).toBe("bank_accounts:R|debts_manager:U|");
    expect(box("bank_accounts_R").checked).toBe(true);
    expect(box("debts_manager_U").checked).toBe(true);
  });

  it("destildar saca sólo esa letra", () => {
    const { box, saved } = renderEditor("bank_accounts:CRUD|");

    fireEvent.click(box("bank_accounts_D"));

    expect(saved()).toBe("bank_accounts:CRU|");
  });

  it("un rol guardado bien formado se ve tildado", () => {
    const { box } = renderEditor("bank_accounts:R|debts_manager:CU|roles:CRUD|");

    expect(box("bank_accounts_R").checked).toBe(true);
    expect(box("bank_accounts_C").checked).toBe(false);
    expect(box("debts_manager_C").checked).toBe(true);
    expect(box("debts_manager_U").checked).toBe(true);
    expect(box("roles_D").checked).toBe(true);
  });

  it("uno viejo con `bank:accounts` no rompe y se reenvía tal cual", () => {
    // El API deja pasar lo que el rol ya tenía guardado.
    const { box, saved } = renderEditor("bank:accounts|debts:manager|");

    expect(box("bank_accounts_R").checked).toBe(false);
    fireEvent.click(box("bank_accounts_R"));

    expect(saved()).toBe("bank:accounts|debts:manager|bank_accounts:R|");
  });
});

describe("Permisos: el 422 del API", () => {
  it("pinta `errors.abilities` junto al campo", () => {
    const msg = "Algunos permisos no son válidos y no se guardaron: bank:accounts.";
    renderEditor("", { abilities: [msg] });

    expect(screen.getByText(msg)).toBeTruthy();
  });

  it("sin error no pinta nada", () => {
    const { box } = renderEditor("", { name: ["otro campo"] });

    expect(box("roles_R")).toBeTruthy();
    expect(screen.queryByText("otro campo")).toBeNull();
  });
});
