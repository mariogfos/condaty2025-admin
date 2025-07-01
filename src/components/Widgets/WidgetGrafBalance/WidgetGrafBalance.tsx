"use client";
import React, { useEffect, useState } from "react";

import { MONTHS_S_GRAPH, getDateStrMes, getNow } from "@/mk/utils/date";

import styles from "./WidgetGrafBalance.module.css";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import { ChartType } from "@/mk/components/ui/Graphs/GraphsTypes";

interface BalanceData {
  inicial: number[];
  ingresos: number[];
  egresos: number[];
  saldos: number[];
}

interface IngresoItem {
  ingresos: number;
  mes: number;
}

interface EgresoItem {
  egresos: number;
  mes: number;
}

type PropsType = {
  saldoInicial?: number;
  ingresos: IngresoItem[];
  egresos: EgresoItem[];
  chartTypes?: ChartType[];
  h?: number | string;
  title?: string;
  subtitle?: string;
  className?: string;
  periodo?: string;
};

const WidgetGrafBalance: React.FC<PropsType> = ({
  saldoInicial = 0,
  ingresos,
  egresos,
  chartTypes = ["bar", "line"],
  h = 350,
  title,
  subtitle,
  className,
  periodo = "",
}: PropsType) => {
  const [balance, setBalance] = useState<BalanceData>({
    inicial: [],
    ingresos: [],
    egresos: [],
    saldos: [],
  });

  const [meses, setMeses] = useState<string[]>([]);

  useEffect(() => {
    // CORRECCIÓN: Si no hay ingresos ni egresos, el gráfico se muestra vacío.
    if (!ingresos?.length && !egresos?.length) {
      setMeses([]);
      setBalance({
        inicial: [],
        ingresos: [],
        egresos: [],
        saldos: [],
      });
      return; // Salir de la función para no hacer más cálculos.
    }

    const currentSaldoInicial = Number(saldoInicial) || 0;

    const fullYearData = {
      inicial: Array(12).fill(0),
      ingresos: Array(12).fill(0),
      egresos: Array(12).fill(0),
      saldos: Array(12).fill(0),
    };

    if (ingresos) {
      ingresos.forEach(item => {
        if (item.mes >= 1 && item.mes <= 12) {
          fullYearData.ingresos[item.mes - 1] += Number(item.ingresos);
        }
      });
    }

    if (egresos) {
      egresos.forEach(item => {
        if (item.mes >= 1 && item.mes <= 12) {
          fullYearData.egresos[item.mes - 1] += Number(item.egresos);
        }
      });
    }

    let acumulado = currentSaldoInicial;
    for (let i = 0; i < 12; i++) {
      fullYearData.inicial[i] = acumulado;
      fullYearData.saldos[i] = fullYearData.inicial[i] + fullYearData.ingresos[i] - fullYearData.egresos[i];
      acumulado = fullYearData.saldos[i];
    }
    
    let displayMeses = MONTHS_S_GRAPH.slice(); 
    let displayBalanceData: BalanceData = { 
        inicial: [...fullYearData.inicial],
        ingresos: [...fullYearData.ingresos],
        egresos: [...fullYearData.egresos],
        saldos: [...fullYearData.saldos],
    };

    if (periodo.startsWith("c:")) {
      const [startDateStr, endDateStr] = periodo.substring(2).split(',');
      const startDate = new Date(startDateStr + "T00:00:00");
      const endDate = new Date(endDateStr + "T00:00:00");
      
      const startMonthIndex = startDate.getMonth();
      const endMonthIndex = endDate.getMonth();

      if (startDate.getFullYear() === endDate.getFullYear()) {
        displayMeses = MONTHS_S_GRAPH.slice(startMonthIndex, endMonthIndex + 1);
        displayBalanceData = {
          inicial: fullYearData.inicial.slice(startMonthIndex, endMonthIndex + 1),
          ingresos: fullYearData.ingresos.slice(startMonthIndex, endMonthIndex + 1),
          egresos: fullYearData.egresos.slice(startMonthIndex, endMonthIndex + 1),
          saldos: fullYearData.saldos.slice(startMonthIndex, endMonthIndex + 1),
        };
      }
    } else if (periodo === "m" || periodo === "lm") {
      const targetDate = new Date();
      if (periodo === "lm") {
        targetDate.setMonth(targetDate.getMonth() - 1);
      }
      const targetMonthIndex = targetDate.getMonth(); 

      displayMeses = [MONTHS_S_GRAPH[targetMonthIndex]];
      displayBalanceData = {
        inicial: [fullYearData.inicial[targetMonthIndex]],
        ingresos: [fullYearData.ingresos[targetMonthIndex]],
        egresos: [fullYearData.egresos[targetMonthIndex]],
        saldos: [fullYearData.saldos[targetMonthIndex]],
      };
    } else { // Lógica para 'y', 'ly', o vacío
        const firstMonthIndex = fullYearData.ingresos.findIndex((val, i) => val > 0 || fullYearData.egresos[i] > 0);
        const lastMonthIndex = fullYearData.ingresos.findLastIndex((val, i) => val > 0 || fullYearData.egresos[i] > 0);

        if (firstMonthIndex !== -1) {
            const startIndex = firstMonthIndex;
            const endIndex = lastMonthIndex !== -1 ? lastMonthIndex : startIndex;
            displayMeses = MONTHS_S_GRAPH.slice(startIndex, endIndex + 1);
            displayBalanceData = {
                inicial: fullYearData.inicial.slice(startIndex, endIndex + 1),
                ingresos: fullYearData.ingresos.slice(startIndex, endIndex + 1),
                egresos: fullYearData.egresos.slice(startIndex, endIndex + 1),
                saldos: fullYearData.saldos.slice(startIndex, endIndex + 1),
            };
        } else {
            // Este caso ahora es manejado por la condición al principio del useEffect
            displayMeses = [];
            displayBalanceData = { inicial: [], ingresos: [], egresos: [], saldos: [] };
        }
    }
    
    setMeses(displayMeses);
    setBalance(displayBalanceData);

  }, [ingresos, egresos, saldoInicial, periodo]);

  const today = getNow();
  const formattedTodayDate = getDateStrMes(today);

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <p className={styles.subtitle}>
        {subtitle ||
          `Este es un resumen general de los ingresos, egresos y el saldo a favor al ${formattedTodayDate}`}
      </p>
      <p className={styles.title}>{title || "Resumen general"}</p>

      <GraphBase
        data={{
          labels: meses,
          values: [
            { name: "Saldo inicial", values: balance.inicial },
            { name: "Ingresos", values: balance.ingresos },
            { name: "Egresos", values: balance.egresos },
            { name: "Saldo Acumulado", values: balance.saldos },
          ],
        }}
        chartTypes={chartTypes}
        //downloadPdf
        options={{
          height: h,
          colors: ["#FFD700", "#00E38C", "#FF5B4D", "#4C98DF"],
          chart: {
            legend: {
              show: false,
            },
          },
        }}
      />
    </div>
  );
};

export default WidgetGrafBalance;