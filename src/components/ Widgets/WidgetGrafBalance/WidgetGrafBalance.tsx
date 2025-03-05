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
    const lista: BalanceData = {
      inicial: [saldoInicial || 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ingresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      egresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      saldos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    let mesI = -1;
    let mesF = 13;
    let lmeses = MONTHS_S.slice(1, 13);

    if (ingresos && ingresos.length > 0) {
      ingresos.forEach((item) => {
        if (item.mes > mesI) mesI = item.mes;
        if (item.mes < mesF) mesF = item.mes;
        
        lista.ingresos[item.mes - 1] =
          lista.ingresos[item.mes - 1] + Number(item.ingresos);

        lista.saldos[item.mes - 1] =
          lista.saldos[item.mes - 1] + Number(item.ingresos);
      });
    }

    if (egresos && egresos.length > 0) {
      egresos.forEach((item) => {
        lista.egresos[item.mes - 1] =
          lista.egresos[item.mes - 1] + Number(item.egresos);

        lista.saldos[item.mes - 1] =
          lista.saldos[item.mes - 1] - Number(item.egresos);
      });
    }

    let inicial = saldoInicial || 0;
    lista.saldos.forEach((item, index) => {
      if (index > 0) inicial = lista.saldos[index - 1];
      lista.saldos[index] = lista.saldos[index] + inicial;
      if (index > 0) lista.inicial[index] = lista.saldos[index - 1];
    });

    lista.saldos.forEach((item, index) => {
      if (lista.ingresos[index] === 0 && lista.egresos[index] === 0) {
        lista.saldos[index] = 0;
        lista.inicial[index] = 0;
      }
    });

    if (periodo !== "y" && periodo !== "ly") {
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
  }, [ingresos, egresos, saldoInicial, periodo]);

  const today = getNow();
  const formattedTodayDate = getDateStrMes(today);
  
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <p className={styles.title}>
        {title || "Resumen general"}
      </p>
      <p className={styles.subtitle}>
        {subtitle ||
          `Este es un resumen general de los ingresos, egresos y el saldo a favor al ${formattedTodayDate}`}
      </p>
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
        options={{
          height: h,
          colors: ["#FFD700", "#00E38C", "#FF5B4D", "#4C98DF"],
        }}
      />
    </div>
  );
};

export default WidgetGrafBalance;