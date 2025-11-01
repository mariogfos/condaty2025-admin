import React from "react";
import Input from "../Input/Input";
import styles from "./switch.module.css";

type PropsType = {
  name: string;
  optionValue?: string[];
  value: string;
  onChange: { (e: any): void };
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onBlur?: { (e: any): void };
  classDiv?: string;
  height?: number;
  width?: number;
  checked?: any;
};

const Switch = ({
  name,
  optionValue = ["Y", "N"],
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  classDiv = "",
  height,
  width,
  checked = false,
}: PropsType) => {
  const clase = classDiv || "";

  const handleChange = (e: any) => {
    const isChecked = e.target.checked;
    const newValue = isChecked ? optionValue[0] : optionValue[1];

    const syntheticEvent = {
      target: {
        name: name,
        value: newValue,
        checked: isChecked
      }
    };

    onChange(syntheticEvent);
  };

  const isActive = value === optionValue[0] || checked;
  return (
    <div className={styles.switch}>
      <div
        className={`${clase} ${styles["center-content"]} `}
        style={{ cursor: "pointer" }}
      >
        <label
          htmlFor={name}
          className={`${styles["logo-label"]} ${
            required ? `${styles["label-active"]} }` : null
          }`}
        >
          {label} {required ? "*" : null}
          <div
            className={`${styles["center-content"]} ${styles["container-label"]} `}
          >
            <Input
              type="checkbox"
              name={name}
              className={styles.srOnly}
              required={required}
              disabled={disabled}
              readOnly={readOnly}
              onChange={handleChange}
              value={optionValue[0]}
              checked={isActive}
            />

            <div
              style={{
                backgroundColor: isActive
                  ? "var(--cAccent)"
                  : "var(--cWhiteV1)",
                height: height ? `${height}px` : "24px",
                width: width ? `${width}px` : "84px",
              }}
              className={`${styles["bg-position"]} ${styles["rounded-full"]} ${styles["transition-background"]}`}
            >
              <div
                style={{
                  ...(isActive
                    ? {
                        transform: "translateX(20px)",
                        backgroundColor: "var(--cWhiteV2)",
                      }
                    : {
                        transform: "translateX(4px)",
                        backgroundColor: "var(--cWhiteV2)",
                      }),
                  height: height ? `${height}px` : "20px",
                  width: width ? `${width}px` : "20px",
                  marginTop: "2px",
                }}
                className={`${styles["rounded-full"]} ${
                  styles["container-effect"]
                } ${styles["transitioned-element"]} ${isActive ? "Y" : "N"}`}
              ></div>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default Switch;
