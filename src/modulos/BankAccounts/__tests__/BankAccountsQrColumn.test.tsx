import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BankAccounts from "../BankAccounts";
import { qrAccountState } from "@/modulos/QrDinamico/shared";

let mockUser: any = { id: "u1", fosrole_id: null };
let capturedFields: any = null;

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast: vi.fn(),
  }),
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
    };
  },
}));

vi.mock("../../shared/useCrudUtils", () => ({
  default: () => ({ onLongPress: vi.fn(), selItem: null }),
}));

vi.mock("../RenderForm/RenderForm", () => ({ default: () => null }));
vi.mock("../RenderView/RenderView", () => ({ default: () => null }));

const renderCell = (item: Record<string, any>) => {
  const onRender = capturedFields?.qr_dynamic_enabled?.list?.onRender;
  expect(onRender).toBeTypeOf("function");
  return render(<>{onRender({ item })}</>);
};

describe("BankAccounts — columna de QR Dinámico (QR-07)", () => {
  beforeEach(() => {
    capturedFields = null;
    mockUser = { id: "u1", fosrole_id: null };
  });

  it("un admin de condominio no ve la columna (RN-ADM-01)", () => {
    render(<BankAccounts />);
    expect(capturedFields).not.toBeNull();
    expect(capturedFields.qr_dynamic_enabled).toBeUndefined();
  });

  it("FOS ve la columna", () => {
    mockUser = { id: "u1", fosrole_id: 1 };
    render(<BankAccounts />);
    expect(capturedFields.qr_dynamic_enabled).toBeTruthy();
    expect(capturedFields.qr_dynamic_enabled.label).toBe("QR Dinámico");
  });

  it("distingue Activo, Incompleto y Deshabilitado sin abrir cada modal", () => {
    mockUser = { id: "u1", fosrole_id: 1 };
    render(<BankAccounts />);

    renderCell({
      qr_dynamic_enabled: true,
      qr_dynamic_bank_id: "uuid-bg",
      qr_dynamic_account_reference: "CTA-001",
    });
    expect(screen.getByText("Activo")).toBeInTheDocument();

    renderCell({
      qr_dynamic_enabled: true,
      qr_dynamic_bank_id: "uuid-bg",
      qr_dynamic_account_reference: null,
    });
    expect(screen.getByText("Incompleto")).toBeInTheDocument();

    renderCell({ qr_dynamic_enabled: false });
    expect(screen.getByText("Deshabilitado")).toBeInTheDocument();
  });
});

describe("qrAccountState", () => {
  it("deshabilitado si el flag es falsy, incluso con el resto cargado", () => {
    expect(
      qrAccountState({
        qr_dynamic_enabled: false,
        qr_dynamic_bank_id: "uuid-bg",
        qr_dynamic_account_reference: "CTA-001",
      }),
    ).toBe("disabled");
    // El listado puede no traer las columnas: no debe explotar
    expect(qrAccountState(undefined)).toBe("disabled");
    expect(qrAccountState({})).toBe("disabled");
  });

  it("incompleto si falta el proveedor o la referencia", () => {
    expect(
      qrAccountState({
        qr_dynamic_enabled: true,
        qr_dynamic_account_reference: "CTA-001",
      }),
    ).toBe("incomplete");
    expect(
      qrAccountState({ qr_dynamic_enabled: true, qr_dynamic_bank_id: "uuid-bg" }),
    ).toBe("incomplete");
  });

  it("activo solo con proveedor y referencia", () => {
    expect(
      qrAccountState({
        qr_dynamic_enabled: true,
        qr_dynamic_bank_id: "uuid-bg",
        qr_dynamic_account_reference: "CTA-001",
      }),
    ).toBe("active");
  });
});
