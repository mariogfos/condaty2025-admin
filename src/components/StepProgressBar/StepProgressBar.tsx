import React from "react";
interface Props {
  currentStep: number;
  totalSteps: number;
}
const StepProgressBar = ({ currentStep, totalSteps }: Props) => {
  const getPercentaje = () => {
    return (currentStep / totalSteps) * 100 + "%";
  };

  return (
    <div>
      <p>
        {currentStep} de {totalSteps} pasos
      </p>
      <div
        style={{
          backgroundColor: "var(--cBlackV2)",
          width: "100%",
          height: 10,
          position: "relative",
        }}
      >
        <div
          style={{
            width: getPercentaje(),
            backgroundColor: "var(--cSidebar)",
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            borderRadius: 5,
          }}
        />
      </div>
    </div>
  );
};

export default StepProgressBar;
