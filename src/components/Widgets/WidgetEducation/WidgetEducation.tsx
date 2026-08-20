"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import WidgetBase from "../WidgetBase/WidgetBase";
import styles from "./WidgetEducation.module.css";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type WidgetEducationProps = {
  widget4: any;
  title?: string | any;
  educations: any;
  className?: string;
};

const WidgetEducation = ({
  widget4,
  title,
  educations,
  className,
}: WidgetEducationProps) => {
  const [chartOptions, setChartOptions]: any = useState(null);
  const [chartSeries, setChartSeries]: any = useState(null);

  // const educations = { data: [] };

  useEffect(() => {
    if (widget4 && educations) {
      // Agregar 'Sin verificar' al inicio de educations
      const modifiedEducations = [
        { id: 0, name: "No indicado", status: "A" },
        ...educations,
      ];

      const categories = modifiedEducations?.map((item: any) => item.name);

      // Aquí comprobamos si el id es 0, para agregar el valor "Sin verificar" como valor
      const data = modifiedEducations?.map((item: any) => {
        return widget4[item.id] || 0; // Si el valor de widget4[item.id] es 0, usa 0
      });
      const dataLabelColors = data.map((val: any) =>
        val === 0 ? "#858a8f" : "#858a8f"
      );

      const colors = [
        "rgba(249, 231, 159, 1)",
        "rgba(171, 235, 198, 1)",
        "rgba(245, 183, 177, 1)",
        "rgba(215, 189, 226, 1)",
        "rgba(241, 148, 138, 1)",
        "rgba(174, 214, 241, 1)",
        "rgba(170, 183, 184, 1)",
      ];
      const repeatedColors = categories.map(
        (_, index) => colors[index % colors.length]
      );

      const options = {
        chart: {
          type: "bar",
          height: 300,
          toolbar: {
            show: false,
          },
        },
        colors: repeatedColors,
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
            fillColors: repeatedColors,
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
  }, [widget4, educations]);

  if (!widget4 || !chartOptions || !chartSeries) {
    return (
      <WidgetBase
        title={title ? title : "Educación"}
        className={styles.widgetSexo}
      >
        <div>Cargando...</div>
      </WidgetBase>
    );
  }

  return (
    <WidgetBase
      title={title ? title : "Educación"}
      className={`${styles.widgetSexo}  ${className}`}
      style={{ marginTop: 16 }}
    >
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

export default WidgetEducation;
