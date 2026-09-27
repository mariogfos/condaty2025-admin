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
import WidgetGrafBalance from "@/components/Widgets/WidgetGrafBalance/WidgetGrafBalance";

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

  /**
   * El Flujo de efectivo de /balance dibuja el MISMO gráfico que el inicio
   * (`9fdb045d`): si vuelve a armar su propio `GraphBase`, los colores y la
   * variante se separan y la leyenda deja de describir las series.
   */
  it("Balance reutiliza el gráfico del inicio, con el tipo que elige el usuario", () => {
    render(
      <WidgetGrafBalance
        ingresos={[{ amount: 4800, mes: 9 }]}
        egresos={[{ amount: 100, mes: 9 }]}
        chartTypes={["line"]}
        periodo="y"
      />,
    );

    expect(graphBaseSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        chartTypes: ["line"],
        options: expect.objectContaining({
          variant: "dashboard",
          colors: FINANCIAL_FLOW_COLORS,
        }),
      }),
    );
  });
});
