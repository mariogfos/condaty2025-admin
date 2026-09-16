import { render, screen } from "@testing-library/react";
import { vi, describe, expect, it, beforeEach } from "vitest";

const graphBaseSpy = vi.fn();

vi.mock("@/mk/components/ui/Graphs/GraphBase", () => ({
  default: (props: unknown) => {
    graphBaseSpy(props);
    return <div data-testid="financial-flow-chart" />;
  },
}));

import FinancialFlowChart, {
  FINANCIAL_FLOW_COLORS,
} from "@/components/Widgets/WidgetsDashboard/WidgetGraphResume/FinancialFlowChart";

describe("FinancialFlowChart", () => {
  beforeEach(() => {
    graphBaseSpy.mockClear();
  });

  it("uses the dashboard graph configuration shared by Home and Balance", () => {
    render(
      <FinancialFlowChart
        labels={["Sept"]}
        balance={{
          inicial: [9700],
          ingresos: [4800],
          egresos: [0],
          saldos: [14500],
        }}
        chartType="bar"
        height={350}
      />,
    );

    expect(screen.getByTestId("financial-flow-chart")).toBeInTheDocument();
    expect(graphBaseSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chartTypes: ["bar"],
        options: {
          height: 350,
          variant: "dashboard",
          colors: FINANCIAL_FLOW_COLORS,
        },
        data: {
          labels: ["Sept"],
          values: [
            { name: "Saldo inicial", values: [9700] },
            { name: "Ingresos", values: [4800] },
            { name: "Egresos", values: [0] },
            { name: "Saldo acumulado", values: [14500] },
          ],
        },
      }),
    );
  });
});
