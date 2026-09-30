/**
 * `/create-reservas` pide `reservations:C`, la letra del `POST v3/reservations`
 * en el API. Sin ella no se muestra el flujo NI se pide el `EXTRA` de reservas
 * (áreas y unidades del condominio).
 */
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";

let canCreate = false;
const request = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    showToast: vi.fn(),
    userCan: (ability: string, action: string) =>
      canCreate && ability === "reservations" && action === "C",
  }),
}));
vi.mock("@/components/auth/NotAccess/NotAccess", () => ({
  default: () => <div data-testid="not-access" />,
}));
vi.mock("@/modulos/CreateReserva/CreateReserva", () => ({
  default: () => <div data-testid="create-reserva" />,
}));

import CreateReservaPage from "../page";

const renderPage = () =>
  render(
    <AxiosContext.Provider
      value={{ contextInstance: { request } } as any}
    >
      <CreateReservaPage />
    </AxiosContext.Provider>,
  );

describe("la página de alta de reserva", () => {
  beforeEach(() => {
    request.mockReset();
    request.mockResolvedValue({ data: { data: { areas: [] } } });
  });

  it("sin reservations:C muestra NotAccess y no pide nada", async () => {
    canCreate = false;
    renderPage();

    expect(screen.getByTestId("not-access")).toBeInTheDocument();
    // El efecto ya corrió al montarse: si fuera a pedir, ya lo habría hecho.
    await Promise.resolve();
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByTestId("create-reserva")).toBeNull();
  });

  it("con reservations:C pide el EXTRA y muestra el flujo", async () => {
    canCreate = true;
    renderPage();

    expect(await screen.findByTestId("create-reserva")).toBeInTheDocument();
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/v3/reservations",
          params: expect.objectContaining({ fullType: "EXTRA" }),
        }),
      ),
    );
    expect(screen.queryByTestId("not-access")).toBeNull();
  });
});
