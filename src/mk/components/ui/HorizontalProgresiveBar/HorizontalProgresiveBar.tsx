"use client";
import React, { useEffect, useState } from "react";
import styles from "./horizontalProgresiveBar.module.css";
import { formatNumberWithComma } from "@/mk/utils/numbers";

interface Props {
  total: number;
  current: number;
  color?: string;
  height?: string | number;
  className?: string;
  goal?: number[];
  goalColors?: string[]; // Nueva propiedad
}

const HorizontalProgresiveBar = ({
  total,
  current,
  color = "var(--cAccent)",
  className,
  height,
  goal = [],
  goalColors = [], // Asigna un arreglo vacío por defecto
}: Props) => {
  const [percentage, setPercentage] = useState<number | null>(null);
  const [goalPercentages, setGoalPercentages] = useState<number[]>([]);
  const [hoveredGoal, setHoveredGoal] = useState<number | null>(null);
  const [exceededGoals, setExceededGoals] = useState<boolean[]>([]);

  useEffect(() => {
    if (total > 0) {
      const percent = (current / total) * 100;
      setPercentage(percent);

      if (goal && goal.length > 0) {
        const calculatedGoalPercentages = goal.map((g) => (g / total) * 100);
        setGoalPercentages(calculatedGoalPercentages);

        const goalsExceeded = goal.map((g) => current >= g);
        setExceededGoals(goalsExceeded);
      } else {
        setGoalPercentages([]);
        setExceededGoals([]);
      }
    } else {
      setPercentage(0);
      setGoalPercentages([]);
      setExceededGoals([]);
    }
  }, []);

  return (
    <div
      className={`${styles.horizontalProgresiveBar} ${className}`}
      style={{ height: height, position: "relative" }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "var(--cWhiteV3)",
          position: "relative",
          overflow: "visible",
        }}
      >
        {goalPercentages.map((g, index) => (
          <div
            key={index}
            // onMouseEnter={() => setHoveredGoal(index)}
            // onMouseLeave={() => setHoveredGoal(null)}
            style={{
              position: "absolute",
              left: `${g}%`,
              height: "100%",
              width: "1px",
              backgroundColor: exceededGoals[index]
                ? "var(--cBlackV1)"
                : goalColors[index] || "var(--cSuccess)",
              zIndex: 1,
              cursor: "pointer",
            }}
          >
            {hoveredGoal === index && (
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  left: "50%",
                  minWidth: "max-content",
                  transform: "translateX(-50%)",
                  padding: "5px 10px",
                  backgroundColor: "var(--cWhiteV1)",
                  color: "var(--cBlackV2)",
                  borderRadius: "4px",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                  whiteSpace: "nowrap",
                  zIndex: 10,
                  border: "1px solid var(--cBlackV2)",
                  overflow: "visible",
                }}
              >
                Meta: {formatNumberWithComma(goal[index])}
              </div>
            )}
          </div>
        ))}
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            minWidth: "1px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              backgroundColor: color,
              minWidth: "3px",
              position: "relative",
              zIndex: 0,
            }}
          ></div>
        </div>
      </div>
      <span>
        {percentage !== null
          ? `${formatNumberWithComma(percentage.toFixed(2))} %`
          : "0 %"}
      </span>
    </div>
  );
};

export default React.memo(HorizontalProgresiveBar);
