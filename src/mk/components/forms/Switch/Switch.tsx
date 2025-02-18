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
              onChange={onChange}
              value={optionValue[0]}
              checked={checked || value === optionValue[0]}
            />

            <div
              style={{
                backgroundColor:
                  value === optionValue[0]
                    ? "var(--cSuccess)"
                    : "var(--cBlackV2)",
                height: height ? `${height}px` : "24px",
                width: width ? `${width}px` : "44px",
              }}
              className={`${styles["bg-position"]} ${styles["rounded-full"]} ${styles["transition-background"]}`}
            >
              <div
                style={{
                  ...(value === optionValue[0]
                    ? {
                        transform: "translateX(20px)",
                        // boxShadow:
                        //   "0 4px 6px -1px rgb(0 0 0 / 0.1),  0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        backgroundColor: "var(--cBlackV1)",
                      }
                    : {
                        transform: "translateX(4px)",
                        // boxShadow:
                        //   "0 4px 6px -1px rgb(0 0 0 / 0.3),  0 2px 4px -2px rgb(0 0 0 / 0.3)",
                        backgroundColor: "var(--cBlackV1)",
                      }),
                  height: height ? `${height}px` : "20px",
                  width: width ? `${width}px` : "20px",
                  marginTop: "2px",
                }}
                className={`${styles["rounded-full"]} ${
                  styles["container-effect"]
                } ${styles["transitioned-element"]}  ${
                  value === (optionValue[0] ? optionValue[0] : "Y") ? "Y" : "N"
                }`}
              ></div>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default Switch;
