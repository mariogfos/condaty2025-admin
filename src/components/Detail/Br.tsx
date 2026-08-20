import { CSSProperties } from "react";
import styles from "./Br.module.css";
const Br = ({ style }: { style?: CSSProperties }) => {
  return <div className={styles.br} style={style} />;
};

export default Br;
