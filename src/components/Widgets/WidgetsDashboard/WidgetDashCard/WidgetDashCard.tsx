import React from "react";
import styles from "./WidgetDashCard.module.css";
import { IconAccess, IconInterrogation } from "@/components/layout/icons/IconsBiblioteca";

interface ItemProps {
  title: string;
  subtitle?: string;
  className?: string;
  data: string;
  onClick?: () => void;
  color?: string;
  icon?:any;
}

export const WidgetDashCard = ({
  title,
  subtitle = "",
  className = styles.flexGrow,
  color,
  data,
  icon,
  onClick,
}: ItemProps) => {
  return (
    <div
      className={`${styles.container} ${onClick ? styles.clickable : ""} ${className}`}
      onClick={onClick}
    >
      <div >
        <p>{title} <IconInterrogation  /> </p>
       
           {icon}
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
