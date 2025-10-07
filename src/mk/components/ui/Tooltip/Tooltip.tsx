import { CSSProperties, ReactNode } from "react";
import styles from "./tooltip.module.css";

export type TooltipPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type PropsType = {
  title: string;
  children: ReactNode;
  position?: TooltipPosition;
  style?: CSSProperties;
  className?: string;
  singleLine?: boolean;
  maxWidth?: string | number;
  minWidth?: string | number;
  fullWidth?: boolean;
};

const Tooltip = ({
  title,
  children,
  position = "top",
  style,
  className,
  singleLine = true,
  maxWidth,
  minWidth,
  fullWidth,
}: PropsType) => {
  if (!title) return children;
  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ""} ${className || ""}`} style={style}>
      <span
        className={`${styles.tooltip} ${styles[position]}`}
        style={{
          whiteSpace: singleLine ? "nowrap" : "normal",
          maxWidth: maxWidth || undefined,
          minWidth: minWidth || undefined,
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
};

export default Tooltip;
