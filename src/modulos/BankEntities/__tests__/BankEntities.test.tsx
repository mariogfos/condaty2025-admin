import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockUserCan = vi.fn();
let camposRecibidos: any = null;
let modRecibido: any = null;

const MockList = () => <div data-testid="lista" />;

vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: ({ fields, mod }: any) => {
    camposRecibidos = fields;
    modRecibido = mod;
    return {
      userCan: mockUserCan,
      List: MockList,
      setStore: vi.fn(),
      onSearch: vi.fn(),
      searchs: {},
      onEdit: vi.fn(),
      onDel: vi.fn(),
    };
  },
}));

vi.mock("../../shared/useCrudUtils", () => ({
  default: () => ({ onLongPress: vi.fn(), selItem: null }),
}));

vi.mock("@/components/layout/NotAccess/NotAccess", () => ({
  default: () => <div data-testid="sin-acceso" />,
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ setStore: vi.fn(), store: {} }),
}));

import BankEntities from "../BankEntities";

describe("BankEntities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    camposRecibidos = null;
    modRecibido = null;
    mockUserCan.mockReturnValue(true);
  });

  it("monta la lista", () => {
    render(<BankEntities />);
    expect(screen.getByTestId("lista")).toBeInTheDocument();
  });

  it("sin permiso no muestra nada del catálogo", () => {
    mockUserCan.mockReturnValue(false);
    render(<BankEntities />);
    expect(screen.getByTestId("sin-acceso")).toBeInTheDocument();
  });

  /**
   * 🔴 Sin `form` en un campo, `useCrud` no lo dibuja en el alta ni en la
   * edición: la pantalla se ve entera y el campo simplemente no está.
   *
   * Y `status` es el que NO puede faltar: `bank_entities.status` es nullable y
   * sin default, y una entidad con estado NULL queda INVISIBLE en el select del
   * form de Cuentas Bancarias, que se arma con `where('status', ACTIVE)`.
   */
  it("los cuatro campos se pueden cargar desde el formulario", () => {
    render(<BankEntities />);

    for (const campo of ["name", "bank_code", "description", "status"]) {
      expect(camposRecibidos?.[campo]?.form).toBeTruthy();
    }
  });

  /**
   * 🔴 El filtro manda VALORES NUMÉRICOS. Contra una columna `tinyint`, un char
   * no da error: MariaDB lo convierte a 0. Un filtro con `'A'` devolvería las
   * INACTIVAS y el usuario vería una lista equivocada sin ningún aviso.
   */
  it("el filtro de estado manda números, no chars", () => {
    render(<BankEntities />);

    const opciones = camposRecibidos?.status?.filter?.options?.() ?? [];
    const sinTodos = opciones.filter((o: any) => o.id !== "ALL");

    expect(sinTodos).toHaveLength(2);
    for (const opcion of sinTodos) {
      expect(typeof opcion.id).toBe("number");
    }
    expect(sinTodos.map((o: any) => o.id).sort()).toEqual([0, 1]);
  });

  it("el select del formulario manda los mismos números que el filtro", () => {
    render(<BankEntities />);

    const delForm = camposRecibidos?.status?.form?.options ?? [];

    expect(delForm.map((o: any) => o.id).sort()).toEqual([0, 1]);
  });

  it("le pasa a useCrud el mod del catálogo compartido", () => {
    render(<BankEntities />);

    expect(modRecibido?.modulo).toBe("v3/bank-entities");
    expect(modRecibido?.permiso).toBe("superadmins");
  });
});
