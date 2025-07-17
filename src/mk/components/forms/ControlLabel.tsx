import { CSSProperties, useMemo } from "react";
import stylesTextArea from "./TextArea/textArea.module.css";
import stylesInput from "./Input/input.module.css";

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
  onFocus?: () => void;
  iconLeft?: any;
  iconRight?: any;
  checked?: boolean;
  onKeyDown?: (e: any) => void;
  maxLength?: number;
  ref?: any;
  prefix?: string;
  suffix?: string;
}

interface PropsType extends PropsTypeInputBase {
  children?: any;
}

const ControlLabel = (props: PropsType) => {
  const label: any = useMemo(() => {
    if (props.required === false && props.label) return props.label + " (opc)";
    return props.label;
  }, [props.label, props.required]);

  return (
    <>
      <div
        className={
          props.className +
          " " +
          (props.error?.[props.name] && stylesInput.error) +
          " " +
          (props.error?.[props.name] && stylesTextArea.error)
        }
        style={props.style}
      >
        {/* {JSON.stringify(props.error)} */}
        {props.iconLeft && <span>{props.iconLeft}</span>}
        {props.prefix && <span>{props.prefix}</span>}
        <div>
          {props.children}
          {props.label && <label htmlFor={props.name}>{label}</label>}
        </div>
        {props.iconRight && <span>{props.iconRight}</span>}
        {props.suffix && <span>{props.suffix}</span>}
      </div>
      {!props.error ? null : (
        <p className={stylesInput.error}>{props.error[props.name] || " "}</p>
      )}
    </>
  );
};

export default ControlLabel;
