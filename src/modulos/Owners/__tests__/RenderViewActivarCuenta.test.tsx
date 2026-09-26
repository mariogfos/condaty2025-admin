import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClientOwnerStatus, OwnerStatus } from "@/modulos/Payments/Type/PaymentType";
import RenderView from "../RenderView/RenderView";

vi.mock("@/mk/contexts/AuthProvider", () => ({ useAuth: () => ({ user: { client_id: 10 } }) }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: ({ children }: any) => <section>{children}</section> }));
vi.mock("@/mk/components/forms/Button/Button", () => ({
  default: ({ children, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({ Avatar: () => null }));
vi.mock("@/components/ActiveOwner/ActiveOwner", () => ({ default: () => null }));

const detalle = {
  id: "owner-25",
  name: "Ana",
  last_name: "Pérez",
  ci: "1234567",
  status: OwnerStatus.WAITING,
  clients: [{ id: 10, pivot: { type: 2, status: ClientOwnerStatus.ACTIVE, preunidad: "A-12" } }],
};

const renderizar = (fila: Record<string, unknown>, execute: any) =>
  render(
    <RenderView open onClose={vi.fn()} item={fila} reLoad={vi.fn()} execute={execute} showToast={vi.fn()} />,
  );

describe("detalle de un residente en espera", () => {
  it("la cuenta en espera con el vínculo activo se activa con su botón", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({ data: { success: true, data: [detalle] } })
      .mockResolvedValueOnce({ data: { success: true, message: "Cuenta activada con éxito." } });

    renderizar({ id: "owner-25", account_status: OwnerStatus.WAITING, membership_status: ClientOwnerStatus.ACTIVE }, execute);

    expect(screen.queryByText("Aprobar Solicitud")).not.toBeInTheDocument();
    fireEvent.click(await screen.findByText("Activar cuenta"));

    await waitFor(() =>
      expect(execute).toHaveBeenCalledWith("/v3/owners/owner-25/activate-account", "POST", {}, false, true),
    );
  });

  it("una solicitud pendiente no ofrece «Activar cuenta»", async () => {
    const execute = vi.fn().mockResolvedValueOnce({
      data: { success: true, data: [{ ...detalle, clients: [{ id: 10, pivot: { type: 2, status: ClientOwnerStatus.WAITING } }] }] },
    });

    renderizar({ id: "owner-25", account_status: OwnerStatus.WAITING, membership_status: ClientOwnerStatus.WAITING }, execute);

    expect(await screen.findByText("Aprobar Solicitud")).toBeInTheDocument();
    expect(screen.queryByText("Activar cuenta")).not.toBeInTheDocument();
  });
});
