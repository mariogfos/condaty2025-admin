import React from "react";
import styles from "./StepProgressBar.module.css";
import { Check } from "lucide-react";
interface Props {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  onStepChange?: (step: number) => void;
  disabled?: boolean;
}
const StepProgressBar = ({ currentStep, totalSteps, steps, onStepChange, disabled = false }: Props) => {
  if (steps?.length) return <nav aria-label="Pasos del formulario" className={styles.steps}>
    <ol>{steps.map((label, index) => {
      const number = index + 1;
      return <li key={label} className={number === currentStep ? styles.current : number < currentStep ? styles.completed : ""}>
        <button type="button" aria-current={number === currentStep ? "step" : undefined}
          disabled={disabled || number > currentStep || !onStepChange} onClick={() => onStepChange?.(number)}>
          <span className={styles.stepNumber}>{number < currentStep ? <Check size={16} /> : number}</span>
          <span>{label}</span>
        </button>
      </li>;
    })}</ol>
  </nav>;
  const getPercentaje = () => {
    return (currentStep / totalSteps) * 100 + "%";
  };

  const progressBarColor =
    currentStep === totalSteps ? "var(--cAccent)" : "var(--cSidebar)";

  return (
    <div className={styles.StepProgressBar}>
      <p>
        {currentStep} de {totalSteps} pasos
      </p>
      <div className={styles.progressBar}>
        <div
          style={{
            width: getPercentaje(),
            backgroundColor: progressBarColor,
          }}
        />
      </div>
    </div>
  );
};

export default StepProgressBar;
