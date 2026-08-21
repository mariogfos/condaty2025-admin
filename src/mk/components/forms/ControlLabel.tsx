import { CSSProperties, useMemo } from "react";
import stylesTextArea from "./TextArea/textArea.module.css";
import stylesInput from "./Input/input.module.css";

export const getFieldErrorMessage = (error: any, name: string) => {
  if (!error || !name) return "";

  const raw = error?.[name];
  if (raw === undefined || raw === null || raw === false) return "";

  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        typeof item === "string" ? item.trim() : String(item ?? "").trim(),
      )
      .filter(Boolean)
      .join(" ");
  }

  if (typeof raw === "object") {
    const values = Object.values(raw)
      .map((item) =>
        typeof item === "string" ? item.trim() : String(item ?? "").trim(),
      )
      .filter(Boolean);
    return values.join(" ");
  }

  return String(raw).trim();
};

export interface PropsTypeInputBase {
  name: string;
  value: any;
  label?: string;
  placeholder?: string;
  error?: any;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
  styleInput?: CSSProperties;
  onChange?: (e: any) => void;
  onBlur?: (() => void) | ((e: any) => void);
  onFocus?: (e: any) => void;
  iconLeft?: any;
  iconRight?: any;
  checked?: boolean;
  onKeyDown?: (e: any) => void;
  maxLength?: number;
  ref?: any;
  prefix?: string;
  suffix?: string;
  maxSize?: number; // in MB
}

interface PropsType extends PropsTypeInputBase {
  children?: any;
  styleContainer?: CSSProperties;
  onContainerClick?: (e: any) => void;
}

const ControlLabel = (props: PropsType) => {
  const fieldError = getFieldErrorMessage(props.error, props.name);
  const label: any = useMemo(() => {
    if (props.required === false && props.label) return props.label + " (opc)";
    return props.label;
  }, [props.label, props.required]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        ...props.styleContainer,
      }}
    >
      <div
        className={
          props.className +
          " " +
          (fieldError && stylesInput.error) +
          " " +
          (fieldError && stylesTextArea.error)
        }
        style={props.style}
        onClick={props.onContainerClick}
      >
        {props.iconLeft && <span>{props.iconLeft}</span>}
        {props.prefix && <span>{props.prefix}</span>}
        <div>
          {props.children}
          {props.label && <label htmlFor={props.name}>{label}</label>}
        </div>
        {props.iconRight && <span>{props.iconRight}</span>}
        {props.suffix && <span>{props.suffix}</span>}
      </div>
      {!fieldError ? null : <p className={stylesInput.error}>{fieldError}</p>}
    </div>
  );
};

export default ControlLabel;
