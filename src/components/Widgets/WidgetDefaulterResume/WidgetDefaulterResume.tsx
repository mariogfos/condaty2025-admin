import React from "react";
import styles from "./WidgetDefaulterResume.module.css";
import { formatNumber } from "@/mk/utils/numbers";

interface PropsType {
  title: string;
  pointColor?: string;
  amount: string;
  units?: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  style?: React.CSSProperties;
}

const WidgetDefaulterResume = ({ 
  title, 
  pointColor = "", 
  units, 
  amount,
  icon,
  backgroundColor,
  textColor,
  iconColor,
  style
}: PropsType) => {
  return (
    <div 
      className={styles.container}
      style={{
        backgroundColor: backgroundColor || 'var(--darkv2)',...style,
      }}
    >
      <div className={styles.contentWrapper}>
        <div className={styles.textContent}>
          <div className={styles.titleContainer}>
            <p className={styles.title} style={{color: textColor || 'var(--lightv3)'}}>
              {title}
            </p>
          </div>
          <p className={styles.amount} style={{color: textColor || 'var(--lightColor)'}}>
            {amount}
          </p>
        </div>
        {icon && (
          <div 
            className={styles.iconContainer} 
            style={{
              backgroundColor: `${backgroundColor || 'var(--darkv2)'}`
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetDefaulterResume;