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
  iconBorderColor?: string;
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
  iconBorderColor,
  style
}: PropsType) => {
  return (
    <div 
      className={styles.container}
      style={{
        backgroundColor: backgroundColor || 'var(--darkv2)',
        ...style
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
              backgroundColor: `${backgroundColor || 'var(--darkv2)'}`,
              borderColor:'red',
              borderWidth: 1,
              border: '1px solid '+ (iconBorderColor || 'var(--cWhiteV2)'),
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