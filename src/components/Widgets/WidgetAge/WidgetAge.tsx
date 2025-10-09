"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import WidgetBase from "../WidgetBase/WidgetBase";
import styles from "./WidgetAge.module.css";
import { formatNumber } from "../../../mk/utils/numbers";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type WidgetAgeProps = {
  widget2: {
    "0": number;
    "18-20": number;
    "21-30": number;
    "31-40": number;
    "41-50": number;
    "51-60": number;
    "61-70": number;
    "71-80": number;
    "80+": number;
  };
  title?: string | any;
};

const WidgetAge = ({ widget2, title }: WidgetAgeProps) => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [chartSeries, setChartSeries] = useState<any>(null);

  useEffect(() => {
    if (widget2) {
      const colors = [
        "rgba(249, 231, 159, 1)",
        "rgba(171, 235, 198, 1)",
        "rgba(245, 183, 177, 1)",
        "rgba(215, 189, 226, 1)",
        "rgba(241, 148, 138, 1)",
        "rgba(174, 214, 241, 1)",
        "rgba(247, 220, 111, 1)",
        "rgba(170, 183, 184, 1)",
        "rgba(247, 220, 111, 1)",
      ];

      const categories = Object.keys(widget2)?.map((key) =>
        key === "0" ? "No indicado" : key
      );
      const data = Object.values(widget2);

      const dataLabelColors = data?.map((val) =>
        val === 0 ? "#858a8f" : "#858a8f"
      );

      const options = {
        chart: {
          type: "bar",
          height: 350,
          toolbar: {
            show: false,
          },
        },
        colors: colors,
        plotOptions: {
          bar: {
            columnWidth: "65%",
            distributed: true,
            borderRadius: 5,
            borderRadiusApplication: "end",
            endingShape: "flat",
            dataLabels: {
              position: "top",
            },
            horizontal: true,
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return val.toLocaleString();
          },
          offsetX: 24,
          style: {
            fontSize: "12px",
            colors: dataLabelColors,
          },
        },
        xaxis: {
          categories: categories,
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
          customLegendItems: categories,
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function (val: number) {
              return val.toLocaleString();
            },
          },
        },
      };

      setChartOptions(options);
      setChartSeries([{ name: "Cantidad", data: data }]);
    }
  }, [widget2]);

  if (!widget2 || !chartOptions || !chartSeries) {
    return (
      <WidgetBase title={title ? title : "Edad"} className={styles.widgetAge}>
        <div>Cargando...</div>
      </WidgetBase>
    );
  }

  return (
    <WidgetBase title={title ? title : "Edad"} className={styles.widgetAge}>
      <div>
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type="bar"
          height={380}
        />
      </div>
    </WidgetBase>
  );
};

export default WidgetAge;
