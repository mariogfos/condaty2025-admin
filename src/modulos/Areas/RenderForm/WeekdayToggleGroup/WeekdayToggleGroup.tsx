import React from "react";
import styles from "./WeekdayToggleGroup.module.css";

import { useState } from "react";

// const days = [
//   "Lunes",
//   "Martes",
//   "Miércoles",
//   "Jueves",
//   "Viernes",
//   "Sábado",
//   "Domingo",
// ];
interface PropsType {
  days: any;
  selectedDays: any;
  onClick: any;
}

export default function WeekdayToggleGroup({
  onClick,
  days,
  selectedDays,
}: PropsType) {
  //   const toggleDay = (day: any) => {
  //     setSelectedDays((prev: any) =>
  //       prev.includes(day) ? prev.filter((d: any) => d !== day) : [...prev, day]
  //     );
  //   };
  return (
    <div className={styles.WeekdayToggleGroup}>
      {days.map((day: any) => (
        <button
          key={day}
          onClick={() => onClick(day)}
          style={{
            backgroundColor: selectedDays?.includes(day)
              ? "var(--cWhite)"
              : "transparent",
            color: selectedDays?.includes(day)
              ? "var(--cBlack)"
              : "var(--cWhiteV1)",
          }}
          //   className={}
          //   className={`border rounded-lg px-4 py-2 text-white ${
          //     selectedDays.includes(day)
          //       ? "bg-blue-600"
          //       : "bg-gray-800 border-gray-500"
          //   }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}
