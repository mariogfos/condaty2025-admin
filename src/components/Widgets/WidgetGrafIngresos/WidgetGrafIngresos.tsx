'use client';
import GraphBase from '@/mk/components/ui/Graphs/GraphBase';
import { ChartType } from '@/mk/components/ui/Graphs/GraphsTypes';
import { MONTHS_S_GRAPH } from '@/mk/utils/date';
import styles from './WidgetGrafIngresos.module.css';

interface Transaction {
  mes: number;
  categoria: string;
  ingresos: string;
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
  ingresos: Transaction[] | undefined;
  chartTypes?: ChartType[];
  h?: number | string;
  title?: string;
  subtitle?: string;
  className?: string;
  periodo?: string; // <-- 1. Se añade la prop 'periodo'
  exportando?: boolean;
};

const WidgetGrafIngresos = ({
  ingresos,
  chartTypes = ['bar', 'pie'],
  h = 'auto',
  title,
  subtitle,
  className,
  periodo, // <-- Se recibe la prop
  exportando,
}: PropsType) => {
  // 2. La función ahora considera el 'periodo' para generar los meses
  const getMonths = (
    data: Transaction[] | undefined,
    currentPeriodo?: string
  ) => {
    if (!data || data.length === 0) return [];

    // Si el filtro es año anterior, mostrar SIEMPRE los 12 meses
    if (currentPeriodo === 'ly') {
      return MONTHS_S_GRAPH.slice();
    }
    // Si el filtro es anual actual, mostrar desde el primer mes con datos hasta el último
    if (currentPeriodo === 'y') {
      const mesesConDatos = data.map(t => t.mes - 1);
      if (mesesConDatos.length === 0) return [];
      const minMes = Math.min(...mesesConDatos);
      const maxMes = Math.max(...mesesConDatos);
      return MONTHS_S_GRAPH.slice(minMes, maxMes + 1);
    }
    // Para otros filtros, deduce los meses a partir de los datos
    const monthIndexes = Array.from(new Set(data.map(t => t.mes - 1))).sort(
      (a, b) => a - b
    );
    return monthIndexes.map(index => MONTHS_S_GRAPH[index]);
  };

  // 3. La función ahora recibe los meses como parámetro para alinear los datos
  const getValuesIngresos = (
    ingresosHist: Transaction[] | undefined,
    chartType: ChartType,
    months: string[] // <-- Recibe el listado de meses definitivo
  ): FormattedValue[] | PieChartValue[] => {
    if (!ingresosHist || ingresosHist.length === 0) return [];

    if (chartType === 'pie' || chartType === 'donut') {
      const pieData: PieChartValue[] = [];
      const categoryTotals: { [key: string]: number } = {};

      ingresosHist.forEach(transaction => {
        if (!categoryTotals[transaction.categoria]) {
          categoryTotals[transaction.categoria] = 0;
        }
        categoryTotals[transaction.categoria] += parseFloat(
          transaction.ingresos || '0'
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

    ingresosHist.forEach(transaction => {
      if (!groupedTransactions[transaction.categoria]) {
        groupedTransactions[transaction.categoria] = [];
      }
      groupedTransactions[transaction.categoria].push(transaction);
    });

    for (const categoria in groupedTransactions) {
      const transactions = groupedTransactions[categoria];
      const formattedValues: number[] = [];

      // Itera sobre la lista de meses definitiva para asegurar que cada mes tenga un valor
      months.forEach(monthName => {
        const monthNumber = MONTHS_S_GRAPH.indexOf(monthName) + 1;
        const matchingTransaction = transactions.find(
          transaction => transaction.mes === monthNumber
        );
        formattedValues.push(
          matchingTransaction
            ? parseFloat(matchingTransaction.ingresos || '0')
            : 0
        );
      });

      values.push({ name: categoria, values: formattedValues });
    }

    return values;
  };

  const primaryChartType = chartTypes[0] || 'bar';
  const monthLabels = getMonths(ingresos, periodo); // Se generan los meses una sola vez

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <p className={styles.subtitle}>
        {subtitle ||
          ' Aquí veras un resumen de todos los ingresos distribuidos en las diferentes categorías'}
      </p>
      <p className={styles.title}>{title || 'Resumen de Ingresos'}</p>
      <p
        style={{
          color: 'var(--darkv1)',
          fontWeight: 'var(--bSemibold)',
          fontSize: 'var(--sM)',
        }}
      >
        {subtitle ||
          ' Aquí veras un resumen de todos los ingresos distribuidos en las diferentes categorías'}
      </p>
      <p
        style={{
          color: 'var(--darkv1)',
          fontWeight: 'var(--bBold)',
          fontSize: 'var(--sXl)',
        }}
      >
        {title}
      </p>
      <GraphBase
        data={{
          labels: monthLabels, // Se usan los meses correctos
          values: getValuesIngresos(ingresos, primaryChartType, monthLabels), // Se pasan los meses para alinear los datos
        }}
        // downloadPdf
        chartTypes={chartTypes}
        options={{
          title: '',
          subtitle: '',
          label: '',
          height: h,
        }}
        exportando={exportando}
      />
    </div>
  );
};

export default WidgetGrafIngresos;
