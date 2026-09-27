import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Owners from "../Owners";

let capturedFields: any = null;

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: {}, userCan: () => true }),
}));

vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: ({ fields }: any) => {
    capturedFields = fields;
    return {
      userCan: () => true,
      List: () => null,
      setStore: vi.fn(),
      onSearch: vi.fn(),
      searchs: {},
      onEdit: vi.fn(),
      onDel: vi.fn(),
      reLoad: vi.fn(),
      showToast: vi.fn(),
      execute: vi.fn(),
      data: {},
      extraData: {},
    };
  },
}));

describe("Filtros de Residentes", () => {
  beforeEach(() => {
    capturedFields = null;
  });

  // 🔴 Los ids son el valor numérico de `OwnerStatus`: el API filtra por el
  // estado operativo y una letra da la lista vacía.
  it("ofrece Activo y Por activar como estados operativos", () => {
    render(<Owners />);

    expect(capturedFields.status.filter).toMatchObject({ label: "Estado" });
    expect(capturedFields.status.filter.options()).toEqual([
      { id: "ALL", name: "Todos" },
      { id: "1", name: "Activo" },
      { id: "2", name: "Por activar" },
    ]);
  });
});
