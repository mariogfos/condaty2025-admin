import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UnitInfo from "../UnitInfo/UnitInfo";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), showToast: vi.fn() }));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: mocks.execute }),
}));
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: mocks.showToast }),
}));
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: () => <span aria-hidden="true" />,
}));

describe("desvinculación desde el detalle de unidad", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deshabilita la acción mientras la solicitud está pendiente", async () => {
    let finishRequest!: (value: { data: { success: boolean } }) => void;
    mocks.execute.mockReturnValue(new Promise((resolve) => { finishRequest = resolve; }));

    const { container } = render(
      <UnitInfo
        datas={{
          data: { id: 7, nro: "A-1", holder: "H", type: { name: "Unidad" } },
          homeowner: { id: "owner-1", name: "Ana", last_name: "Pérez" },
          tenant: null,
        }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTitular={vi.fn()}
        onRemoveTitular={vi.fn()}
        onOpenDependentProfile={vi.fn()}
        onOpenTitularHist={vi.fn()}
        onOpenOwnerProfile={vi.fn()}
        onOpenTenantProfile={vi.fn()}
      />,
    );

    const menuButton = screen.getByRole("heading", { name: "Propietario" })
      .parentElement?.querySelector("button");
    expect(menuButton).not.toBeNull();
    fireEvent.click(menuButton!);
    fireEvent.click(screen.getByRole("button", { name: "Desvincular" }));

    await waitFor(() => expect(mocks.execute).toHaveBeenCalledTimes(1));
    expect(mocks.execute).toHaveBeenCalledWith("/dptos-release-owner", "POST", {
      dpto_id: 7,
      owner_id: "owner-1",
      type: "H",
    });

    fireEvent.click(menuButton!);
    expect(screen.getByRole("button", { name: "Procesando..." })).toBeDisabled();
    expect(mocks.execute).toHaveBeenCalledTimes(1);

    finishRequest({ data: { success: false } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Desvincular" })).not.toBeDisabled());
    expect(container).toBeTruthy();
  });
});
