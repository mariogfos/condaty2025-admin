import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RenderView from "../RenderView";

// AuthProvider mocked globally in setup.ts

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children }: any) => (open ? <div>{children}</div> : null),
}));

vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: () => <div data-testid="pending-periods-table" />,
}));

vi.mock(
  "../../../Payments/RenderView/RenderView",
  () => ({
    default: () => <div data-testid="payment-render-view" />,
  }),
);

vi.mock("../../../Payments/api", () => ({
  paymentsApi: {
    resolvedPayment: vi.fn(() => "/v3/payments/resolved"),
  },
}));

vi.mock("@/i18n/translationGuards", () => ({
  shouldIgnoreValueTranslationContext: () => false,
}));

// CSS modules
vi.mock("../RenderView.module.css", () => ({ default: {} }));

const mockExecute = vi.fn();

const baseItem = {
  id: 1,
  status: "A",
  amount: "100.00",
  maintenance_amount: "0",
  penalty_amount: "0",
  dpto: { nro: "101", description: "Dpto 101" },
};

describe("ExpensesDetails RenderView — período cell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({
      data: { success: false },
    });
  });

  it("EXPENSE row: muestra el período desde dpto-level (month/year) ignorando debt head", () => {
    const item = {
      ...baseItem,
      month: 3,
      year: 2025,
      debt: { month: 99, year: 9999 },
    };

    render(
      <RenderView
        open={true}
        onClose={vi.fn()}
        item={item}
        execute={mockExecute}
      />,
    );

    expect(screen.getByText("Mar/2025")).toBeInTheDocument();
  });

  it("SHARED row: muestra el período desde shared fallback cuando month/year son null", () => {
    const item = {
      ...baseItem,
      month: null,
      year: null,
      shared: { month: 5, year: 2024 },
    };

    render(
      <RenderView
        open={true}
        onClose={vi.fn()}
        item={item}
        execute={mockExecute}
      />,
    );

    expect(screen.getByText("May/2024")).toBeInTheDocument();
  });
});
