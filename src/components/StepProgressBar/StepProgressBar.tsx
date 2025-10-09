import React from "react";
import styles from "./StepProgressBar.module.css";
interface Props {
  currentStep: number;
  totalSteps: number;
}
const StepProgressBar = ({ currentStep, totalSteps }: Props) => {
  const getPercentaje = () => {
    return (currentStep / totalSteps) * 100 + "%";
  };

  return (
    <div className={styles.StepProgressBar}>
      <p>
        {currentStep} de {totalSteps} pasos
      </p>
      <div className={styles.progressBar}>
        <div
          style={{
            width: getPercentaje(),
          }}
        />
      </div>
    </div>
  );
};

export default StepProgressBar;
