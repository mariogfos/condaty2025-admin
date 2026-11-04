import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileModal from "@/components/ProfileModal/ProfileModal";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(), reLoad: vi.fn(), close: vi.fn(), showToast: vi.fn(),
  user: {} as Record<string, any>, details: {} as Record<string, any>, permissions: [] as string[],
}));
vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({
  user: mocks.user, getUser: vi.fn(), showToast: mocks.showToast, logout: vi.fn(),
  userCan: (module: string, action: string) => mocks.permissions.includes(`${module}:${action}`),
}) }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: (_url?: string, _method?: string, params?: any) => ({
  execute: mocks.execute, reLoad: mocks.reLoad,
  data: params?.fullType === "EXTRA" ? { data: { roles: [] } } : mocks.details,
}) }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ open, children, title, buttonText, disabled, onSave }: any) => open ? <section aria-label={title}>{children}{buttonText && <button disabled={disabled} onClick={onSave}>{buttonText}</button>}</section> : null }));
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({ Avatar: () => null }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/modulos/Profile/Authentication", () => ({ default: () => null }));
vi.mock("@/components/ProfileModal/EditProfile/EditProfile", () => ({ default: () => null }));
vi.mock("@/components/ProfileModal/GuardEditForm/GuardEditForm", () => ({ default: () => null }));
vi.mock("@/modulos/Guards/RenderForm/RenderForm", () => ({ default: () => null }));

const show = (type: string) => render(<ProfileModal open onClose={mocks.close} reLoad={mocks.reLoad} dataID="target" type={type} />);
describe("eliminación desde el perfil", () => {
  beforeEach(() => {
    mocks.execute.mockReset(); mocks.reLoad.mockReset(); mocks.close.mockReset(); mocks.showToast.mockReset();
    mocks.user = { id: "actor", client_id: "a", role: { code: "adm" }, clients: [] };
    mocks.details = { data: [{ id: "target", name: "Persona", clients: [], client_users: [{ role: { id: 2, code: "operador" } }] }] };
    mocks.permissions = [];
  });
  it("Guardias D muestra la acción aunque Administradores D no esté concedido", () => {
    mocks.permissions = ["guards:D"];
    show("guard");
    expect(screen.getByRole("button", { name: "Eliminar guardia" })).toBeInTheDocument();
  });
  it("Administradores D no concede eliminación de guardias", () => {
    mocks.permissions = ["users:D"];
    show("guard");
    expect(screen.queryByRole("button", { name: "Eliminar guardia" })).not.toBeInTheDocument();
  });
  it("el perfil administrativo muestra la acción con permiso y oculta a un predeterminado", () => {
    mocks.permissions = ["users:D"];
    const view = show("admin");
    expect(screen.getByRole("button", { name: "Eliminar personal administrativo" })).toBeInTheDocument();
    mocks.details = { data: [{ ...mocks.details.data[0], client_users: [{ role: { id: 1, code: "adm" } }] }] };
    view.rerender(<ProfileModal open onClose={mocks.close} type="admin" />);
    expect(screen.queryByRole("button", { name: "Eliminar personal administrativo" })).not.toBeInTheDocument();
  });
  it("FOS con permiso puede eliminar un predeterminado", () => {
    mocks.user = { ...mocks.user, fosrole_id: 1 };
    mocks.permissions = ["users:D"];
    mocks.details = { data: [{ ...mocks.details.data[0], client_users: [{ role: { id: 1, code: "adm" } }] }] };
    show("admin");
    expect(screen.getByRole("button", { name: "Eliminar personal administrativo" })).toBeInTheDocument();
  });
  it("confirma una sola vez y no vuelve a consultar el perfil desvinculado", async () => {
    mocks.permissions = ["guards:D"];
    let resolve!: (value: any) => void;
    mocks.execute.mockReturnValue(new Promise(done => { resolve = done; }));
    show("guard");
    fireEvent.click(screen.getByRole("button", { name: "Eliminar guardia" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(screen.getByRole("button", { name: "Eliminando…" })).toBeDisabled();
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.execute).toHaveBeenCalledWith("/guards/target", "DELETE", {});
    resolve({ data: { success: true } });
    await waitFor(() => expect(mocks.close).toHaveBeenCalledTimes(1));
    expect(mocks.reLoad).toHaveBeenCalledTimes(1);
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });
});
