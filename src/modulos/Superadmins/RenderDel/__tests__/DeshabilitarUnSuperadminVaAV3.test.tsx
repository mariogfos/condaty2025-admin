import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RenderDel from "../RenderDel";

/**
 * Deshabilitar un superadmin llama a `/v3/delete-user/{id}`.
 *
 * En producción la ruta es `/api/delete-user/{id}`, sin prefijo. En `dev` el
 * módulo Users la registra dentro de `v3`, y la pantalla seguía llamando sin
 * él: el botón «Eliminar» daba 404 y mostraba «Error al eliminar el
 * superadmin». Medido el 2026-09-25.
 */
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, onSave }: any) => (
    <section>
      {children}
      <button onClick={onSave} type="button">
        Eliminar
      </button>
    </section>
  ),
}));

describe("Superadmins · deshabilitar", () => {
  it("llama a la ruta del módulo Users, con v3", async () => {
    const execute = vi.fn().mockResolvedValue({ data: { success: true } });

    render(
      <RenderDel
        open
        onClose={vi.fn()}
        item={{ id: "user-9" }}
        onSave={vi.fn()}
        execute={execute}
        reLoad={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(execute).toHaveBeenCalledWith("/v3/delete-user/user-9", "DELETE", {}),
    );
  });
});
