import React from "react";
import styles from "./TitleSubtitle.module.css";

interface Props {
  title: string;
  subtitle?: string;
}
const TitleSubtitle = ({ title, subtitle }: Props) => {
  return (
    <div className={styles.TitleSubtitle}>
      <p className={styles.title}>{title}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
};

export default TitleSubtitle;
