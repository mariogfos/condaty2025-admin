"use client";
import React, { useState } from "react";
import ControlLabel, { PropsTypeInputBase } from "../ControlLabel";
import styles from "./textArea.module.css";

interface PropsType extends PropsTypeInputBase {
  lines?: number;
  isLimit?: boolean; // Activar o desactivar el contador de caracteres
  maxLength?: number; // Límite de caracteres
  fullHeight?: boolean; // Llenar el 100% del alto del contenedor padre
}

const TextArea = ({
  lines = 6,
  maxLength,
  isLimit = false,
  fullHeight = false,
  ...props
}: PropsType) => {
  const {
    name,
    placeholder = "",
    onChange = (e) => {},
    value = "",
    disabled = false,
    required = true,
    className = "",
    style = {},
    onBlur = () => {},
    onFocus = () => {},
  } = props;

  const [charCount, setCharCount] = useState(value?.length || 0);

  const wrapperStyle: React.CSSProperties = fullHeight
    ? { height: "100%", display: "flex", flexDirection: "column" }
    : {};
  const containerStyle: React.CSSProperties = fullHeight ? { height: "100%" } : {};
  const fieldStyle: React.CSSProperties = fullHeight
    ? { height: "100%", display: "flex", flexDirection: "column" }
    : {};
  const textAreaStyle: React.CSSProperties = fullHeight
    ? { height: "100%", flex: 1, ...style }
    : { width: "100%", ...style };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (maxLength && e.target.value.length <= maxLength) {
      setCharCount(e.target.value.length); // Actualiza el contador de caracteres
      onChange(e);
    }
    if (!maxLength) onChange(e); // Llama al onChange original
  };

  return (
    <div className={styles.textAreaWrapper} style={wrapperStyle}>
      <ControlLabel
        {...props}
        className={`${styles.textArea} ${className} ${fullHeight ? styles.fullHeight : ""}`}
        style={fieldStyle}
        styleContainer={containerStyle}
      >
        <textarea
          id={name}
          name={name}
          value={value ?? ""}
          placeholder={placeholder}
          style={textAreaStyle}
          disabled={disabled}
          required={required}
          rows={fullHeight ? undefined : lines}
          maxLength={maxLength} // Aplica el límite de caracteres
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-describedby={isLimit ? `${name}-charCounter` : undefined}
        />
      </ControlLabel>
      {isLimit && (
        <div id={`${name}-charCounter`} className={styles.charCounter}>
          {charCount}/{maxLength} caracteres
        </div>
      )}
    </div>
  );
};

export default TextArea;
