import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import { ChartType } from "@/mk/components/ui/Graphs/GraphsTypes";

export type FinancialFlowData = {
  inicial: number[];
  ingresos: number[];
  egresos: number[];
  saldos: number[];
};

type Props = {
  labels: string[];
  balance: FinancialFlowData;
  chartType?: ChartType;
  height?: number | string;
  barGap?: number;
  seriesNames?: [string, string, string, string];
};

export const FINANCIAL_FLOW_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#d946ef",
];

const DEFAULT_SERIES_NAMES = [
  "Saldo inicial",
  "Ingresos",
  "Egresos",
  "Saldo acumulado",
] as [string, string, string, string];

export default function FinancialFlowChart({
  labels,
  balance,
  chartType = "area",
  height = 310,
  barGap,
  seriesNames = DEFAULT_SERIES_NAMES,
}: Props) {
  return (
    <GraphBase
      data={{
        labels,
        values: [
          { name: seriesNames[0], values: balance.inicial },
          { name: seriesNames[1], values: balance.ingresos },
          { name: seriesNames[2], values: balance.egresos },
          { name: seriesNames[3], values: balance.saldos },
        ],
      }}
      chartTypes={[chartType]}
      options={{
        height,
        variant: "dashboard",
        colors: FINANCIAL_FLOW_COLORS,
        ...(barGap !== undefined && { barGap }),
      }}
    />
  );
}
