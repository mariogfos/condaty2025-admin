import React from "react";
import styles from "./Detail.module.css";
interface Props {
  value: string;
  label: string;
  colorValue?: string;
}
const LabelValueDetail = ({ value, label, colorValue }: Props) => {
  return (
    <div className={styles.LabelValueDetail}>
      <p>{label}</p>
      <p
        style={{
          color: colorValue ? colorValue : "var(--cWhite)",
        }}
      >
        {value}
      </p>
    </div>
  );
};
export default LabelValueDetail;
