"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import WidgetBase from "../WidgetBase/WidgetBase";
import styles from "./WidgetVerifiedAccount.module.css";
import { IconAccess, IconDot } from "../../layout/icons/IconsBiblioteca";
import { formatNumber } from "../../../mk/utils/numbers";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type Widget5Data = {
  verify: number;
  no_verify: number;
};

type WidgetVerifiedAccountProps = {
  widget5?: Widget5Data;
};

const WidgetVerifiedAccount = ({ widget5 }: WidgetVerifiedAccountProps) => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [chartSeries, setChartSeries] = useState<any>(null);

  useEffect(() => {
    if (widget5) {
      const options = {
        chart: {
          type: "donut",
          height: 400,
        },
        labels: ["Cuentas validadas", "Cuentas sin validar"],
        colors: ["#39ACEC", "#DA5D5D"],
        legend: {
          show: false,
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return val.toFixed(1) + "%";
          },
          dropShadow: {
            enabled: false,
          },
          style: {
            fontSize: "14px",
            colors: ["#ffffff"],
          },
          background: {
            enabled: true,
            foreColor: "#101111",
            padding: 6,
            borderRadius: 6,
            borderWidth: 1,
          },
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function (val: number) {
              return val.toLocaleString();
            },
          },
        },
        stroke: {
          show: false,
        },
      };

      const series = [widget5.verify, widget5.no_verify];

      setChartOptions(options);
      setChartSeries(series);
    }
  }, [widget5]);

  if (!widget5 || !chartOptions || !chartSeries) {
    return (
      <WidgetBase
        title="Cuentas Validadas"
        className={styles.widgetVerifiedAccount}
      >
        <div>Cargando...</div>
      </WidgetBase>
    );
  }

  return (
    <WidgetBase title="Cuentas Validadas">
      <div className={styles.widgetVerifiedAccount}>
        <div>
          <div>
            <h2>
              <IconDot
                style={{
                  color: "#39ACEC",
                  width: "12px",
                }}
              />
              Validadas
            </h2>
            <p>{formatNumber(widget5.verify, 0)}</p>
          </div>
          <div>
            <h2>
              <IconDot
                style={{
                  color: "#DA5D5D",
                  width: "12px",
                }}
              />
              Sin validar
            </h2>
            <p>{formatNumber(widget5.no_verify, 0)}</p>
          </div>
        </div>
        <div>
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="donut"
            height={400}
          />
        </div>
      </div>
    </WidgetBase>
  );
};

export default WidgetVerifiedAccount;
