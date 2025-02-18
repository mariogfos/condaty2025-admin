"use client";
import React, { useState } from "react";
import ControlLabel, { PropsTypeInputBase } from "../ControlLabel";
import styles from "./textArea.module.css";

interface PropsType extends PropsTypeInputBase {
  lines?: number;
  isLimit?: boolean; // Activar o desactivar el contador de caracteres
  maxLength?: number; // Límite de caracteres
}

const TextArea = ({ maxLength, isLimit = false, ...props }: PropsType) => {
  const {
    name,
    placeholder = "",
    onChange = (e) => {},
    value = "",
    disabled = false,
    required = false,
    className = "",
    style = {},
    onBlur = () => {},
    onFocus = () => {},
  } = props;

  const [charCount, setCharCount] = useState(value?.length || 0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (maxLength && e.target.value.length <= maxLength) {
      setCharCount(e.target.value.length); // Actualiza el contador de caracteres
      onChange(e);
    }
    if (!maxLength) onChange(e); // Llama al onChange original
  };

  return (
    <div className={styles.textAreaWrapper}>
      <ControlLabel {...props} className={`${styles.textArea} ${className}`}>
        <textarea
          id={name}
          name={name}
          value={value || ""}
          placeholder={placeholder}
          style={{ width: "100%", ...style }}
          disabled={disabled}
          required={required}
          rows={props.lines}
          maxLength={maxLength} // Aplica el límite de caracteres
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-describedby={isLimit ? `${name}-charCounter` : undefined}
        />
      </ControlLabel>
      {isLimit && (
        <div
          id={`${name}-charCounter`}
          className={styles.charCounter}
          style={{ marginTop: -20, marginBottom: 12 }}
        >
          {charCount}/{maxLength} caracteres
        </div>
      )}
    </div>
  );
};

export default TextArea;
