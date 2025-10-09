"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import WidgetBase from "../WidgetBase/WidgetBase";
import styles from "./WidgetSexo.module.css";
import { formatNumber } from "../../../mk/utils/numbers";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type Widget3Data = {
  cant_m: number;
  cant_f: number;
  cant_x: number;
  cant_n: number;
};

type WidgetSexoProps = {
  widget3?: Widget3Data;
};

const WidgetSexo = ({ widget3 }: WidgetSexoProps) => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [chartSeries, setChartSeries] = useState<any>(null);

  useEffect(() => {
    if (widget3) {
      const colors = [
        "rgba(163, 227, 208, 1)",
        "rgba(193, 199, 243, 1)",
        "rgba(230, 216, 172, 1)",
      ];

      const options = {
        series: [
          {
            name: "Cantidad",
            data: [widget3?.cant_m, widget3?.cant_f, widget3?.cant_n],
          },
        ],
        chart: {
          height: 350,
          type: "bar",
          toolbar: {
            show: false,
          },
        },
        colors: colors,
        plotOptions: {
          bar: {
            columnWidth: "30%",
            distributed: true,
            borderRadius: 10,
            borderRadiusApplication: "end",
            endingShape: "flat",
            dataLabels: {
              position: "top",
            },
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return formatNumber(val, 0);
          },
          offsetY: -20,
          style: {
            fontSize: "12px",
            colors: ["#C6C6C6"],
          },
        },
        legend: {
          show: true,
          position: "bottom",
          horizontalAlign: "center",
          labels: {
            colors: "#C6C6C6",
          },
          markers: {
            fillColors: colors,
            radius: 10,
          },
          itemMargin: {
            horizontal: 16,
          },
          customLegendItems: ["Hombres", "Mujeres", "Prefiero no decirlo"],
        },
        xaxis: {
          categories: ["", "", ""],
          labels: {
            show: false,
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: "#656F78",
            },
          },
        },
        grid: {
          borderColor: "#656F78",
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function (val: number) {
              return formatNumber(val, 0);
            },
          },
        },
      };

      setChartOptions(options);
      setChartSeries(options.series);
    }
  }, [widget3]);

  if (!widget3 || !chartOptions || !chartSeries) {
    return (
      <WidgetBase title="Sexo" className={styles.widgetSexo}>
        <div>Cargando...</div>
      </WidgetBase>
    );
  }

  return (
    <WidgetBase title="Sexo" className={styles.widgetSexo}>
      <div>
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type="bar"
          height={400}
        />
      </div>
    </WidgetBase>
  );
};

export default WidgetSexo;
