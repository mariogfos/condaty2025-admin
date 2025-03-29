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
    | "currency"; // Tipo "currency" para formato con puntos y comas
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
    onBlur = (e: any) => {}, // Especificar que acepta un evento
    onFocus = (e: any) => {}, // Especificar que acepta un evento
    onKeyDown = (e: any) => {},
    checked = false,
    maxLength,
    min,
    max,
  } = props;

  // Estado para manejar el valor formateado para el tipo "currency"
  const [formattedValue, setFormattedValue] = useState("");
  // Referencia para la posición del cursor
  const cursorPositionRef = useRef<number | null>(null);
  
  // Función para formatear números mientras se escribe
  // Esta función conserva los decimales solo si se ingresaron
  const formatCurrencyInput = (inputValue: string) => {
    // Si está vacío, devolver vacío
    if (!inputValue) return "";
    
    // Quitamos todos los puntos y convertimos comas en puntos para poder procesar
    let cleanValue = inputValue.replace(/\./g, '');
    
    // Si hay una coma, separamos en parte entera y decimal
    let hasDecimal = cleanValue.includes(',');
    let wholePart = hasDecimal ? cleanValue.split(',')[0] : cleanValue;
    let decimalPart = hasDecimal ? cleanValue.split(',')[1] : '';
    
    // Si la parte entera está vacía, usamos 0
    if (wholePart === '') wholePart = '0';
    
    // Formateamos la parte entera con puntos para miles
    let formattedWhole = '';
    for (let i = wholePart.length - 1, count = 0; i >= 0; i--, count++) {
      if (count > 0 && count % 3 === 0) {
        formattedWhole = '.' + formattedWhole;
      }
      formattedWhole = wholePart[i] + formattedWhole;
    }
    
    // Reconstruimos el valor con decimal solo si se ingresó
    return hasDecimal ? formattedWhole + ',' + decimalPart : formattedWhole;
  };
  
  // Función para formatear al perder el foco (agrega 2 decimales)
  const formatCurrencyBlur = (value: any) => {
    if (!value && value !== 0) return "";
    
    // Si es string, necesitamos convertirlo a número
    let numValue: number;
    if (typeof value === 'string') {
      // Quitamos puntos y cambiamos coma por punto para convertir
      const cleanValue = value.replace(/\./g, '').replace(',', '.');
      numValue = parseFloat(cleanValue);
    } else {
      numValue = parseFloat(String(value));
    }
    
    if (isNaN(numValue)) return "";
    
    // Formateamos con 2 decimales fijos al perder el foco
    return numValue.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Actualizar el valor formateado cuando cambia el prop value
  useEffect(() => {
    if (type === "currency" && value !== undefined) {
      // Si no tenemos un valor formateado manualmente, formateamos el valor del prop
      if (!formattedValue || cursorPositionRef.current === null) {
        // Cuando recibimos el valor inicial o cambia externamente, formateamos con decimales
        setFormattedValue(formatCurrencyBlur(value));
      }
    }
  }, [value, type]);

  const inputRef: any = useRef(null);

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

  // Después de actualizar el valor formateado, restauramos la posición del cursor
  useEffect(() => {
    if (type === "currency" && inputRef.current && cursorPositionRef.current !== null) {
      // Restaurar posición del cursor después de formatear
      inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
      // Restablecer la referencia
      cursorPositionRef.current = null;
    }
  }, [formattedValue, type]);

  // Manejador para input de tipo "currency"
  const handleCurrencyChange = (e: any) => {
    const inputValue = e.target.value;
    const input = e.target;
    
    // Permitir solo dígitos, comas y puntos
    if (!/^[0-9.,]*$/.test(inputValue)) {
      return;
    }
    
    // Guardar la posición del cursor antes de formatear
    const cursorPos = input.selectionStart;
    
    // Contar cuántos caracteres hay antes del cursor
    const valueBeforeCursor = inputValue.substring(0, cursorPos);
    const dotCountBeforeCursor = (valueBeforeCursor.match(/\./g) || []).length;
    
    // Formatear el valor mientras se escribe
    const newFormattedValue = formatCurrencyInput(inputValue);
    setFormattedValue(newFormattedValue);
    
    // Calcular la nueva posición del cursor después de formatear
    // Esto evita que el cursor salte al final después de formatear
    setTimeout(() => {
      if (inputRef.current) {
        const newValueBeforeCursor = newFormattedValue.substring(0, cursorPos + 1);
        const newDotCountBeforeCursor = (newValueBeforeCursor.match(/\./g) || []).length;
        const dotDifference = newDotCountBeforeCursor - dotCountBeforeCursor;
        
        const newCursorPos = cursorPos + dotDifference;
        cursorPositionRef.current = newCursorPos;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
    
    // Eliminar puntos y cambiar coma por punto para convertir a número
    const numericString = inputValue.replace(/\./g, '').replace(',', '.');
    const numericValue = parseFloat(numericString);
    
    // Crear un evento sintético para mantener la compatibilidad con el onChange original
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: name,
        value: isNaN(numericValue) ? '' : numericValue
      }
    };
    
    // Llamar al onChange original con el valor numérico
    onChange(syntheticEvent);
  };

  // Manejador para cuando el input "currency" pierde el foco
  const handleCurrencyBlur = (e: any) => {
    if (type === "currency" && value !== undefined && value !== '') {
      // Al perder el foco, formateamos con 2 decimales siempre
      setFormattedValue(formatCurrencyBlur(value));
    }
    onBlur(e);
  };
  
  // Manejador para cuando el input "currency" obtiene el foco
  const handleCurrencyFocus = (e: any) => {
    // Podríamos implementar una lógica específica cuando obtiene el foco si es necesario
    onFocus(e);
  };

  // Determinar qué manejadores usar según el tipo
  const handleChange = type === "currency" ? handleCurrencyChange : onChange;
  const handleFocusEvent = type === "currency" ? handleCurrencyFocus : onFocus;
  const handleBlurEvent = type === "currency" ? handleCurrencyBlur : onBlur;
  
  // Determinar qué valor mostrar según el tipo
  const displayValue = type === "currency" ? formattedValue : (value || "");
  
  // Para el tipo "currency", usamos "text" internamente
  const inputType = type === "currency" ? "text" : type;

  return (
    <ControlLabel {...props} className={`${styles.input} ${className}`}>
      <input
        id={name}
        type={inputType}
        ref={inputRef}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocusEvent}
        onBlur={handleBlurEvent}
        name={name}
        value={displayValue}
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        disabled={disabled}
        required={required}
        style={style}
        aria-autocomplete="none"
        autoComplete="new-password"
        checked={checked}
        maxLength={maxLength || 255}
        min={min}
        max={max}
      />
    </ControlLabel>
  );
};

export default Input;