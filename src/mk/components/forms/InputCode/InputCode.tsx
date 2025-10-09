import { useEffect, useRef } from "react";
import styles from "./inputCode.module.css";
import ControlLabel from "../ControlLabel";

interface InputCodeProps {
  setCode: any;
  type?: string;
  placeholder?: string;
  name: string;
  label: string;
  value?: string;
  tabIndex?: number;
  error?: any;
  required?: boolean;
  onChange?: any;
  className?: string;
}

const InputCode = ({
  setCode,
  type = "text",
  placeholder = "●",
  name,
  label,
  value = "",
  tabIndex = 0,
  error = null,
  required = false,
  onChange = (e: any) => {},
  className = "",
}: InputCodeProps) => {
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const sendCode = () => {
    const code = inputRefs.current.map((input) => input.value).join("");
    setCode(code.trim());
  };
  let color = error[name] ? "var(--cError)" : "var(--cWhite)";
  useEffect(() => {
    inputRefs.current.forEach((input, index) => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Backspace" && input.value === "") {
          inputRefs.current[Math.max(0, index - 1)].focus();
        }
      };

      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const first = target.value[0];
        const rest = target.value.slice(1);

        target.value = first ?? "";

        const lastInputBox = index === inputRefs.current.length - 1;
        const didInsertContent = first !== undefined;

        if (!first) {
          if (index > 0) inputRefs.current[index - 1].focus();
          sendCode();
          return;
        }

        if (!rest && !lastInputBox) {
          inputRefs.current[index + 1].focus();
          sendCode();
          return;
        }

        if (didInsertContent && !lastInputBox) {
          inputRefs.current[index + 1].focus();
          inputRefs.current[index + 1].value = rest;
          inputRefs.current[index + 1].dispatchEvent(new Event("input"));
        }

        sendCode();
      };

      input.addEventListener("keydown", handleKeyDown);
      input.addEventListener("input", handleInput);

      return () => {
        input.removeEventListener("keydown", handleKeyDown);
        input.removeEventListener("input", handleInput);
      };
    });
  }, []);
  return (
    <>
      <ControlLabel
        name={name}
        value={value}
        label={!error ? label : error[name]}
        style={{ color: color, marginBottom: 16 }}
      >
        <div>
          <div className={styles.inputCodeContainer}>
            {[...Array(4)].map((_, i) => (
              <input
                key={i}
                ref={(el: any) => (inputRefs.current[i] = el!)}
                name={`code${i + 1}`}
                id={`code${i + 1}`}
                className={styles["inputCode"]}
                style={{ color: color, borderColor: color }}
                required={required}
                placeholder={placeholder}
                autoComplete="off"
                value={value[i] || ""}
                type={type}
                onChange={onChange}
                aria-label={`Pin ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </ControlLabel>
    </>
  );
};

export default InputCode;
