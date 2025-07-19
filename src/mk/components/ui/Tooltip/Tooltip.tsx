import { CSSProperties } from "react";
import styles from "./tooltip.module.css";

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
  position = "top",
  style,
  className,
}: PropsType) => {
  if (!title || title == "") return children;
  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <span className={`${styles.tooltip} ${styles[position]}`}>{title}</span>
      {children}
    </div>
  );
};
export default Tooltip;
