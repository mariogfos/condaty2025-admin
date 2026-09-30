import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RenderView from "../RenderView/RenderView";
import { BankAccountStatus } from "../Type/BankType";

let letras = "RU";
const userCan = vi.fn((ability: string, action: string) =>
  ability === "bank_accounts" ? letras.includes(action) : false,
);

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn(), userCan, user: { id: 2 } }),
}));

/** `DataModal` reducido a lo que se mide: el título, el pie y el cuerpo. */
vi.mock("@/mk/components/ui/DataModal/DataModal", async () => {
  const React = await import("react");
  return {
    default: ({ open, children, title, buttonExtra }: any) =>
      open
        ? React.createElement(
            "div",
            null,
            React.createElement("h2", null, title),
            children,
            buttonExtra,
          )
        : null,
  };
});

const LA_CUENTA = {
  id: 7,
  alias_holder: "Cuenta de expensas",
  holder: "Titular",
  status: BankAccountStatus.ACTIVE,
};

const montar = () => {
  const execute = vi.fn().mockResolvedValue({
    data: { success: true, data: { data: LA_CUENTA, isInUse: false } },
  });
  render(
    <RenderView
      open
      onClose={vi.fn()}
      item={{ id: 7 }}
      execute={execute}
      reLoad={vi.fn()}
      showToast={vi.fn()}
      extraData={{}}
    />,
  );
  return { execute };
};

/**
 * El detalle es la única puerta a la edición de la cuenta —y con ella a la
 * configuración del QR dinámico—: la acción de editar de la fila está oculta.
 */
describe("El detalle de la cuenta bancaria", () => {
  beforeEach(() => {
    letras = "RU";
  });

  it("lee la cuenta con fullType=DET", async () => {
    const { execute } = montar();

    await screen.findByText("Cuenta de expensas");
    expect(execute).toHaveBeenCalledWith(
      "/v3/bank-accounts",
      "GET",
      { fullType: "DET", searchBy: 7 },
      false,
      true,
    );
  });

  it("con bank_accounts:U ofrece editar y deshabilitar", async () => {
    montar();

    await screen.findByText("Cuenta de expensas");
    expect(screen.getByText("Editar datos")).toBeInTheDocument();
    expect(screen.getByText("Deshabilitar cuenta")).toBeInTheDocument();
  });

  /**
   * 🔴 El API pide `bank_accounts:U` para editar y para habilitar o
   * deshabilitar. A quien sólo lee, los dos botones le terminaban en 403.
   */
  it("sin bank_accounts:U no ofrece ni editar ni deshabilitar", async () => {
    letras = "R";
    montar();

    await screen.findByText("Cuenta de expensas");
    await waitFor(() => expect(userCan).toHaveBeenCalled());
    expect(screen.queryByText("Editar datos")).toBeNull();
    expect(screen.queryByText("Deshabilitar cuenta")).toBeNull();
  });
});
