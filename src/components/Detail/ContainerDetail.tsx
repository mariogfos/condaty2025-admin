import React from "react";
import styles from "./Detail.module.css";
interface Props {
  children: React.ReactNode;
}

const ContainerDetail = ({ children }: Props) => {
  return <div className={styles.ContainerDetail}>{children}</div>;
};

export default ContainerDetail;
