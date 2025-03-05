import React from "react";
import styles from "./WidgetDefaulterResume.module.css";
import { formatNumber } from "@/mk/utils/numbers";

interface PropsType {
  title: string;
  pointColor?: string;
  amount: string;
  units: string;
}

const WidgetDefaulterResume = ({ title, pointColor = "", units, amount }: PropsType) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {pointColor && (
          <div className={styles.dot} style={{backgroundColor:pointColor}}/>
        )}
        <p className={styles.title}>{title}</p>
      </div>
      <p className={styles.amount}>
        {formatNumber(amount)} Bs
      </p>
      <p className={`${styles.units} ${!units ? styles.emptyUnits : ""}`}>
        {units ? units + " Unidades" : "Sin unidades" }
      </p>
    </div>
  );
};

export default WidgetDefaulterResume;
