import React, { useEffect, useState } from "react";

import { MONTHS_S, getDateStr, getDateStrMes, getNow } from "@/mk/utils/date";
import { ChartType } from "@/mk/components/ui/Graphs/GraphsTypes";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import WidgetBase from "../../WidgetBase/WidgetBase";
import styles from "./WidgetGraphResume.module.css"
import { formatNumber } from "@/mk/utils/numbers";


type PropsType = {
  saldoInicial?: number;
  ingresos: { ingresos: number; mes: number }[];
  egresos: { egresos: number; mes: number }[];
  chartTypes?: ChartType[];
  h?: number | string;
  title?: string;
  subtitle?: string;
  className?: string;
  periodo?: string;
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
}: PropsType) => {
  const [balance, setBalance] = useState({
    inicial: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ingresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    egresos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    saldos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });

  const [meses, setMeses]: any = useState([]);
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
    let lmeses = MONTHS_S.slice(0, 12);
    ingresos?.map((item) => {
      if (item.mes > mesI) mesI = item.mes;
      if (item.mes < mesF) mesF = item.mes;
      lista.ingresos[item.mes - 1] =
        lista.ingresos[item.mes - 1] + Number(item.ingresos);

      lista.saldos[item.mes - 1] =
        lista.saldos[item.mes - 1] + Number(item.ingresos);
    });

    egresos?.map((item) => {
      lista.egresos[item.mes - 1] =
        lista.egresos[item.mes - 1] + Number(item.egresos);

      lista.saldos[item.mes - 1] =
        lista.saldos[item.mes - 1] - Number(item.egresos);
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
        <section>
          <p className={styles.title}>
            {title || "Resumen general"}
          </p>
          <p className={styles.subtitle}>
            {subtitle ||
              `Este es un resumen general del año ${formattedTodayDate}`}
          </p>
        </section>
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
        <div className={styles.legendContainer}>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#FFD700' }}></div>
            <span className={styles.legendLabel}>Saldo Inicial</span>
            <span className={styles.legendValue}>Bs {formatNumber(saldoInicial || 0)}</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#00E38C' }}></div>
            <span className={styles.legendLabel}>Ingresos</span>
            <span className={styles.legendValue}>Bs {formatNumber(balance.ingresos.reduce((a, b) => a + b, 0))}</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#FF5B4D' }}></div>
            <span className={styles.legendLabel}>Egresos</span>
            <span className={styles.legendValue}>Bs {formatNumber(balance.egresos.reduce((a, b) => a + b, 0))}</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#4C98DF' }}></div>
            <span className={styles.legendLabel}>Saldo Acumulado</span>
            <span className={styles.legendValue}>Bs {formatNumber(balance.saldos.filter(val => val !== 0).pop() || 0)}</span>
          </div>
        </div>
      </WidgetBase>
    </div>
  );
};

export default WidgetGraphResume;
