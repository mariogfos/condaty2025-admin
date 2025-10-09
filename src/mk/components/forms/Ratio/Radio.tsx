import React from "react";
import style from "./Radio.module.css";
import {
  IconRatioOff,
  IconRatioOn,
} from "@/components/layout/icons/IconsBiblioteca";

type PropsType = {
  checked: boolean;
  label: string;
  subtitle?: string;
  onChange: (checked: boolean) => void; // Prop para manejar el cambio
  disabled?: boolean;
};
const Radio = ({ checked, label, subtitle, onChange, disabled }: PropsType) => {
  const handleClick = () => {
    if (disabled) {
      return;
    }
    onChange(!checked);
  };
  return (
    <div className={style.radio}>
      <div>
        {checked ? (
          <IconRatioOn
            onClick={handleClick}
            style={{ cursor: "pointer" }}
            color={"var(--cSuccess)"}
          />
        ) : (
          <IconRatioOff
            onClick={handleClick}
            style={{ cursor: "pointer" }}
            color={"var(--cWhiteV1)"}
          />
        )}
        <div>
          <p>{label}</p>
          <p>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default Radio;
