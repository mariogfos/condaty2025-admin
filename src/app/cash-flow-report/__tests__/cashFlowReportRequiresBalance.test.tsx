/**
 * `/cash-flow-report` pide `balance:R`, la letra que el API exige en
 * `GET v3/payments/export-cash-flow`. Antes sólo la pedía el menú.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

let canBalance = false;
const userCan = vi.fn(
  (ability: string, action: string) =>
    canBalance && ability === "balance" && action === "R",
);

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ setStore: vi.fn(), userCan }),
}));
vi.mock("@/components/auth/NotAccess/NotAccess", () => ({
  default: () => <div data-testid="not-access" />,
}));
vi.mock("@/modulos/Balance/CashFlowReportModal/CashFlowReportModal", () => ({
  default: () => <div data-testid="cash-flow-report" />,
}));

import CashFlowReportPage from "../page";

describe("la página del reporte de flujo de efectivo", () => {
  it("sin balance:R muestra NotAccess y no el reporte", () => {
    canBalance = false;
    render(<CashFlowReportPage />);

    expect(screen.getByTestId("not-access")).toBeInTheDocument();
    expect(screen.queryByTestId("cash-flow-report")).toBeNull();
  });

  it("con balance:R muestra el reporte", () => {
    canBalance = true;
    render(<CashFlowReportPage />);

    expect(screen.getByTestId("cash-flow-report")).toBeInTheDocument();
    expect(screen.queryByTestId("not-access")).toBeNull();
  });
});
