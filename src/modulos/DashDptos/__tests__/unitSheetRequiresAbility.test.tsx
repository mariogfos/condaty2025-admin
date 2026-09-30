/**
 * La ficha de la unidad pide la R de alguna de las pantallas desde las que se
 * entra: Unidades (`units`), Residentes (`owners`) o Morosos (`defaulters`).
 *
 * 🔴 Lo que se mide no es sólo el `<NotAccess/>`: sin la habilidad la ficha NO
 * debe pedir `v3/dptos` DET. Por eso la guarda vive en un envoltorio y el test
 * afirma que `useAxios` ni siquiera se montó.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

let abilities: string[] = [];
const mockUseAxios = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/units/7",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test User" },
    // Por prefijo, como el `userCan` real: `abilities` son cadenas `modulo:letras`.
    userCan: (ability: string, action: string) =>
      abilities.some(
        (a) => a.startsWith(ability + ":") && a.split(":")[1].includes(action),
      ),
    store: {},
    setStore: vi.fn(),
    showToast: vi.fn(),
  }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: (...args: unknown[]) => {
    mockUseAxios(...args);
    return {
      data: { data: { id: 7, nro: "A-101" }, extraData: {} },
      reLoad: vi.fn(),
      execute: vi.fn(),
      loaded: true,
    };
  },
}));

vi.mock("@/components/auth/NotAccess/NotAccess", () => ({
  default: () => <div data-testid="not-access" />,
}));
vi.mock("../UnitInfo/UnitInfo", () => ({ default: () => <div /> }));
vi.mock("../AccessTable/AccessTable", () => ({ default: () => <div /> }));
vi.mock("../ReservationsTable/ReservationsTable", () => ({
  default: () => <div />,
}));
vi.mock("../TitleRender/TitleRender", () => ({ default: () => <div /> }));
vi.mock("../UnitFinanceHistory/UnitFinanceHistory", () => ({
  default: () => <div />,
}));
vi.mock("../HistoryOwnership/HistoryOwnership", () => ({
  default: () => <div />,
}));
vi.mock("../../Owners/RenderView/RenderView", () => ({
  default: () => <div />,
}));
vi.mock("../../Owners/RenderForm/RenderForm", () => ({
  default: () => <div />,
}));
vi.mock("../../Dptos/RenderForm", () => ({ default: () => <div /> }));
vi.mock("@/components/ProfileModal/ProfileModal", () => ({
  default: () => <div />,
}));

import DashDptos from "../DashDptos";

describe("la ficha de la unidad pide habilidad", () => {
  beforeEach(() => {
    mockUseAxios.mockClear();
  });

  it("sin la R de units, owners ni defaulters muestra NotAccess y no pide la ficha", () => {
    // `units:CUD` sin R y otras habilidades con R: ninguna abre la ficha.
    abilities = ["units:CUD", "guards:CRUD", "home:R", "unittypes:R"];
    render(<DashDptos id={7} />);

    expect(screen.getByTestId("not-access")).toBeInTheDocument();
    expect(screen.queryByText("Volver a lista de unidades")).toBeNull();
    expect(mockUseAxios).not.toHaveBeenCalled();
  });

  it.each(["units:R", "owners:R", "defaulters:R"])(
    "con %s muestra la ficha y la pide",
    (ability) => {
      abilities = [ability];
      render(<DashDptos id={7} />);

      expect(screen.queryByTestId("not-access")).toBeNull();
      expect(screen.getByText("Volver a lista de unidades")).toBeInTheDocument();
      expect(mockUseAxios).toHaveBeenCalledWith(
        "/v3/dptos",
        "GET",
        expect.objectContaining({ fullType: "DET", dpto_id: 7 }),
      );
    },
  );
});
