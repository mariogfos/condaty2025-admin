import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Payments from "../Payments";

const mockUserCan = vi.fn();
const mockList = vi.fn(() => <div data-testid="mock-list">List Content</div>);
const mockOnFilter = vi.fn();

vi.mock("../hooks/usePayments", () => ({
  default: () => ({
    List: mockList,
    onFilter: mockOnFilter,
    userCan: mockUserCan,
    modPermission: "payments",
    openCustomFilter: false,
    setOpenCustomFilter: vi.fn(),
    customDateErrors: {},
    setCustomDateErrors: vi.fn(),
    rowContextMenu: {},
    goToCategories: vi.fn(),
    extraButtons: [],
  }),
}));

vi.mock("@/components/auth/NotAccess/NotAccess", () => ({
  default: () => <div data-testid="not-access">No Access</div>,
}));

describe("Payments Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserCan.mockReturnValue(true);
  });

  it("renderiza la lista de ingresos correctamente", () => {
    render(<Payments />);
    expect(screen.getByTestId("mock-list")).toBeInTheDocument();
  });

  it("muestra la vista de NotAccess si el usuario no tiene permisos", () => {
    mockUserCan.mockReturnValue(false);
    render(<Payments />);
    expect(screen.getByTestId("not-access")).toBeInTheDocument();
  });
});
