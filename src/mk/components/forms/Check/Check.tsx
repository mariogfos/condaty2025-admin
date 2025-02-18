import { reverse } from "dns";
import {
  IconCheckOff,
  IconCheckSquare,
} from "../../../../components/layout/icons/IconsBiblioteca";
import { PropsTypeInputBase } from "../ControlLabel";
import styles from "./check.module.css";

interface PropsType extends PropsTypeInputBase {
  checked?: boolean;
  optionValue?: string[];
  message?: string;
  reverse?: boolean;
}

const Check = ({
  optionValue = ["Y", "N"],
  className = "",
  reverse = false,
  ...props
}: PropsType) => {
  return (
    <div className={styles.check + " " + className}>
      <label
        htmlFor={props.name}
        style={{ color: props.checked ? "var(--cSuccess)" : "var(--cBlackV2)" }}
      >
        {!reverse && (
          <p>
            {props.label} {props.required ? "*" : null}
          </p>
        )}
        <input
          type="checkbox"
          name={props.name}
          id={props.name}
          required={props.required}
          disabled={props.disabled}
          readOnly={props.readOnly}
          onChange={props.onChange}
          onBlur={props.onBlur}
          value={props.value}
          checked={props.checked}
        />
        <span>
          {props.checked ? (
            <IconCheckSquare color="var(--cSuccess)" style={{ marginTop: 4 }} />
          ) : (
            <IconCheckOff style={{ marginTop: 4 }} />
          )}
        </span>
        {reverse && (
          <p>
            {props.label} {props.required ? "*" : null}
          </p>
        )}
        {!props.error ? null : (
          <p className="error">{props.error[props.name]} &nbsp;</p>
        )}
      </label>
    </div>
  );
};

export default Check;
