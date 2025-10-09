import React, { CSSProperties } from "react";
import styles from "./AddContent.module.css";
type PropsType = {
  title: string;
  subtitle?: string;
  children: any;
  style?: CSSProperties;
  destinys?: any;
};
const CardContent = ({
  title,
  subtitle,
  children,
  style,
  destinys,
}: PropsType) => {
  return (
    <div className={styles.card} style={style}>
      <div style={{ flexGrow: 1, marginBottom: 12 }}>
        <p className={styles.title}>{title}</p>
        {destinys && (
          <p className={styles.subtitle} style={{ color: "var(--cSuccess)" }}>
            {destinys}
          </p>
        )}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
};

export default CardContent;
