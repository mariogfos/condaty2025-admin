import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";

let mockUser: any = { id: "u1", fosrole_id: null };

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser, showToast: vi.fn() }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/mk/components/forms/UploadFileV3/UploadFileV3", () => ({
  default: () => null,
}));
vi.mock("@/modulos/QrDinamico/QrAccountConfig/QrAccountConfig", () => ({
  default: ({ bankAccountId }: any) => (
    <div id="qr-account-config">config de {String(bankAccountId)}</div>
  ),
}));

const setup = (item: any) =>
  render(
    <RenderForm
      open
      onClose={vi.fn()}
      item={item}
      execute={vi.fn()}
      extraData={{ bankEntities: [], currencyTypes: [] }}
      reLoad={vi.fn()}
    />,
  );

describe("RenderForm — descubribilidad del QR Dinámico (QR-07)", () => {
  beforeEach(() => {
    mockUser = { id: "u1", fosrole_id: null };
  });

  it("al crear, FOS ve el aviso de que hay que guardar primero", () => {
    mockUser = { id: "u1", fosrole_id: 1 };
    const { container } = setup({});

    expect(container.querySelector("#qr-account-config-pending")).not.toBeNull();
    expect(screen.getByText(/Guardá la cuenta primero/)).toBeInTheDocument();
    expect(screen.getByText(/QR Dinámico \(solo FOS\)/)).toBeInTheDocument();
    // Todavía no hay id: no se puede pedir la config
    expect(container.querySelector("#qr-account-config")).toBeNull();
  });

  it("al editar, FOS ve la configuración real", () => {
    mockUser = { id: "u1", fosrole_id: 1 };
    const { container } = setup({ id: 7 });

    expect(container.querySelector("#qr-account-config")).not.toBeNull();
    expect(container.querySelector("#qr-account-config-pending")).toBeNull();
  });

  it("un admin de condominio no ve nada de QR (RN-ADM-01)", () => {
    const { container } = setup({ id: 7 });

    expect(container.querySelector("#qr-account-config")).toBeNull();
    expect(container.querySelector("#qr-account-config-pending")).toBeNull();
  });
});
