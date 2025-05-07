import React from "react";
import styles from "./WidgetDashCard.module.css";
import {
  IconAccess,
  IconInterrogation,
} from "@/components/layout/icons/IconsBiblioteca";
import Tooltip from "@/components/Tooltip/Tooltip";

interface ItemProps {
  title: string;
  subtitle?: string;
  className?: string;
  data: string;
  onClick?: () => void;
  color?: string;
  icon?: any;
  tooltip?: boolean;
  tooltipTitle?: string;
  style?: React.CSSProperties;
}

export const WidgetDashCard = ({
  title,
  subtitle = "",
  className = styles.flexGrow,
  color,
  data,
  icon,
  tooltip,
  tooltipTitle = "",
  onClick,
  style,
}: ItemProps) => {
  return (
    <div
      className={`${styles.container} ${
        onClick ? styles.clickable : ""
      } ${className}`}
      onClick={onClick}
      style={style}
    >
      <div>
        <p>
          {title}{" "}
          {tooltip && (
            <Tooltip title={tooltipTitle} position="right">
              <IconInterrogation />{" "}
            </Tooltip>
          )}
        </p>

        {icon}
      </div>
      <p>{subtitle}</p>
      <p className={styles.data} style={color ? { color: color } : undefined}>
        {data}
      </p>
    </div>
  );
};
