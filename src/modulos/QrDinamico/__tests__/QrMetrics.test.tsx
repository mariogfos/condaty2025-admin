import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrMetrics from "../QrMetrics/QrMetrics";

const executeMock = vi.fn();
let mockUser: any = { id: "u1", fosrole_id: null };

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser, showToast: vi.fn() }),
}));

const METRICS = {
  generados: 4,
  monto_generado: 580,
  monto_pagado: 400,
  por_estado: { pending: 1, paid: 2, replaced: 0, expired: 1, cancelled: 0 },
};

const mockApi = () => {
  executeMock.mockImplementation(async (url: string) => {
    if (url.includes("/metrics"))
      return { data: { success: true, data: METRICS } };
    if (url.includes("bank-accounts"))
      return { data: { success: true, data: [] } };
    return { data: { success: false } };
  });
};

describe("QrMetrics (DES-28)", () => {
  beforeEach(() => {
    executeMock.mockReset();
    mockUser = { id: "u1", fosrole_id: null };
  });

  it("muestra totales y conteo por estado", async () => {
    mockApi();
    render(<QrMetrics />);

    await waitFor(() =>
      expect(screen.getByText("QR generados")).toBeInTheDocument(),
    );
    expect(screen.getByText("4")).toBeInTheDocument();
    // Cada estado aparece en el filtro Y en la grilla de conteos
    expect(screen.getAllByText("Pendiente")).toHaveLength(2);
    expect(screen.getAllByText("Reemplazado")).toHaveLength(2);
    expect(screen.getAllByText("Expirado")).toHaveLength(2);
  });

  it("el filtro de condominio existe solo para FOS", async () => {
    mockApi();
    mockUser = {
      id: "u1",
      fosrole_id: 1,
      clients: [{ id: "c1", name: "Condominio Uno" }],
    };
    const { container, unmount } = render(<QrMetrics />);
    await waitFor(() =>
      expect(container.querySelector("#metrics-client")).not.toBeNull(),
    );
    unmount();

    mockUser = { id: "u2", fosrole_id: null, clients: [{ id: "c1", name: "X" }] };
    const { container: c2 } = render(<QrMetrics />);
    await waitFor(() =>
      expect(c2.querySelector("#qr-metrics")).not.toBeNull(),
    );
    expect(c2.querySelector("#metrics-client")).toBeNull();
  });
});
