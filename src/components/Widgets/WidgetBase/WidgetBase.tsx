import React, { CSSProperties } from "react";
import styles from "./WidgetBase.module.css";

interface Props {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  className?: string;
  children: React.ReactNode;
  variant?: string; // TODO: add more variants if needed
  style?: CSSProperties;
  titleStyle?: any;
}

const WidgetBase = ({
  title,
  subtitle,
  className,
  children,
  style,
  variant,
  titleStyle,
}: Props) => {
  return (
    <div
      style={style}
      className={
        (variant === "V1" ? styles.widgetBaseV1 : styles.widgetBase) +
        " " +
        className
      }
    >
      {typeof title === "string" ? (
        <h1 style={titleStyle} className={styles.title}>
          {title}
        </h1>
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
