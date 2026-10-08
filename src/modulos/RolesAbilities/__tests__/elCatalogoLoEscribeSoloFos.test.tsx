/**
 * 🔴 El catálogo de permisos y sus categorías los escribe sólo FOS.
 *
 * El API (`AbilityPolicy`, `AbilityCategoryPolicy`) le contesta 403 a
 * cualquier ADM que no sea FOS, y estas dos pantallas le ofrecían «Agregar»,
 * «Editar» y «Eliminar» igual. El `onHideActions` que había leía
 * `item.is_assigned`, una clave que el API no manda: no escondía nada.
 *
 * Se mide el `mod` que la pantalla le pasa a `useCrud`, con el actor de cada
 * lado.
 */
import { render, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, afterEach } from "vitest";
import RolesAbilities from "../RolesAbilities";
import RolesCategories from "../../RolesCategories/RolesCategories";

let mockUser: any = null;
let captured: any = null;

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));
vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: (props: any) => {
    captured = props.mod;
    return { userCan: () => true, List: () => null, setStore: vi.fn(), onSearch: vi.fn(), searchs: {}, onEdit: vi.fn(), onDel: vi.fn() };
  },
}));
vi.mock("../../shared/useCrudUtils", () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  captured = null;
});

describe.each([
  ["Permisos", RolesAbilities],
  ["Categorías", RolesCategories],
])("%s: el catálogo lo escribe sólo FOS", (_name, Screen: any) => {
  it("un ADM del condominio no ve agregar, editar ni eliminar", () => {
    mockUser = { id: 1, client_id: 7, role: { code: "adm", abilities: "roles:CRUD|" } };
    render(<Screen />);

    expect(captured.hideActions).toMatchObject({ add: true, edit: true, del: true });
  });

  it("FOS sí", () => {
    mockUser = { id: 2, client_id: 7, fosrole_id: 1 };
    render(<Screen />);

    expect(captured.hideActions).toMatchObject({ add: false, edit: false, del: false });
  });
});
