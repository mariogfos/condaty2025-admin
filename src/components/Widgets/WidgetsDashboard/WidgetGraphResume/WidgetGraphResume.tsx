import React, { useEffect, useState } from "react";

import { MONTHS_S_GRAPH, getDateStr, getDateStrMes, getNow } from "@/mk/utils/date";
import { ChartType } from "@/mk/components/ui/Graphs/GraphsTypes";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import WidgetBase from "../../WidgetBase/WidgetBase";
import styles from "./WidgetGraphResume.module.css";
import { formatNumber } from "@/mk/utils/numbers";
import EmptyData from "@/components/NoData/EmptyData";
import Select from "@/mk/components/forms/Select/Select";


type PropsType = {
  saldoInicial?: number;
  ingresos: { amount: number; mes: number }[];
  egresos: { amount: number; mes: number }[];
  chartTypes?: ChartType[];
  h?: number | string;
  title?: string;
  subtitle?: string;
  className?: string;
  periodo?: string;
  showEmptyData?: boolean;
  emptyDataProps?: {
    message?: string;
    line2?: string;
    h?: number;
    icon?: React.ReactNode;
  };
};
const WidgetGraphResume = ({
  saldoInicial = 0,
  ingresos,
  egresos,
  chartTypes = ["bar", "line"],
  h = 350,
  title,
  subtitle,
  className,
  periodo = "",
  showEmptyData = false,
  emptyDataProps,
}: PropsType) => {
  const [balance, setBalance] = useState({
    inicial: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ingresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    egresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    saldos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });

  const [meses, setMeses]: any = useState([]);

  // nuevo: estado para controlar el tipo de gráfico desde el header
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(
    chartTypes && chartTypes.length > 0 ? chartTypes[0] : "bar"
  );
  useEffect(() => {
    // Si cambian los tipos disponibles y el seleccionado no está, ajustarlo
    if (chartTypes && chartTypes.length > 0) {
      if (!chartTypes.includes(selectedChartType)) {
        setSelectedChartType(chartTypes[0]);
      }
    }
  }, [chartTypes]);

  const chartTypeOptions = (chartTypes || ["bar", "line"]).map((type) => ({
    id: type,
    name:
      type === "bar"
        ? "Barra"
        : type === "line"
        ? "Línea"
        : type === "donut"
        ? "Donut"
        : type === "pie"
        ? "Torta"
        : "Línea",
  }));

  useEffect(() => {
    const lista = {
      inicial: [saldoInicial || 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ingresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      egresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      saldos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    // ingresos?.map((item) => {
    //   lista.ingresos[item.mes - 1] =
    //     lista.ingresos[item.mes - 1] +
    //     Number(item.expensa) +
    //     Number(item.multa);
    //   lista.saldos[item.mes - 1] =
    //     lista.saldos[item.mes - 1] + Number(item.expensa) + Number(item.multa);
    // });
    let mesI = 0;
    let mesF = 12;
    let lmeses = MONTHS_S_GRAPH.slice(0, 12);
    ingresos?.map((item) => {
      if (item.mes > mesI) mesI = item.mes;
      if (item.mes < mesF) mesF = item.mes;
      lista.ingresos[item.mes - 1] =
        lista.ingresos[item.mes - 1] + Number(item.amount);

      lista.saldos[item.mes - 1] =
        lista.saldos[item.mes - 1] + Number(item.amount);
    });

    egresos?.map((item) => {
      lista.egresos[item.mes - 1] =
        lista.egresos[item.mes - 1] + Number(item.amount);

      lista.saldos[item.mes - 1] =
        lista.saldos[item.mes - 1] - Number(item.amount);
    });

    let inicial = saldoInicial || 0;
    lista.saldos.map((item, index) => {
      if (index > 0) inicial = lista.saldos[index - 1];
      lista.saldos[index] = lista.saldos[index] + inicial;
      if (index > 0) lista.inicial[index] = lista.saldos[index - 1];
    });

    lista.saldos.map((item, index) => {
      if (lista.ingresos[index] == 0 && lista.egresos[index] == 0) {
        lista.saldos[index] = 0;
        lista.inicial[index] = 0;
      }
    });

    if (periodo != "y" && periodo != "ly") {
      if (mesF < 12) {
        lista.saldos.splice(mesF);
        lista.inicial.splice(mesF);
        lista.ingresos.splice(mesF);
        lista.egresos.splice(mesF);
        lmeses.splice(mesF);
      }
      if (mesI > 0) {
        lista.saldos.splice(0, mesI - 1);
        lista.inicial.splice(0, mesI - 1);
        lista.ingresos.splice(0, mesI - 1);
        lista.egresos.splice(0, mesI - 1);
        lmeses.splice(0, mesI - 1);
      }
    }
    setMeses(lmeses);

    setBalance(lista);
  }, [ingresos, egresos, saldoInicial]);

  // const formattedDate =`Al ${getFormattedDate(currentDate)}`
  const today = new Date();
  const formattedTodayDate = today.getFullYear();
  return (
    <div className={styles.widgetGraphResume + " " + className}>
      <WidgetBase className={styles.widgetBase}>
        <div className={styles.headerRow}>
          <div className={styles.titleBlock}>
            <p className={styles.title}>
              {title || "Resumen general"}
            </p>
            <p className={styles.subtitle}>
              {subtitle ||
                `Este es un resumen general del año ${formattedTodayDate}`}
            </p>
          </div>
          {chartTypes && chartTypes.length > 1 && (
            <div className={styles.chartTypeSelector}>
              <Select
                label=""
                value={selectedChartType}
                name="chartType"
                className={styles.chartTypeSelect}
                onChange={(e: any) => setSelectedChartType(e.target.value as ChartType)}
                options={chartTypeOptions}
              />
            </div>
          )}
        </div>
        {showEmptyData ? (
          <EmptyData
            message={emptyDataProps?.message || "No hay datos disponibles"}
            line2={emptyDataProps?.line2}
            h={emptyDataProps?.h || 300}
            icon={emptyDataProps?.icon}
          />
        ) : (
          <>
            <GraphBase
              data={{
                labels: meses,
                values: [
                  { name: "Saldo inicial", values: balance?.inicial },
                  { name: "Ingresos", values: balance?.ingresos },
                  { name: "Egresos", values: balance?.egresos },
                  { name: "Saldo Acumulado", values: balance?.saldos },
                ],
              }}
              // pasar solo el tipo seleccionado para ocultar el select interno de GraphBase
              chartTypes={[selectedChartType]}
              options={{
                height: h,
                colors: [
                  "var(--cCompl1)",
                  "var(--cCompl7)",
                  "var(--cCompl8)",
                  "var(--cCompl9)",
                ],
              }}
            />
            <div className={styles.legendContainer}>
              <div className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{ backgroundColor: "var(--cCompl1)" }}
                ></div>
                <span className={styles.legendLabel}>Saldo Inicial</span>
                <span className={styles.legendValue}>
                  Bs {formatNumber(saldoInicial || 0)}
                </span>
              </div>
              <div className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{ backgroundColor: "var(--cCompl7)" }}
                ></div>
                <span className={styles.legendLabel}>Ingresos</span>
                <span className={styles.legendValue}>
                  Bs {formatNumber(balance.ingresos.reduce((a, b) => a + b, 0))}
                </span>
              </div>
              <div className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{ backgroundColor: "var(--cCompl8)" }}
                ></div>
                <span className={styles.legendLabel}>Egresos</span>
                <span className={styles.legendValue}>
                  Bs {formatNumber(balance.egresos.reduce((a, b) => a + b, 0))}
                </span>
              </div>
              <div className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{ backgroundColor: "var(--cCompl9)" }}
                ></div>
                <span className={styles.legendLabel}>Saldo Acumulado</span>
                <span className={styles.legendValue}>
                  Bs{" "}
                  {formatNumber(
                    balance.saldos.filter((val) => val !== 0).pop() || 0
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </WidgetBase>
    </div>
  );
};

export default WidgetGraphResume;
