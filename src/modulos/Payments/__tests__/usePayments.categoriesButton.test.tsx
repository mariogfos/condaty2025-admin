import React from "react";
import { render, screen, renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useCrud to capture the `extraButtons` prop and render it for inspection
let capturedExtraButtons: any = null;
vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: vi.fn((opts: any) => {
    capturedExtraButtons = opts.extraButtons;
    return {
      List: () => null,
      searchs: { searchBy: "" },
      userCan: vi.fn(() => true),
      extraData: {},
      execute: vi.fn(),
      reLoad: vi.fn(),
      showToast: vi.fn(),
      onView: vi.fn(),
      onDel: vi.fn(),
    };
  }),
}));

import usePayments from "../hooks/usePayments";

describe("usePayments — extraButtons Categories (S96)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedExtraButtons = null;
  });

  it("extraButtons es un array NO vacío con UN botón JSX (no string)", () => {
    renderHook(() => usePayments());
    expect(capturedExtraButtons).toBeDefined();
    expect(Array.isArray(capturedExtraButtons)).toBe(true);
    expect(capturedExtraButtons.length).toBe(1);
  });

  it("el extraButton es un ReactElement (no un objeto plano ni un string)", () => {
    renderHook(() => usePayments());
    const btn = capturedExtraButtons[0];
    // D-104-1: extraButtons debe ser ReactNode[] (JSX elements), no strings ni objetos
    expect(React.isValidElement(btn)).toBe(true);
    // Bug pre-S96: el código pasaba `btn.children` (string "Categorías")
    // en lugar del JSX element, así que NO era un ReactElement.
  });

  it("el botón Categorías navega a /categories?type=I al hacer click", () => {
    renderHook(() => usePayments());
    const btn = capturedExtraButtons[0];
    expect(btn).toBeDefined();
    // El onClick handler debe llamar router.push('/categories?type=I')
    // Simulamos click y verificamos la navegación.
    const { onClick } = btn.props as any;
    expect(typeof onClick).toBe("function");
    onClick();
    expect(mockPush).toHaveBeenCalledWith("/categories?type=I");
  });

  it("el texto del botón es 'Categorías' (no otra cosa)", () => {
    renderHook(() => usePayments());
    const btn = capturedExtraButtons[0];
    // El children del Button debe ser "Categorías"
    const children = (btn.props as any).children;
    expect(children).toBe("Categorías");
  });

  it("el variant del botón es 'secondary' (consistencia con Outlays Egresos)", () => {
    renderHook(() => usePayments());
    const btn = capturedExtraButtons[0];
    const variant = (btn.props as any).variant;
    expect(variant).toBe("secondary");
  });
});
