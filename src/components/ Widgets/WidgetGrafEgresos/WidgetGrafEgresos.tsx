"use client";
import React from "react";
import { MONTHS_S } from "@/mk/utils/date";
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

type PropsType = {
  egresos: Transaction[];
  chartTypes?: ChartType[];
  h?: number | string;
  title?: string;
  subtitle?: string;
  className?: string;
};

const WidgetGrafEgresos: React.FC<PropsType> = ({
  egresos,
  chartTypes = ["bar", "pie"],
  h = "auto",
  title,
  subtitle,
  className,
}) => {
  const getMonths = (data: Transaction[] | undefined) => {
    const uniqueMonths = data?.reduce(
      (acc: string[], curr) =>
        acc.includes(MONTHS_S[curr.mes - 1])
          ? acc
          : [...acc, MONTHS_S[curr.mes - 1]],
      []
    );
    return uniqueMonths || [];
  };

  const getValuesEgresos = (
    egresosHist: Transaction[] | undefined
  ): FormattedValue[] => {
    if (!egresosHist || egresosHist.length === 0) return [];

    let values: FormattedValue[] = [];
    const groupedTransactions: { [key: string]: Transaction[] } = {};

    egresosHist.forEach((transaction) => {
      if (!groupedTransactions[transaction.categoria]) {
        groupedTransactions[transaction.categoria] = [];
      }
      groupedTransactions[transaction.categoria].push(transaction);
    });

    const uniqueMonths = Array.from(
      new Set(egresosHist.map((transaction) => transaction.mes))
    );

    for (const categoria in groupedTransactions) {
      const transactions = groupedTransactions[categoria];
      const formattedValues: number[] = [];

      uniqueMonths.forEach((month) => {
        const matchingTransaction = transactions.find(
          (transaction) => transaction.mes === month
        );
        formattedValues.push(
          matchingTransaction ? parseFloat(matchingTransaction.egresos) : 0
        );
      });

      values.push({ name: categoria, values: formattedValues });
    }

    return values;
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <p className={styles.title}>{title || "Resumen de egresos"}</p>
      <p className={styles.subtitle}>
        {subtitle ||
          "Aquí veras un resumen de todos los gastos distribuidos en las diferentes categorías"}
      </p>
      <GraphBase
        data={{
          labels: getMonths(egresos),
          values: getValuesEgresos(egresos),
        }}
        downloadPdf
        chartTypes={chartTypes}
        options={{
          title: "",
          subtitle: "",
          label: "",
          // stacked: true,
          height: h,
        }}
      />
    </div>
  );
};

export default WidgetGrafEgresos;
