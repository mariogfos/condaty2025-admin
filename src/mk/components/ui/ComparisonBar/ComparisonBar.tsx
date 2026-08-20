import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import style from './ComparisonBar.module.css';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ComparisonBarProps {
  data: {
    total: number; 
    progress: number; 
  };
  labels: {
    totalLabel: string; 
    progressLabel: string;
  };
  colors: {
    totalColor: string; 
    progressColor: string; 
  };
  range?: boolean;
  height?: number;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({
  data,
  labels,
  colors,
  range = false,
  height
}) => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [chartSeries, setChartSeries] = useState<any>(null);

  useEffect(() => {
    if (data) {
      const chartColors = [colors.progressColor, colors.totalColor];

      const options = {
        series: [
          {
            name: "Cantidad",
            data: [data.progress, data.total],
          },
        ],
        chart: {
          height: height || 350,
          type: "bar",
          toolbar: {
            show: false,
          },
        },
        colors: chartColors,
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
            return val.toLocaleString();
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
            fillColors: chartColors,
            radius: 10,
          },
          itemMargin: {
            horizontal: 16,
          },
          customLegendItems: [labels.progressLabel, labels.totalLabel],
        },
        xaxis: {
          categories: ["", ""],
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
              return val.toLocaleString();
            },
          },
        },
      };

      setChartOptions(options);
      setChartSeries(options.series);
    }
  }, [data, colors, labels, height]);

  if (!data || !chartOptions || !chartSeries) {
    return <div>Cargando...</div>;
  }

  return (
    <div className={style['comparisonBar']}>
      <ReactApexChart
        options={chartOptions}
        series={chartSeries}
        type="bar"
        height={height || 400}
      />
      
    </div>
  );
};

export default ComparisonBar;
