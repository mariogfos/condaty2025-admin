"use client";
import { useEffect, useRef, useState } from "react";
import ControlLabel, { PropsTypeInputBase } from "../ControlLabel";
import styles from "./input.module.css";

interface PropsType extends PropsTypeInputBase {
  type?:
    | "text"
    | "email"
    | "password"
    | "datetime-local"
    | "number"
    | "date"
    | "hidden"
    | "file"
    | "search"
    | "checkbox"
    | "currency";
  min?: any;
  max?: any;
  prefix?: string;
  suffix?: string;
  autoComplete?: string;
}

const Input = (props: PropsType) => {
  const {
    type = "text",
    name,
    placeholder = "",
    onChange = (e) => {},
    value,
    disabled = false,
    required = true,
    readOnly = false,
    className = "",
    styleInput = {},
    onBlur = (e: any) => {},
    onFocus = (e: any) => {},
    onKeyDown = (e: any) => {},
    checked = false,
    maxLength,
    label,
    prefix,
    suffix,
    min,
    max,
    autoComplete,
  } = props;
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);

  const formatForDisplayWhileTyping = (
    val: string | number | undefined
  ): string => {
    if (val === undefined || val === null || String(val).trim() === "")
      return "";
    let [integerPart, decimalPart] = String(val).split(".");
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (decimalPart !== undefined) {
      return `${integerPart}.${decimalPart}`;
    }
    return integerPart;
  };

  const formatForDisplayOnBlur = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return "";
    const num = parseFloat(String(val).replace(/,/g, ""));
    if (isNaN(num)) {
      // Si es solo un punto o inválido, no mostrar nada o "0.00"
      if (String(val).trim() === ".") return formatForDisplayOnBlur("0"); // Formatea "0" como "0.00"
      return ""; // Para otros inválidos, no mostrar nada en el display
    }
    const parts = num.toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${integerPart}.${parts[1]}`;
  };

  useEffect(() => {
    if (type === "currency") {
      // console.log(`[Input Debug useEffect props.value] Triggered. props.value: "${value}" (type: ${typeof value}), current displayValue state: "${displayValue}", focused: ${document.activeElement === inputRef.current}`);
      const rawPropValue = String(value || "").replace(/,/g, "");
      const newFormattedDisplay = formatForDisplayWhileTyping(value);

      if (document.activeElement === inputRef.current) {
        const currentRawDisplayValue = displayValue.replace(/,/g, "");
        if (rawPropValue !== currentRawDisplayValue) {
          // console.log(`[Input Debug useEffect props.value FOCUS] Raw prop value ("${rawPropValue}") differs from raw displayValue ("${currentRawDisplayValue}"). Setting displayValue to: "${newFormattedDisplay}" based on props.value: "${value}"`);
          setDisplayValue(newFormattedDisplay);
        }
      } else {
        if (displayValue !== newFormattedDisplay) {
          // console.log(`[Input Debug useEffect props.value BLUR/INIT] displayValue ("${displayValue}") differs from newFormattedDisplay ("${newFormattedDisplay}") from props.value. Setting displayValue.`);
          setDisplayValue(newFormattedDisplay);
        }
      }
    }
  }, [value, type, displayValue]);

  useEffect(() => {
    const currentInput = inputRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (
        currentInput &&
        currentInput.type === "number" &&
        document.activeElement === currentInput
      ) {
        e.preventDefault();
      }
    };
    currentInput?.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      currentInput?.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    if (
      type === "currency" &&
      inputRef.current &&
      cursorPositionRef.current !== null
    ) {
      inputRef.current.setSelectionRange(
        cursorPositionRef.current,
        cursorPositionRef.current
      );
      cursorPositionRef.current = null;
    }
  }, [displayValue, type]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const originalCursorPos = e.target.selectionStart || 0;

    let sanitizedValue = "";
    let hasDecimalPoint = false;
    let rawCursorPos = 0;

    for (let i = 0; i < inputValue.length; i++) {
      const char = inputValue[i];
      if (char >= "0" && char <= "9") {
        // Si ya hay un punto y estamos en la parte decimal, verificar longitud de decimales
        if (hasDecimalPoint) {
          const decimalPart = sanitizedValue.split(".")[1] || "";
          if (decimalPart.length < 2) {
            // Solo añadir si tenemos menos de 2 decimales
            sanitizedValue += char;
            if (i < originalCursorPos) rawCursorPos++;
          } else {
            // Si ya hay 2 decimales y se intenta escribir otro dígito decimal,
            // no añadirlo y ajustar rawCursorPos si es necesario (no debería cambiar si no se añade).
          }
        } else {
          // Parte entera o aún no hay punto
          sanitizedValue += char;
          if (i < originalCursorPos) rawCursorPos++;
        }
      } else if (char === "." && !hasDecimalPoint) {
        sanitizedValue += char;
        hasDecimalPoint = true;
        if (i < originalCursorPos) rawCursorPos++;
      }
    }

    if (
      sanitizedValue.length > 1 &&
      sanitizedValue.startsWith("0") &&
      !sanitizedValue.startsWith("0.")
    ) {
      sanitizedValue = sanitizedValue.substring(1);
      if (originalCursorPos > 0 && rawCursorPos > 0)
        rawCursorPos = Math.max(0, rawCursorPos - 1);
    }

    // La lógica de truncamiento explícito después del bucle ya no es necesaria si el bucle la maneja.
    // Si se quiere mantener la lógica de truncamiento post-bucle (por si el bucle no es perfecto):
    // if (hasDecimalPoint) {
    //   const parts = sanitizedValue.split('.');
    //   if (parts[1] && parts[1].length > 2) {
    //     parts[1] = parts[1].substring(0, 2);
    //     sanitizedValue = `${parts[0]}.${parts[1]}`;
    //     // Aquí se necesitaría un ajuste más complejo para rawCursorPos si se trunca así.
    //     // Es mejor prevenir la entrada de más de 2 decimales en el bucle de arriba.
    //   }
    // }

    const newDisplayValue = formatForDisplayWhileTyping(sanitizedValue);
    setDisplayValue(newDisplayValue);

    // --- Lógica del Cursor (puede necesitar ajustes finos con la restricción de decimales) ---
    let currentRawChars = 0;
    let newCursorActualPos = 0;
    if (rawCursorPos === 0) {
      newCursorActualPos = 0;
    } else if (sanitizedValue.length > 0) {
      // Asegurarse que sanitizedValue no está vacío
      for (let i = 0; i < newDisplayValue.length; i++) {
        if (newDisplayValue[i] !== ",") {
          currentRawChars++;
        }
        if (currentRawChars === rawCursorPos) {
          newCursorActualPos = i + 1;
          break;
        }
        // Si el bucle termina y no encontramos suficientes rawChars (rawCursorPos > currentRawChars)
        // o si llegamos al final del newDisplayValue.
        if (i === newDisplayValue.length - 1) {
          newCursorActualPos = newDisplayValue.length;
        }
      }
    }
    if (sanitizedValue === "") newCursorActualPos = 0;

    cursorPositionRef.current = newCursorActualPos;

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: name,
        value: sanitizedValue,
      },
    };
    onChange(syntheticEvent);
  };

  const handleCurrencyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let currentValue = String(value || "").replace(/,/g, "");

    if (
      currentValue === "." ||
      (currentValue && isNaN(parseFloat(currentValue)))
    ) {
      currentValue = ""; // Tratar un punto solo o no números como vacío para el valor lógico
    }

    const finalDisplayValue = formatForDisplayOnBlur(currentValue);
    setDisplayValue(finalDisplayValue);

    let valueToPropagate = "";
    if (currentValue !== "" && !isNaN(parseFloat(currentValue))) {
      valueToPropagate = parseFloat(currentValue).toFixed(2);
    }

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: name,
        value: valueToPropagate,
      },
    };
    onChange(syntheticEvent);
    onBlur(syntheticEvent);
  };

  const currentDisplayValue = type === "currency" ? displayValue : value || "";
  const inputType = type === "currency" ? "text" : type;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (type === "number" && (e.key === "e" || e.key === "E")) {
      e.preventDefault();
      return;
    }
    onKeyDown(e);
  };

  return (
    <ControlLabel
      value={value}
      label={props.label}
      required={required}
      name={name}
      error={props.error}
      iconLeft={props.iconLeft}
      iconRight={props.iconRight}
      prefix={prefix}
      suffix={suffix}
      style={props.style}
      styleInput={styleInput}
      className={`${styles.input} ${className} ${
        disabled ? styles.disabled : ""
      }`}
    >
      <input
        id={name}
        type={inputType}
        ref={inputRef}
        placeholder={placeholder}
        onChange={type === "currency" ? handleCurrencyChange : onChange}
        onFocus={onFocus}
        onBlur={type === "currency" ? handleCurrencyBlur : onBlur}
        name={name}
        value={currentDisplayValue}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        disabled={disabled}
        required={required}
        style={{ paddingTop: !label ? 0 : 8, ...styleInput }}
        aria-autocomplete="none"
        autoComplete={autoComplete || "new-password"}
        checked={checked}
        maxLength={maxLength || (type === "currency" ? 50 : 255)}
        min={min}
        max={max}
      />
    </ControlLabel>
  );
};

export default Input;
