"use client";
import React, { useEffect, useMemo } from "react";
import { ChartType, ProptypesBase } from "./GraphsTypes";
import dynamic from "next/dynamic";
import Select from "../../forms/Select/Select";
import { useScopedI18n } from "@/i18n/useScopedI18n";
const GraphsAdapter = dynamic(() => import("./GraphsAdapter"), { ssr: false });

type LChartType = {
  id: ChartType;
  name: string;
};
const GraphBase = ({
  chartTypes = null,
  data,
  options,
  background = "#333536",
  downloadPdf = false,
  exportando = false,
}: ProptypesBase & { exportando?: boolean }) => {
  const { translate } = useScopedI18n("graph");
  const [chartType, setChartType] = React.useState<ChartType>(
    chartTypes?.[0] || "bar",
  );
  const lChartType = useMemo<LChartType[]>(() => {
    const availableTypes: ChartType[] = chartTypes?.length
      ? chartTypes
      : ["bar", "donut"];

    return availableTypes.map((type) => ({
      id: type,
      name:
        type == "bar"
          ? translate("bar")
          : type == "radialBar"
            ? "Circular"
          : type == "pie"
            ? translate("pie")
          : type == "donut"
            ? translate("donut")
            : translate("line"),
    }));
  }, [chartTypes, translate]);

  const onChange = (e: any) => {
    setChartType(e.target.value);
  };

  useEffect(() => {
    if (!lChartType.length) return;
    if (!lChartType.some((type) => type.id === chartType)) {
      setChartType(lChartType[0].id);
    }
  }, [chartType, lChartType]);

  return (
    <div className={`bg-[${background}] rounded-3xl my-4 p-8`}>
      {chartTypes && chartTypes.length > 1 && (
        <Select
          label={translate("chartTypeLabel")}
          value={chartType}
          name="type"
          className="w-[180px] "
          onChange={onChange}
          options={lChartType}
          required
        />
      )}
      <div data-i18n-ignore="true">
        <GraphsAdapter
          data={data}
          chartType={chartType}
          options={options}
          downloadPdf={downloadPdf}
          exportando={exportando}
        />
      </div>
    </div>
  );
};

export default GraphBase;
