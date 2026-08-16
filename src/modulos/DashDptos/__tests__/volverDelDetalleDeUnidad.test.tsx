/**
 * CDT-56 — el botón "atrás" del detalle de una unidad.
 *
 * 🔴 Lo que mide de verdad este archivo es que la ETIQUETA y el DESTINO no se
 * puedan desincronizar: el bug original venía anunciado en la etiqueta ("Volver
 * a lista de unidades" viniendo de Morosos) y nadie lo leyó. Cada caso lee el
 * rótulo del botón, lo aprieta, y afirma la ruta a la que se fue.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockPush = vi.fn();
let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/units/7",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test User" },
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast: vi.fn(),
  }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: { data: { id: 7, nro: "A-101" }, extraData: {} },
    reLoad: vi.fn(),
    execute: vi.fn(),
    loaded: true,
  }),
}));

// Los hijos del detalle no participan del camino de vuelta: se apagan para que
// el test mida el header y nada más.
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

const casos = [
  {
    origen: "Morosos (CDT-56)",
    search: "returnTo=defaulters",
    label: "Volver a morosos",
    href: "/defaulters",
  },
  {
    origen: "ProfileModal / Residentes",
    search: "returnTo=owners&userType=owner",
    label: "Volver a residentes",
    href: "/owners",
  },
  {
    origen: "Unidades (sin returnTo)",
    search: "",
    label: "Volver a lista de unidades",
    href: "/units",
  },
  {
    origen: "un returnTo desconocido cae al default",
    search: "returnTo=marte",
    label: "Volver a lista de unidades",
    href: "/units",
  },
];

describe("CDT-56 · vuelta del detalle de unidad", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it.each(casos)(
    "desde $origen: la etiqueta dice '$label' y el botón lleva a $href",
    ({ search, label, href }) => {
      currentSearch = search;
      render(<DashDptos id={7} />);

      const boton = screen.getByText(label);
      fireEvent.click(boton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(href);
    },
  );
});
