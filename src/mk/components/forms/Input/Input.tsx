"use client";
import { useEffect, useRef } from "react";
import ControlLabel, { PropsTypeInputBase } from "../ControlLabel";
import styles from "./input.module.css";
// Nota: `kMaxLength` de 'buffer' no parece ser utilizado. Puedes eliminar esta importación si no es necesaria.
// import { kMaxLength } from "buffer";

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
    | "checkbox";
  min?: number; // Añadido
  max?: number; // Añadido
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
    onBlur = () => {},
    onFocus = () => {},
    onKeyDown = () => {},
    checked = false,
    maxLength,
    min, // Añadido
    max, // Añadido
    // ref = null,
  } = props;

  const inputRef: any = useRef(null);
  // const inputRef = ref || _inputRef;
  // CONTROLAR EL SCROLL DEL INPUT NUMBER
  useEffect(() => {
    const handleWheel = (e: any) => {
      if (inputRef.current && inputRef.current.type === "number") {
        e.preventDefault();
      }
    };

    inputRef.current?.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      inputRef.current?.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <ControlLabel {...props} className={`${styles.input} ${className}`}>
      <input
        id={name}
        type={type}
        ref={inputRef}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        name={name}
        value={value || ""}
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        disabled={disabled}
        required={required}
        style={style}
        aria-autocomplete="none"
        autoComplete="new-password"
        checked={checked}
        maxLength={maxLength || 255}
        min={min} // Añadido
        max={max} // Añadido
      />
    </ControlLabel>
  );
};

export default Input;
