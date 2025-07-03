"use client";
import React from "react";
import { MONTHS_S_GRAPH } from "@/mk/utils/date";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import { ChartType } from "@/mk/components/ui/Graphs/GraphsTypes";
import styles from "./WidgetGrafEgresos.module.css";

interface Transaction {
  mes: number;
  categoria: string;
  egresos: string;
}

interface FormattedValue {
  name: string;
  values: number[];
}

interface PieChartValue {
  name: string;
  values: number[];
}

type PropsType = {
  egresos: Transaction[] | undefined;
  chartTypes?: ChartType[];
  h?: number | string;
  title?: string;
  subtitle?: string;
  className?: string;
  periodo?: string;
};

const WidgetGrafEgresos: React.FC<PropsType> = ({
  egresos,
  chartTypes = ["bar", "pie"],
  h = "auto",
  title,
  subtitle,
  className,
  periodo,
}) => {
  const getMonths = (
    data: Transaction[] | undefined,
    currentPeriodo?: string
  ) => {
    if (!data || data.length === 0) return [];

    // Si el filtro es anual, mostrar solo desde el primer mes con datos hasta el último mes con datos
    if (currentPeriodo === "y" || currentPeriodo === "ly") {
      const mesesConDatos = data.map((t) => t.mes - 1);
      if (mesesConDatos.length === 0) return [];
      const minMes = Math.min(...mesesConDatos);
      const maxMes = Math.max(...mesesConDatos);
      return MONTHS_S_GRAPH.slice(minMes, maxMes + 1);
    }

    // Para otros filtros, deduce los meses a partir de los datos
    const monthIndexes = Array.from(new Set(data.map((t) => t.mes - 1))).sort(
      (a, b) => a - b
    );
    return monthIndexes.map((index) => MONTHS_S_GRAPH[index]);
  };

  const getValuesEgresos = (
    egresosHist: Transaction[] | undefined,
    chartType: ChartType,
    months: string[]
  ): FormattedValue[] | PieChartValue[] => {
    if (!egresosHist || egresosHist.length === 0) return [];

    if (chartType === "pie" || chartType === "donut") {
      const pieData: PieChartValue[] = [];
      const categoryTotals: { [key: string]: number } = {};

      egresosHist.forEach((transaction) => {
        if (!categoryTotals[transaction.categoria]) {
          categoryTotals[transaction.categoria] = 0;
        }
        categoryTotals[transaction.categoria] += parseFloat(
          transaction.egresos || "0"
        );
      });

      for (const categoria in categoryTotals) {
        pieData.push({
          name: categoria,
          values: [categoryTotals[categoria]],
        });
      }

      return pieData;
    }

    const values: FormattedValue[] = [];
    const groupedTransactions: { [key: string]: Transaction[] } = {};

    egresosHist.forEach((transaction) => {
      if (!groupedTransactions[transaction.categoria]) {
        groupedTransactions[transaction.categoria] = [];
      }
      groupedTransactions[transaction.categoria].push(transaction);
    });

    for (const categoria in groupedTransactions) {
      const transactions = groupedTransactions[categoria];
      const formattedValues: number[] = [];

      months.forEach((monthName) => {
        const monthNumber = MONTHS_S_GRAPH.indexOf(monthName) + 1;
        const matchingTransaction = transactions.find(
          (transaction) => transaction.mes === monthNumber
        );
        formattedValues.push(
          matchingTransaction
            ? parseFloat(matchingTransaction.egresos || "0")
            : 0
        );
      });

      values.push({ name: categoria, values: formattedValues });
    }

    return values;
  };

  const primaryChartType = chartTypes[0] || "bar";
  const monthLabels = getMonths(egresos, periodo);

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <p className={styles.subtitle}>
        {subtitle ||
          "Aquí veras un resumen de todos los gastos distribuidos en las diferentes categorías"}
      </p>
      <p className={styles.title}>{title || "Resumen de Egresos"}</p>
      <GraphBase
        data={{
          labels: monthLabels,
          values: getValuesEgresos(egresos, primaryChartType, monthLabels),
        }}
        //downloadPdf
        chartTypes={chartTypes}
        options={{
          title: "",
          subtitle: "",
          label: "",
          height: h,
        }}
      />
    </div>
  );
};

export default WidgetGrafEgresos;