"use client";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import { ChartType } from "@/mk/components/ui/Graphs/GraphsTypes";
import { MONTHS_S } from "@/mk/utils/date";
import styles from "./WidgetGrafIngresos.module.css";

interface Transaction {
  mes: number;
  categoria: string;
  ingresos: string;
}

interface FormattedValue {
  name: string;
  values: number[];
}

// New interface for pie chart data format
interface PieChartValue {
  name: string;
  value: number;
}

type PropsType = {
  ingresos: Transaction[] | undefined;
  chartTypes?: ChartType[];
  h?: number | string;
  title?: string;
  subtitle?: string;
  className?: string;
};

const WidgetGrafIngresos = ({
  ingresos,
  chartTypes = ["bar", "pie"],
  h = "auto",
  title,
  subtitle,
  className,
}: PropsType) => {
  const getMonths = (data: Transaction[] | undefined) => {
    const uniqueMonths = data?.reduce(
      (acc: string[], curr) =>
        acc.includes(MONTHS_S[curr.mes - 1]) ? acc : [...acc, MONTHS_S[curr.mes - 1]],
      []
    );
    
    return uniqueMonths || [];
  };

  const getValuesIngresos = (ingresosHist: Transaction[] | undefined, chartType: ChartType): FormattedValue[] | PieChartValue[] => {
    if (!ingresosHist || ingresosHist.length === 0) return [];
    
    // For pie charts, we need a simpler structure
    if (chartType === "pie" || chartType === "donut") {
      const pieData: PieChartValue[] = [];
      const categoryTotals: {[key: string]: number} = {};
      
      // Sum the values by category
      ingresosHist.forEach((transaction) => {
        if (!categoryTotals[transaction.categoria]) {
          categoryTotals[transaction.categoria] = 0;
        }
        categoryTotals[transaction.categoria] += parseFloat(transaction.ingresos);
      });
      
      // Convert to array of objects with name and value
      for (const categoria in categoryTotals) {
        pieData.push({
          name: categoria,
          value: categoryTotals[categoria]
        });
      }
      
      return pieData;
    }
    
    // Original logic for bar/line charts
    let values: FormattedValue[] = [];
    const groupedTransactions: { [key: string]: Transaction[] } = {};
    
    ingresosHist.forEach((transaction) => {
      if (!groupedTransactions[transaction.categoria]) {
        groupedTransactions[transaction.categoria] = [];
      }
      groupedTransactions[transaction.categoria].push(transaction);
    });
    
    const uniqueMonths = Array.from(
      new Set(ingresosHist.map((transaction) => transaction.mes))
    );
    
    for (const categoria in groupedTransactions) {
      const transactions = groupedTransactions[categoria];
      const formattedValues: number[] = [];
      
      uniqueMonths.forEach((month) => {
        const matchingTransaction = transactions.find(
          (transaction) => transaction.mes === month
        );
        formattedValues.push(
          matchingTransaction ? parseFloat(matchingTransaction.ingresos) : 0
        );
      });
      
      values.push({ name: categoria, values: formattedValues });
    }
    
    return values;
  };
  
  // Determine the primary chart type (first in the array)
  const primaryChartType = chartTypes[0] || "bar";
  
  console.log("====================================");
  console.log("values ingresos", getValuesIngresos(ingresos, primaryChartType));
  console.log("====================================");
  
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <p className={styles.title}>
        {title || "Resumen de Ingresos"}
      </p>
      <p className={styles.subtitle}>
        {subtitle ||
          " Aquí veras un resumen de todos los ingresos distribuidos en las diferentes categorías"}
      </p>
      <GraphBase
        data={{
          labels: getMonths(ingresos),
          values: getValuesIngresos(ingresos, primaryChartType),
        }}
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

export default WidgetGrafIngresos;