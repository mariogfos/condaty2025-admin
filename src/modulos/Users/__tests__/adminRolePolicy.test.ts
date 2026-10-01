import { describe, expect, it } from "vitest";
import {
  assignableAdminRoles,
  canChangeAdminRole,
} from "@/components/ProfileModal/adminRolePolicy";

const principal = { id: "principal", role: { code: "adm" } };
const secondary = { id: "secondary", role: { code: "operador" } };
const operator = { id: 2, code: "operador", name: "Operador" };
const administrator = { id: 1, code: "adm", name: "Administrador" };

describe("cambio de rol del personal administrativo", () => {
  it("el administrador principal puede editar un rol secundario, pero no a otro principal ni a sí mismo", () => {
    expect(canChangeAdminRole(principal, {
      id: "secondary", client_users: [{ role: operator }],
    }, true)).toBe(true);
    expect(canChangeAdminRole(principal, {
      id: "peer", client_users: [{ role: administrator }],
    }, true)).toBe(false);
    expect(canChangeAdminRole(principal, {
      id: "principal", client_users: [{ role: administrator }],
    }, true)).toBe(false);
    expect(canChangeAdminRole(principal, {
      id: "secondary", client_users: [{ role: operator }],
    }, false)).toBe(false);
  });

  it("un rol secundario no cambia otros roles y FOS sí puede cambiar al principal", () => {
    const target = { id: "peer", client_users: [{ role: administrator }] };
    expect(canChangeAdminRole(secondary, target, true)).toBe(false);
    expect(canChangeAdminRole({ id: "fos", fosrole_id: 1 }, target, false)).toBe(true);
    expect(assignableAdminRoles([administrator, operator], principal)).toEqual([operator]);
    expect(assignableAdminRoles([administrator, operator], { fosrole_id: 1 })).toEqual([
      administrator, operator,
    ]);
    expect(assignableAdminRoles([{ ...operator, status: "X" }], { fosrole_id: 1 }))
      .toEqual([]);
  });
});
