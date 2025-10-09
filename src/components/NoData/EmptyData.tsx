// EmptyData.tsx
import React from "react";
import styles from "./EmptyData.module.css";

interface EmptyDataProps {
  message?: string;
  className?: string;
  h?: number | string;
  centered?: boolean;
}

const EmptyData: React.FC<EmptyDataProps> = ({
  message,
  className = "",
  h = "100%",
  centered = true,
}) => {
  const containerStyle = {
    height: h,
  };

  const containerClass = `${styles.container} ${
    centered ? styles.centered : ""
  } ${className}`;

  return (
    <div className={containerClass} style={containerStyle}>
      <p className={styles.message}>
        {message || "No hay datos disponibles"}
      </p>
    </div>
  );
};

export default EmptyData;