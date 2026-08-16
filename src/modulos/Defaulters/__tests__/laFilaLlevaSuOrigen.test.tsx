/**
 * CDT-56 — Morosos no tiene detalle propio: abre el de Unidades. Si la fila no
 * manda su origen, el botón "atrás" de ese detalle no tiene con qué volver acá.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/defaulters",
  useSearchParams: () => new URLSearchParams(),
}));

// Sin AxiosContext, `waiting` es undefined y LoadingScreen se queda en el
// skeleton para siempre.
vi.mock("@/mk/components/ui/LoadingScreen/LoadingScreen", () => ({
  default: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: () => ({
    userCan: () => true,
    data: { data: [{ dpto_id: 42 }] },
    extraData: {},
    List: ({ onRowClick }: any) => (
      <button data-testid="fila" onClick={() => onRowClick({ dpto_id: 42 })}>
        A-101
      </button>
    ),
  }),
}));

import Defaulters from "../Defaulters";

describe("CDT-56 · la fila de Morosos abre el detalle con su origen", () => {
  beforeEach(() => mockPush.mockClear());

  it("manda returnTo=defaulters en el query string", () => {
    render(<Defaulters />);

    fireEvent.click(screen.getByTestId("fila"));

    expect(mockPush).toHaveBeenCalledWith("/units/42?returnTo=defaulters");
  });
});
