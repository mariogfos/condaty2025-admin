"use client";
import React, { useEffect, useState } from "react";

import { MONTHS_S, getDateStrMes, getNow } from "@/mk/utils/date";

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
    inicial: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ingresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    egresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    saldos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });

  const [meses, setMeses] = useState<string[]>([]);

  useEffect(() => {
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
    
    let displayMeses = MONTHS_S.slice(); 
    let displayBalanceData = { 
        inicial: [...fullYearData.inicial],
        ingresos: [...fullYearData.ingresos],
        egresos: [...fullYearData.egresos],
        saldos: [...fullYearData.saldos],
    };

    if (periodo.startsWith("c:")) {
      const [startDateStr, endDateStr] = periodo.substring(2).split(',');
      const startDate = new Date(startDateStr + "T00:00:00"); // Asegurar zona horaria local
      const endDate = new Date(endDateStr + "T00:00:00");   // Asegurar zona horaria local
      
      const startMonthIndex = startDate.getMonth(); // 0-11
      const endMonthIndex = endDate.getMonth();   // 0-11

      // Asumiendo que el rango personalizado es dentro del mismo año o los datos de backend ya están filtrados por año.
      // MONTHS_S es para un solo año.
      // La lógica aquí es para mostrar todos los meses desde el mes de inicio hasta el mes de fin del rango.
      if (startDate.getFullYear() === endDate.getFullYear()) { // Rango dentro del mismo año
        displayMeses = MONTHS_S.slice(startMonthIndex, endMonthIndex + 1);
        displayBalanceData = {
          inicial: fullYearData.inicial.slice(startMonthIndex, endMonthIndex + 1),
          ingresos: fullYearData.ingresos.slice(startMonthIndex, endMonthIndex + 1),
          egresos: fullYearData.egresos.slice(startMonthIndex, endMonthIndex + 1),
          saldos: fullYearData.saldos.slice(startMonthIndex, endMonthIndex + 1),
        };
      } else {
        // Para rangos que cruzan años, esta lógica necesitaría ser más compleja o 
        // depender de que el backend devuelva datos con año y mes.
        // Por ahora, si cruza años, se mostrarán todos los meses como fallback,
        // lo cual es el comportamiento de 'y' o 'ly' si no se aplica otro filtro.
        // Si tu backend ya filtra los `ingresos` y `egresos` para el rango exacto (incluyendo año),
        // entonces los datos en `fullYearData` ya serían correctos para el primer año del rango.
        // Esta parte es compleja sin saber cómo el backend maneja rangos multianuales y si `ingresos`/`egresos` props
        // contienen datos para esos múltiples años.
        // Por simplicidad y basado en el JSON de ejemplo (que solo tiene 'mes'), se asume que el rango es manejado
        // principalmente para un solo año o el backend ya da los datos agregados correctamente por 'mes' del periodo.
        // Si el rango personalizado SIEMPRE es dentro de un solo año o el backend ya lo maneja,
        // la lógica de arriba para el mismo año es la que aplica.
        // Si el backend devuelve datos para Mayo y Junio (mes: 5, mes: 6) para un filtro personalizado,
        // entonces los datos deben ser para esos meses.
        // La clave es que `displayMeses` y los datos en `displayBalanceData` tengan la misma longitud y correspondan.

        // Si los datos del backend ya vienen filtrados solo con los meses del rango personalizado:
        const dataMonths = new Set<number>();
        if(ingresos) ingresos.forEach(i => dataMonths.add(i.mes -1));
        if(egresos) egresos.forEach(e => dataMonths.add(e.mes -1));
        const sortedDataMonths = Array.from(dataMonths).sort((a,b)=> a-b);

        if(sortedDataMonths.length > 0) {
            displayMeses = sortedDataMonths.map(mIdx => MONTHS_S[mIdx]);
            displayBalanceData = {
                inicial: sortedDataMonths.map(mIdx => fullYearData.inicial[mIdx]),
                ingresos: sortedDataMonths.map(mIdx => fullYearData.ingresos[mIdx]),
                egresos: sortedDataMonths.map(mIdx => fullYearData.egresos[mIdx]),
                saldos: sortedDataMonths.map(mIdx => fullYearData.saldos[mIdx]),
            };
        } else {
             displayMeses = [];
             displayBalanceData = { inicial:[], ingresos:[], egresos:[], saldos:[]};
        }
      }

    } else if (periodo === "m" || periodo === "lm") {
      const targetDate = new Date();
      if (periodo === "lm") {
        targetDate.setMonth(targetDate.getMonth() - 1);
      }
      const targetMonthIndex = targetDate.getMonth(); 

      displayMeses = [MONTHS_S[targetMonthIndex]];
      displayBalanceData = {
        inicial: [fullYearData.inicial[targetMonthIndex]],
        ingresos: [fullYearData.ingresos[targetMonthIndex]],
        egresos: [fullYearData.egresos[targetMonthIndex]],
        saldos: [fullYearData.saldos[targetMonthIndex]],
      };
    }
    // Para 'y' y 'ly', displayMeses y displayBalanceData ya tienen por defecto los datos del año completo.
    
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
            { name: "Saldo inicial", values: balance?.inicial },
            { name: "Ingresos", values: balance?.ingresos },
            { name: "Egresos", values: balance?.egresos },
            { name: "Saldo Acumulado", values: balance?.saldos },
          ],
        }}
        chartTypes={chartTypes}
        downloadPdf
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
