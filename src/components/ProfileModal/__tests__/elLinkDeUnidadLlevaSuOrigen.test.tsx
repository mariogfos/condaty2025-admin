/**
 * CDT-56 — el tercer origen del detalle de unidad. Este modal ya mandaba
 * `returnTo=owners`; el test lo pinea para que el arreglo de Morosos no se lo
 * lleve puesto. 🔴 Acá `router.back()` sería incorrecto: volvería a la pantalla
 * de atrás con el modal ya cerrado.
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/owners",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

// El Avatar arrastra el Image compartido, que exige ImageModalProvider.
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: () => <div />,
}));

// ⚠️ La respuesta tiene que conservar su IDENTIDAD entre renders: el modal la
// tiene en las deps de un useEffect que hace setState. Un objeto nuevo por
// render lo mete en un bucle infinito y el worker de vitest muere por memoria.
const { axiosStub } = vi.hoisted(() => ({
  axiosStub: {
    data: {
      data: [
        {
          id: 9,
          name: "Ana",
          last_name: "Perez",
          unidades: [{ id: 42, nro: "A-101", type: { name: "Unidad" } }],
        },
      ],
    },
    reLoad: () => {},
    execute: () => {},
    loaded: true,
  },
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => axiosStub,
}));

import ProfileModal from "../ProfileModal";

describe("CDT-56 · ProfileModal sigue mandando su origen", () => {
  beforeEach(() => mockPush.mockClear());

  it("abre el detalle con returnTo=owners", () => {
    const { container } = render(
      <ProfileModal
        open
        onClose={vi.fn()}
        dataID={9}
        type="owner"
        title="Ana"
      />,
    );

    // El nro de la unidad también sale en "Domicilio": el que navega es el
    // span de la lista "Propietario de".
    const link = container.querySelector('[class*="unitLink"]');
    expect(link).toHaveTextContent("Unidad A-101");
    fireEvent.click(link!);

    expect(mockPush).toHaveBeenCalledWith(
      "/units/42?returnTo=owners&userType=owner",
    );
  });
});
