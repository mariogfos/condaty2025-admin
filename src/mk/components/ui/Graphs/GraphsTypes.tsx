export type ChartType =
  | "line"
  | "bar"
  | "radialBar"
  | "pie"
  | "donut"
  | "radar"
  | "polarArea"
  | "bubble"
  | "scatter"
  | "heatmap"
  | "candlestick"
  | "radialBar"
  | "treemap"
  | "sunburst"
  | "boxPlot"
  | "histogram"
  | "funnel"
  | "pyramid"
  | "gantt"
  | "waterfall";

type dataGraph = {
  label?: string;
  value: number;
  color?: string;
};
type optionsType = {
  title?: string;
  subtitle?: string;
  label?: string;
  chart?: any;
  stacked?: boolean;
  colors?: string[];
  download?: number;
  height?: number | string;
  width?: number | string;
  offsetY?: number;
  money?: boolean;
  centerText?: string;
  centerTextStyle?: {
    color?: string;
    fontSize?: string;
    fontWeight?: string;
  };
};
type commonTypes = {
  data: any;
  options?: optionsType;
  oDef?: any;
  background?: string;
  downloadPdf?: boolean;
};
export interface ProptypesAdapter extends commonTypes {
  chartType: ChartType;
}

export interface ProptypesBase extends commonTypes {
  chartTypes: ChartType[] | null;
}

export const COLORS20 = [
  "#00E38C",
  "#4C98DF",
  "#F37F3D",
  "#F2C85B",
  "#D2527F",
  "#7E57C2",
  "#26A69A",
  "#EF5350",
  "#5C6BC0",
  "#66BB6A",
  "#FFCA28",
  "#8D6E63",
  "#26C6DA",
  "#AB47BC",
  "#FF7043",
  "#9CCC65",
  "#7B1FA2",
  "#EC407A",
  "#78909C",
  "#FFA726",
];
//agregaraaa
