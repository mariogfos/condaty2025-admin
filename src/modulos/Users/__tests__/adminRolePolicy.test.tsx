import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditProfile from "@/components/ProfileModal/EditProfile/EditProfile";
import {
  assignableAdminRoles,
  canAddAdministrators,
  canChangeAdminRole,
} from "@/components/ProfileModal/adminRolePolicy";

/**
 * 🔴 Who gives or changes an administrator's role — production `136ded88`,
 * mirrored from the API (`UserController::roleChangeVeto()`), which is the
 * one that enforces it. The target's role is `role[0]` of
 * `GET v3/users?fullType=DET`, already narrowed to this condominium.
 */
const main = { id: "main", role: { code: "adm" } };
const secondary = { id: "secondary", role: { code: "operador" } };
const fos = { id: "fos", fosrole_id: 1 };
const operator = { id: 2, code: "operador", name: "Operador" };
const administrator = { id: 1, code: "ADM", name: "Administrador" };
const general = { id: 3, code: "Adm Gral.", name: "Administrador General" };

describe("who changes an administrator's role", () => {
  it("the adm changes another one's role, but not another adm's nor their own, and needs users:U", () => {
    expect(canChangeAdminRole(main, { id: "x", role: [operator] }, true)).toBe(true);
    expect(canChangeAdminRole(main, { id: "peer", role: [administrator] }, true)).toBe(false);
    expect(canChangeAdminRole(main, { id: "main", role: [administrator] }, true)).toBe(false);
    expect(canChangeAdminRole(main, { id: "x", role: [operator] }, false)).toBe(false);
    expect(canChangeAdminRole(main, { id: "x", fosrole_id: 1, role: [operator] }, true)).toBe(false);
  });

  it("an admin who is not adm changes nothing; FOS changes even an adm", () => {
    expect(canChangeAdminRole(secondary, { id: "x", role: [operator] }, true)).toBe(false);
    expect(canChangeAdminRole({ id: "g", role: { code: "Adm Gral." } }, { id: "x", role: [operator] }, true)).toBe(false);
    expect(canChangeAdminRole(fos, { id: "peer", role: [administrator] }, false)).toBe(true);
  });

  it("only FOS or the adm with users:C is offered «Nuevo»", () => {
    expect(canAddAdministrators(main, true)).toBe(true);
    expect(canAddAdministrators(main, false)).toBe(false);
    expect(canAddAdministrators(secondary, true)).toBe(false);
    expect(canAddAdministrators({ id: "g", role: { code: "Adm Gral." } }, true)).toBe(false);
    expect(canAddAdministrators(fos, false)).toBe(true);
    expect(canAddAdministrators(null, true)).toBe(false);
  });

  it("only FOS is offered the adm role; `adm` is exact and case-insensitive", () => {
    expect(assignableAdminRoles([administrator, operator, general], main)).toEqual([operator, general]);
    expect(assignableAdminRoles([administrator, operator, general], fos)).toEqual([administrator, operator, general]);
    expect(assignableAdminRoles([administrator, operator], null)).toEqual([operator]);
  });
});

const mocks = vi.hoisted(() => ({ execute: vi.fn(), showToast: vi.fn(), user: {} as any }));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mocks.user, showToast: mocks.showToast }),
}));
vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute: mocks.execute }) }));
vi.mock("@/mk/components/ui/DetailModal/DetailModal", () => ({
  default: ({ children, onSave }: any) => (
    <section>
      {children}
      <button onClick={onSave} type="button">Guardar cambios</button>
    </section>
  ),
}));
vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ label, name, onChange, value }: any) => (
    <label>
      {label}
      <input aria-label={label} name={name} onChange={onChange} value={value ?? ""} />
    </label>
  ),
}));
vi.mock("@/mk/components/forms/UploadFileProfile/UploadFileProfile", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ label, name, onChange, value, options }: any) => (
    <label>
      {label}
      <select aria-label={label} name={name} onChange={onChange} value={value ?? ""}>
        {options.map((option: any) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  ),
}));

const Editor = ({ canChangeRole }: { canChangeRole: boolean }) => {
  const [formState, setFormState] = useState<any>({
    id: "target-1", ci: "1234567", name: "Ana", last_name: "Pérez", url_avatar: [], role_id: 2,
  });
  const [errors, setErrors] = useState({});
  return (
    <EditProfile
      open
      onClose={vi.fn()}
      formState={formState}
      setFormState={setFormState}
      onChange={(e: any) => setFormState((c: any) => ({ ...c, [e.target.name]: e.target.value }))}
      errors={errors}
      setErrors={setErrors}
      url="/v3/users"
      type="admin"
      canChangeRole={canChangeRole}
      currentRoleId={2}
      roleOptions={[{ id: 2, name: "Operador" }, { id: 3, name: "Tesorero" }]}
    />
  );
};

describe("EditProfile — «Cambiar rol»", () => {
  beforeEach(() => {
    mocks.user = { id: "main", role: { code: "adm" } };
    mocks.execute.mockReset().mockResolvedValue({ data: { success: true } });
  });

  it("is not offered without permission", () => {
    render(<Editor canChangeRole={false} />);
    expect(screen.queryByLabelText("Rol del condominio")).not.toBeInTheDocument();
  });

  /** 🔴 Only `role_id`: resending `url_avatar` or the other one's data is not this screen's job. */
  it("the adm sends ONLY the new role of another admin", async () => {
    render(<Editor canChangeRole />);
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Rol del condominio"), { target: { name: "role_id", value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(mocks.execute).toHaveBeenCalledWith("/v3/users/target-1", "PUT", { role_id: "3" });
    });
  });
});
