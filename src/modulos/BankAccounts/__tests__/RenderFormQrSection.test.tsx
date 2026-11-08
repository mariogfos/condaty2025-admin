import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderForm from "../RenderForm/RenderForm";

let mockUser: any = { id: "u1", fosrole_id: null };
const mockQrSave = vi.fn(async () => true);

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser, showToast: vi.fn() }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, onSave }: any) => <div>{children}<button onClick={onSave}>Guardar</button></div>,
}));
vi.mock("@/mk/components/forms/UploadFileV3/UploadFileV3", () => ({
  default: () => null,
}));
vi.mock("@/modulos/QrDinamico/QrAccountConfig/QrAccountConfig", async () => {
  const { useImperativeHandle } = await import("react");
  const MockQrAccountConfig = ({ bankAccountId, ref }: any) => {
    useImperativeHandle(ref, () => ({ save: mockQrSave }));
    return <div id="qr-account-config">config de {String(bankAccountId)}</div>;
  };
  return { default: MockQrAccountConfig };
});

const setup = (item: any, execute = vi.fn(), onClose = vi.fn()) =>
  render(
    <RenderForm
      open
      onClose={onClose}
      item={item}
      execute={execute}
      extraData={{ bankEntities: [], currencyTypes: [] }}
      reLoad={vi.fn()}
    />,
  );

describe("RenderForm — descubribilidad del QR Dinámico (QR-07)", () => {
  beforeEach(() => {
    mockUser = { id: "u1", fosrole_id: null };
    mockQrSave.mockClear();
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

  it("al guardar solo QR no revalida ni reescribe los datos de la cuenta", async () => {
    mockUser = { id: "u1", fosrole_id: 1 };
    const execute = vi.fn();
    const onClose = vi.fn();
    setup({ id: 7 }, execute, onClose);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(mockQrSave).toHaveBeenCalledOnce();
    expect(execute).not.toHaveBeenCalled();
  });
});
