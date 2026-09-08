import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrDinamico from "../QrDinamico";

const executeMock = vi.fn();
const setStoreMock = vi.fn();
let mockUser: any = { id: "admin-1", type: "ADM", fosrole_id: null };

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    userCan: () => true,
    setStore: setStoreMock,
    store: {},
  }),
}));

vi.mock("../RenderView/RenderView", () => ({
  default: () => <div>Detalle QR</div>,
}));

vi.mock("../Conciliation/Conciliation", () => ({
  default: () => <div>Contenido de conciliación</div>,
}));

vi.mock("../QrMetrics/QrMetrics", () => ({
  default: () => <div>Métricas QR</div>,
}));

const successfulOrdersResponse = {
  data: {
    success: true,
    data: {
      items: [],
      pagination: {
        current_page: 1,
        last_page: 1,
        total: 0,
      },
    },
  },
};

describe("QrDinamico access and request contract", () => {
  beforeEach(() => {
    executeMock.mockReset();
    executeMock.mockResolvedValue(successfulOrdersResponse);
    setStoreMock.mockReset();
    mockUser = { id: "admin-1", type: "ADM", fosrole_id: null };
  });

  it("oculta la conciliacion para un administrador de condominio", async () => {
    render(<QrDinamico />);

    await waitFor(() =>
      expect(
        screen.getByText("No hay órdenes QR registradas."),
      ).toBeInTheDocument(),
    );

    expect(screen.queryByRole("button", { name: "Conciliación" })).toBeNull();
    expect(executeMock).toHaveBeenCalledWith(
      "qr-dynamic/orders",
      "GET",
      expect.objectContaining({ page: "1", per_page: "40" }),
    );
  });

  it("muestra la conciliacion solo al usuario FOS", async () => {
    mockUser = { id: "fos-1", type: "ADM", fosrole_id: 1 };

    render(<QrDinamico />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Conciliación" }),
      ).toBeInTheDocument(),
    );
  });
});
