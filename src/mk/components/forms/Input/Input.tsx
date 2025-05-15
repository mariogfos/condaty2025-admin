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
  min?: number;
  max?: number;
}

const Input = (props: PropsType) => {
  const {
    type = "text",
    name,
    placeholder = "",
    onChange = (e) => {},
    value,
    disabled = false,
    required = false,
    readOnly = false,
    className = "",
    style = {},
    onBlur = (e: any) => {},
    onFocus = (e: any) => {},
    onKeyDown = (e: any) => {},
    checked = false,
    maxLength,
    min,
    max,
  } = props;

  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);

  const formatForDisplayWhileTyping = (val: string | number | undefined): string => {
    // console.log(`[Input Debug formatWhileTyping] Input: "${val}"`);
    if (val === undefined || val === null || String(val).trim() === "") {
      // console.log(`[Input Debug formatWhileTyping] Output: "" (empty/null input)`);
      return "";
    }
    let [integerPart, decimalPart] = String(val).split('.');
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let result;
    if (decimalPart !== undefined) {
      result = `${integerPart}.${decimalPart}`;
    } else {
      result = integerPart;
    }
    // console.log(`[Input Debug formatWhileTyping] Output: "${result}"`);
    return result;
  };

  const formatForDisplayOnBlur = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return "";
    const num = parseFloat(String(val).replace(/,/g, ''));
    if (isNaN(num)) return "";
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${integerPart}.${parts[1]}`;
  };

  useEffect(() => {
    if (type === "currency") {
      const currentSanitizedPropValue = String(value || "").replace(/,/g, '');
      const currentSanitizedDisplayValue = displayValue.replace(/,/g, '');

      // console.log(`[Input Debug useEffect props.value] Trigger. value: "${value}", displayValue: "${displayValue}", rawProp: "${currentSanitizedPropValue}", rawDisplay: "${currentSanitizedDisplayValue}", focused: ${document.activeElement === inputRef.current}`);

      if (document.activeElement === inputRef.current) {
        if (currentSanitizedPropValue !== currentSanitizedDisplayValue) {
          // console.log(`[Input Debug useEffect props.value FOCUS] Prop value differs. Updating displayValue from prop.`);
          setDisplayValue(formatForDisplayWhileTyping(value));
        } else {
          // console.log(`[Input Debug useEffect props.value FOCUS] Prop value matches display. No change.`);
        }
      } else {
        // console.log(`[Input Debug useEffect props.value BLUR/INIT] Updating displayValue from prop.`);
        setDisplayValue(formatForDisplayWhileTyping(value));
      }
    }
  // }, [value, type]); // Original dependencies
  }, [value, type, displayValue]); // Added displayValue to dependencies, comparison is crucial.


  useEffect(() => {
    const currentInput = inputRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (currentInput && currentInput.type === "number" && document.activeElement === currentInput) {
        e.preventDefault();
      }
    };
    currentInput?.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      currentInput?.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    if (type === "currency" && inputRef.current && cursorPositionRef.current !== null) {
      // console.log(`[Input Debug useEffect cursor] Setting cursor to: ${cursorPositionRef.current}`);
      inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
      cursorPositionRef.current = null;
    }
  }, [displayValue, type]);


  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const originalCursorPos = e.target.selectionStart || 0;

    // console.log(`[Input Debug handleCurrencyChange] Start. inputValue: "${inputValue}", originalCursorPos: ${originalCursorPos}`);

    let sanitizedValue = "";
    let hasDecimalPoint = false;
    let rawCursorPos = 0;

    for (let i = 0; i < inputValue.length; i++) {
      const char = inputValue[i];
      if (char >= '0' && char <= '9') {
        sanitizedValue += char;
        if (i < originalCursorPos) rawCursorPos++;
      } else if (char === '.' && !hasDecimalPoint) {
        sanitizedValue += char;
        hasDecimalPoint = true;
        if (i < originalCursorPos) rawCursorPos++;
      }
    }
    
    if (sanitizedValue.length > 1 && sanitizedValue.startsWith('0') && !sanitizedValue.startsWith('0.')) {
        sanitizedValue = sanitizedValue.substring(1);
        if (originalCursorPos > 0) rawCursorPos = Math.max(0, rawCursorPos -1);
    }

    // console.log(`[Input Debug handleCurrencyChange] Sanitized. sanitizedValue: "${sanitizedValue}", rawCursorPos (in sanitized): ${rawCursorPos}`);

    const newDisplayValue = formatForDisplayWhileTyping(sanitizedValue);
    // console.log(`[Input Debug handleCurrencyChange] Formatted for display. newDisplayValue: "${newDisplayValue}"`);
    
    setDisplayValue(newDisplayValue);

    let currentRawChars = 0;
    let newCursorActualPos = 0;
    for (let i = 0; i < newDisplayValue.length && currentRawChars < rawCursorPos; i++) {
        newCursorActualPos++;
        if (newDisplayValue[i] !== ',') {
            currentRawChars++;
        }
    }
    if (currentRawChars < rawCursorPos || (sanitizedValue === "" && originalCursorPos > 0) ){
         newCursorActualPos = newDisplayValue.length;
    }
    if (sanitizedValue === "." && originalCursorPos ===1) newCursorActualPos = 1;
    
    // console.log(`[Input Debug handleCurrencyChange] Cursor calculation. newCursorActualPos: ${newCursorActualPos}`);
    cursorPositionRef.current = newCursorActualPos;

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: name,
        value: sanitizedValue,
      },
    };
    // console.log(`[Input Debug handleCurrencyChange] Calling onChange with value: "${sanitizedValue}"`);
    onChange(syntheticEvent);
  };

  const handleCurrencyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const currentValue = String(value || "").replace(/,/g, '');
    // console.log(`[Input Debug handleCurrencyBlur] Start. props.value (raw): "${currentValue}"`);

    const finalDisplayValue = formatForDisplayOnBlur(currentValue);
    // console.log(`[Input Debug handleCurrencyBlur] Formatted for blur display. finalDisplayValue: "${finalDisplayValue}"`);
    setDisplayValue(finalDisplayValue);

    let valueToPropagate = "";
    if (currentValue && !isNaN(parseFloat(currentValue))) {
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
    // console.log(`[Input Debug handleCurrencyBlur] Calling onChange with value: "${valueToPropagate}" and calling onBlur.`);
    onChange(syntheticEvent);
    onBlur(syntheticEvent);
  };

  const currentDisplayValue = type === "currency" ? displayValue : (value || "");
  const inputType = type === "currency" ? "text" : type;

  return (
    <ControlLabel {...props} className={`${styles.input} ${className} ${disabled ? styles.disabled : '' }`}>
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
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        disabled={disabled}
        required={required}
        style={style}
        aria-autocomplete="none"
        autoComplete="new-password"
        checked={checked}
        maxLength={maxLength || (type === "currency" ? 50 : 255)}
        min={min}
        max={max}
      />
    </ControlLabel>
  );
};

export default Input;