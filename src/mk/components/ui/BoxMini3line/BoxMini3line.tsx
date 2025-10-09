import { CSSProperties } from "react";
import styles from "./boxMini3line.module.css";

type PropsType = {
  value: string;
  tit?: string;
  sub?: string;
  variant?: string;
  style?: CSSProperties;
};

const BoxMini3line = ({
  value,
  tit = "",
  sub = "",
  variant = "",
  style = {},
}: PropsType) => {
  return (
    <div className={styles.boxMini3line + " " + variant}>
      {tit && <header>{tit}</header>}
      {sub && <sub>{sub}</sub>}
      <div style={style}>{value}</div>
    </div>
  );
};

export default BoxMini3line;
