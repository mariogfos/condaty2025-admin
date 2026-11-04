import { describe, expect, it } from "vitest";
import {
  assignableAdminRoles,
  canChangeAdminRole,
  canDeleteStaffProfile,
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

describe("eliminación de perfiles de personal", () => {
  const peer = { id: "peer", client_users: [{ role: administrator }] };
  const staff = { id: "staff", client_users: [{ role: operator }] };
  it("usa el permiso del módulo para guardias, incluso para roles nuevos y FOS", () => {
    expect(canDeleteStaffProfile(secondary, { id: "guard" }, "guard", true)).toBe(true);
    expect(canDeleteStaffProfile(secondary, { id: "guard" }, "guard", false)).toBe(false);
    expect(canDeleteStaffProfile({ id: "fos", fosrole_id: 1 }, { id: "guard" }, "guard", true)).toBe(true);
    expect(canDeleteStaffProfile({ id: "fos", fosrole_id: 1 }, { id: "guard" }, "guard", false)).toBe(false);
  });
  it("un administrador con D elimina roles secundarios pero nunca un predeterminado ni su propio perfil", () => {
    expect(canDeleteStaffProfile(principal, staff, "admin", true)).toBe(true);
    expect(canDeleteStaffProfile(principal, peer, "admin", true)).toBe(false);
    expect(canDeleteStaffProfile(principal, { ...peer, id: "principal" }, "admin", true)).toBe(false);
    expect(canDeleteStaffProfile(secondary, staff, "admin", true)).toBe(true);
    expect(canDeleteStaffProfile(secondary, peer, "admin", true)).toBe(false);
    expect(canDeleteStaffProfile(principal, staff, "admin", false)).toBe(false);
  });
  it("solo FOS con D puede eliminar un predeterminado y los perfiles FOS quedan en Backoffice", () => {
    const fos = { id: "fos", fosrole_id: 1 };
    expect(canDeleteStaffProfile(fos, peer, "admin", true)).toBe(true);
    expect(canDeleteStaffProfile(fos, peer, "admin", false)).toBe(false);
    expect(canDeleteStaffProfile(fos, { ...staff, fosrole_id: 1 }, "admin", true)).toBe(false);
    expect(canDeleteStaffProfile(fos, { id: "unknown-role" }, "admin", true)).toBe(false);
    expect(canDeleteStaffProfile(fos, staff, "owner", true)).toBe(false);
  });
});
