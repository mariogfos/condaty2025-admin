import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RenderView from "../RenderView/RenderView";

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { client_id: 10 } }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children }: any) => <section>{children}</section>,
}));

vi.mock("@/mk/components/forms/Button/Button", () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: () => <div data-testid="avatar" />,
}));

vi.mock("@/components/ActiveOwner/ActiveOwner", () => ({
  default: () => null,
}));

describe("detalle de residente pendiente", () => {
  it("permite recuperar una cuenta W cuyo vínculo ya está activo", async () => {
    const detail = {
      id: "owner-25",
      name: "Ana",
      last_name: "Pérez",
      ci: "1234567",
      account_status: "W",
      membership_status: "A",
      operational_status: "W",
      clients: [
        {
          id: 10,
          pivot: { type: "T", status: "A", preunidad: "A-12" },
        },
      ],
      dpto: [{ nro: "A-12", type: { name: "Departamento" } }],
    };
    const execute = vi
      .fn()
      .mockResolvedValueOnce({
        data: { success: true, data: [detail] },
      })
      .mockResolvedValueOnce({
        data: { success: true, message: "Cuenta activada con éxito." },
      });
    const showToast = vi.fn();
    const onClose = vi.fn();
    const reLoad = vi.fn();

    render(
      <RenderView
        open
        onClose={onClose}
        item={detail}
        execute={execute}
        showToast={showToast}
        reLoad={reLoad}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Activar cuenta" }));

    await waitFor(() => {
      expect(execute).toHaveBeenLastCalledWith(
        "/owners/owner-25/activate-account",
        "POST",
        {},
        true,
      );
    });
    expect(showToast).toHaveBeenCalledWith("Cuenta activada con éxito.", "success");
    expect(reLoad).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
