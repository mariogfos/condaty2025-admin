import React from "react";
import styles from "./WidgetBase.module.css";

interface Props {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  className?: string;
  children: React.ReactNode;
  style?: any;
}

const WidgetBase = ({ title, subtitle, className, children, style }: Props) => {
  return (
    <div style={style} className={styles.widgetBase + " " + (className || "")}>
      {typeof title === "string" ? (
        <h1 className={styles.title}>{title}</h1>
      ) : (
        title
      )}
      {typeof subtitle === "string" ? (
        <p className={styles.subtitle}>{subtitle}</p>
      ) : (
        subtitle
      )}
      {children}
    </div>
  );
};

export default WidgetBase;
