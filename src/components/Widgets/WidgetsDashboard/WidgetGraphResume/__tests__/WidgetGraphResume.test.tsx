import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WidgetGraphResume from "@/components/Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume";
import GraphAdapterLine from "@/mk/components/ui/Graphs/GraphAdapterLine";

const mocks = vi.hoisted(() => ({
  graphProps: vi.fn(),
}));

vi.mock("@/i18n/useScopedI18n", () => ({
  useScopedI18n: () => ({
    localeTag: "es-BO",
    translate: (key: string, values: Record<string, string> = {}) => {
      const template =
        ({
          area: "Área",
          attentionCashFlow: "Requiere atención",
          balancedCashFlow: "Flujo equilibrado",
          balancedInsight: "En {month}, el flujo quedó equilibrado.",
          bar: "Barra",
          cumulativeBalance: "Saldo acumulado",
          firstRecordedMonth: "Primer mes con movimientos",
          incomes: "Ingresos",
          line: "Línea",
          monthlyMovements: "Movimientos del mes",
          negativeInsight:
            "En {month}, los egresos superaron los ingresos por Bs. {amount}.",
          netResult: "Resultado neto",
          openingBalance: "Saldo inicial",
          outlays: "Egresos",
          periodReading: "Lectura del periodo",
          positiveCashFlow: "Flujo positivo",
          positiveInsight:
            "En {month}, los ingresos superaron los egresos por Bs. {amount}.",
          subtitle: "Resumen del año",
          title: "Resumen general",
          versusPreviousMonth: "{value} vs. {month}",
        })[key] || key;

      return Object.entries(values).reduce(
        (message, [name, value]) => message.replace(`{${name}}`, value),
        template,
      );
    },
  }),
}));

vi.mock("@/components/Widgets/WidgetBase/WidgetBase", () => ({
  default: ({ children, className }: any) => (
    <section className={className}>{children}</section>
  ),
}));

vi.mock("@/mk/components/ui/Graphs/GraphBase", () => ({
  default: (props: any) => {
    mocks.graphProps(props);
    return <div data-testid="financial-chart" />;
  },
}));

describe("gráfica financiera del inicio", () => {
  it("muestra cuatro series de área y una lectura operativa del último mes", () => {
    render(
      <WidgetGraphResume
        saldoInicial={100}
        ingresos={[
          { amount: 200, mes: 1 },
          { amount: 100, mes: 2 },
        ]}
        egresos={[
          { amount: 50, mes: 1 },
          { amount: 150, mes: 2 },
        ]}
        periodo="y"
      />,
    );

    expect(mocks.graphProps).toHaveBeenCalledWith(
      expect.objectContaining({
        chartTypes: ["area"],
        data: expect.objectContaining({
          values: expect.arrayContaining([
            expect.objectContaining({
              name: "Saldo acumulado",
              values: [250, 200],
            }),
          ]),
        }),
        options: expect.objectContaining({
          colors: ["#8b98a8", "#00e38c", "#f2a65a", "#8ea7ff"],
          variant: "dashboard",
        }),
      }),
    );
    expect(screen.getByLabelText("Lectura del periodo")).toBeInTheDocument();
    expect(screen.getByText("Requiere atención")).toBeInTheDocument();
    expect(
      screen.getByText(/los egresos superaron los ingresos/),
    ).toBeInTheDocument();
  });

  it("configura curvas suaves, puntos y rellenos degradados por serie", () => {
    const chart = GraphAdapterLine(
      {
        labels: ["Ene", "Feb"],
        values: [
          { name: "Saldo inicial", values: [100, 250] },
          { name: "Ingresos", values: [200, 100] },
          { name: "Egresos", values: [50, 150] },
          { name: "Saldo acumulado", values: [250, 200] },
        ],
      },
      {
        area: true,
        colors: ["#8b98a8", "#00e38c", "#f2a65a", "#8ea7ff"],
        variant: "dashboard",
      },
      { chart: { animations: { enabled: true } } },
    );

    expect(chart.options).toEqual(
      expect.objectContaining({
        chart: expect.objectContaining({ type: "area" }),
        fill: expect.objectContaining({
          gradient: expect.objectContaining({
            opacityFrom: [0.22, 0.28, 0.25, 0.7],
            opacityTo: [0.01, 0.015, 0.012, 0.04],
          }),
          type: "gradient",
        }),
        markers: expect.objectContaining({ size: 4 }),
        stroke: expect.objectContaining({ curve: "smooth" }),
      }),
    );
    expect(chart.data).toHaveLength(4);
  });
});
