import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientOwnerType } from "@/modulos/Payments/Type/PaymentType";
import ActiveOwner from "../ActiveOwner";

const mocks = vi.hoisted(() => ({ useAxios: vi.fn(), select: vi.fn() }));

vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ showToast: vi.fn(), user: { client_id: 10 } }) }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: mocks.useAxios }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ children }: any) => <section>{children}</section> }));
vi.mock("@/mk/components/forms/TextArea/TextArea", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: (props: any) => {
    mocks.select(props);
    return null;
  },
}));

/**
 * 🔴 Comparaba `type_owner == "T"` contra la ETIQUETA que manda la lista
 * («Residente»): siempre pedía unidades SIN propietario y nunca dejaba elegir
 * varias.
 */
const abrir = (tipo: ClientOwnerType, etiqueta: string) =>
  render(
    <ActiveOwner
      open
      onClose={vi.fn()}
      typeActive="A"
      data={{ id: "o-1", type_owner: etiqueta, clients: [{ id: 10, pivot: { type: tipo } }] }}
      onCloseOwner={vi.fn()}
      reLoad={vi.fn()}
    />,
  );

describe("aprobar una solicitud: las unidades que se ofrecen", () => {
  beforeEach(() => {
    mocks.useAxios.mockReset().mockReturnValue({ data: { data: [] }, execute: vi.fn() });
    mocks.select.mockReset();
  });

  it("un residente elige entre las unidades con propietario y sin residente, una sola", () => {
    abrir(ClientOwnerType.RESIDENT, "Residente");

    expect(mocks.useAxios).toHaveBeenCalledWith("/v3/dptos", "GET", expect.objectContaining({ fullType: "PR" }), true);
    expect(mocks.select).toHaveBeenCalledWith(expect.objectContaining({ multiSelect: false }));
  });

  it("un propietario elige entre las unidades sin propietario, varias", () => {
    abrir(ClientOwnerType.HOMEOWNER, "Propietario");

    expect(mocks.useAxios).toHaveBeenCalledWith("/v3/dptos", "GET", expect.objectContaining({ fullType: "PH" }), true);
    expect(mocks.select).toHaveBeenCalledWith(expect.objectContaining({ multiSelect: true }));
  });
});
