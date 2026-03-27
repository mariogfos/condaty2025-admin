"use client";
import React, { useState } from "react";
import styles from "./WidgetScale.module.css";

interface WidgetScaleProps {
  minLabel?: string;
  maxLabel?: string;
  minValue?: number | string; // Puede ser number o string para evitar errores con valores en cadena
  maxValue?: number | string;
  initialValue?: number;
  trackColor?: string;
  thumbColor?: string;
  title?: string;
  description?: string;
}

const WidgetScale: React.FC<WidgetScaleProps> = ({
  minLabel = "Izquierdo",
  maxLabel = "Derecho",
  minValue = 1,
  maxValue = 10,
  initialValue = -1,
  trackColor = "#444",
  thumbColor = "rgba(33, 37, 41, 0.5)",
  title = "Vista previa",
  description = "",
}) => {
  // Convertimos minValue y maxValue a números para evitar problemas
  const min = Number(minValue);
  const max = Number(maxValue);

  const [selectedValue, setSelectedValue] = useState<number>(initialValue);

  const handleCheckboxChange = (value: number) => {
    setSelectedValue(value);
  };

  return (
    <div className={styles.scale}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <div className={styles.labelContainer}>
        <span className={styles.labelLeft}>{minLabel}</span>
        <span className={styles.labelRight}>{maxLabel}</span>
      </div>
      <div className={styles.checkboxContainer}>
        {Array.from({ length: max - min + 1 }).map((_, index) => {
          const value = min + index;
          return (
            <label key={value} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedValue === value}
                onChange={() => handleCheckboxChange(value)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxValue}></span>
              <span className={styles.checkboxNumber}>{value}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default WidgetScale;
