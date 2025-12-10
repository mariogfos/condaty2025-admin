import React from "react";
import styles from "./Loading.module.css";

const Loading = ({ height = 200 }: { height?: number }) => {
  return (
    <div className={styles.container} style={{ height }}>
      <div className={styles.loader}></div>
    </div>
  );
};

export default Loading;
