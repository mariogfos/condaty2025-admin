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

// FOS by default: these cases measure how the string is built, not who may
// grant (that is «Permisos: nadie da lo que no tiene», below).
let mockUser: any = { id: 1, client_id: 7, fosrole_id: 1 };
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
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

afterEach(() => {
  cleanup();
  mockUser = { id: 1, client_id: 7, fosrole_id: 1 };
});

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

/**
 * 🔴 Nadie reparte una letra que no tiene — salvo FOS y el `adm`
 * (`RoleWriteRequest`, 2026-10-08). La pantalla no ofrece lo que el API
 * rechaza; lo que el rol ya tenía se sigue pudiendo sacar.
 */
describe("Permisos: nadie da lo que no tiene", () => {
  const asSupervisor = () => {
    mockUser = { id: 2, client_id: 7, role: { code: "sup", abilities: "roles:CRU|bank_accounts:R|" } };
  };

  it("una letra que el actor no tiene no se puede tildar", () => {
    asSupervisor();
    const { box } = renderEditor("");

    expect(box("roles_C").disabled).toBe(false);
    expect(box("roles_D").disabled).toBe(true);
    expect(box("debts_manager_R").disabled).toBe(true);
    expect(box("bank_accounts_R").disabled).toBe(false);
  });

  it("lo que el rol ya tenía se puede sacar aunque el actor no lo tenga", () => {
    asSupervisor();
    const { box, saved } = renderEditor("debts_manager:CRUD|");

    expect(box("debts_manager_D").disabled).toBe(false);
    fireEvent.click(box("debts_manager_D"));

    expect(saved()).toBe("debts_manager:CRU|");
  });

  it("«todos» de un módulo tilda sólo lo que el actor puede dar", () => {
    asSupervisor();
    const { saved } = renderEditor("");

    fireEvent.click(document.querySelector('input[name="roles"]') as HTMLInputElement);

    expect(saved()).toBe("roles:CRU|");
  });

  it("con lo parcial puesto, el «todos» de la fila la vacía en vez de volver a llenarla", () => {
    asSupervisor();
    const { saved } = renderEditor("");
    const toggle = () => document.querySelector('input[name="roles"]') as HTMLInputElement;

    fireEvent.click(toggle());
    expect(saved()).toBe("roles:CRU|");
    fireEvent.click(toggle());
    expect(saved()).toBe("");
  });

  it("el «Todos» de una categoría tilda sólo lo que el actor puede dar", () => {
    asSupervisor();
    const { saved } = renderEditor("");

    fireEvent.click(screen.getByText("Todos"));

    expect(saved()).toBe("bank_accounts:R|roles:CRU|");
  });

  it("el adm del condominio da cualquier letra", () => {
    mockUser = { id: 3, client_id: 7, role: { code: "adm", abilities: "roles:R|" } };
    const { box } = renderEditor("");

    expect(box("debts_manager_D").disabled).toBe(false);
    expect(box("roles_D").disabled).toBe(false);
  });
});
