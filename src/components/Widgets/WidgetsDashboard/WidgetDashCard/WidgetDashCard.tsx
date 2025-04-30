import React from "react";
import styles from "./WidgetDashCard.module.css";

interface ItemProps {
  title: string;
  subtitle?: string;
  className?: string;
  data: string;
  onClick?: () => void;
  color?: string;
}

export const WidgetDashCard = ({
  title,
  subtitle = "",
  className = styles.flexGrow,
  color,
  data,
  onClick,
}: ItemProps) => {
  return (
    <div
      className={`${styles.container} ${onClick ? styles.clickable : ""} ${className}`}
      onClick={onClick}
    >
      <div >
        <p>{title}</p>

      </div>
      <p>{subtitle}</p>
      <p
        className={styles.data}
        style={color ? { color: color } : undefined}
      >
        {data}
      </p>
    </div>
  );
};
