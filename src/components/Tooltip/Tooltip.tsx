import { CSSProperties } from "react";
import styles from "./Tooltip.module.css";

type PropsType = {
  title: string;
  children: any;
  position?: "top" | "bottom" | "left" | "right";
  style?: CSSProperties;
  className?: string;
};

const Tooltip = ({
  title,
  children,
  position = "left",
  style,
  className,
}: PropsType) => {
  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <span className={`${styles.tooltip} ${styles[position]}`}>{title}</span>
      {children}
    </div>
  );
};

export default Tooltip;
