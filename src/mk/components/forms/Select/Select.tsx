/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  IconArrowDown,
  IconCheckOff,
  IconCheckSquare,
} from "@/components/layout/icons/IconsBiblioteca";
import { CSSProperties, useEffect, useRef, useState, useCallback } from "react";
import Input from "../Input/Input"; // Asumiendo que Input maneja la prop 'error' para mostrarse en rojo
import styles from "./select.module.css";
import { PropsTypeInputBase } from "../ControlLabel";
import { createPortal } from "react-dom";
import { useOnClickOutside } from "@/mk/hooks/useOnClickOutside";
import { Avatar } from "../../ui/Avatar/Avatar";

interface PropsType extends PropsTypeInputBase {
  multiSelect?: boolean;
  filter?: boolean;
  options: any[];
  optionLabel?: string;
  optionValue?: string;
  inputStyle?: CSSProperties;
  selectOptionsClassName?: string;
  style?: CSSProperties;
  multiSelectPanelWidth?: number;
}

const Select = ({
  value,
  name,
  error = null, // Esta prop debe venir del hook useCrud (o el formulario)
  className = "",
  selectOptionsClassName = "",
  multiSelect = false,
  filter = false,
  options = [],
  optionLabel = "name",
  optionValue = "id",
  readOnly = false,
  disabled = false,
  required = false,
  placeholder = "",
  label = "",
  inputStyle = {},
  style = {},
  multiSelectPanelWidth = 300,
  onBlur = () => {},
  onChange = (e: any) => {},
}: PropsType) => {
  const [selectValue, setSelectValue] = useState<string | any[]>(multiSelect ? [] : "");
  const [openOptions, setOpenOptions] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [selectedNames, setSelectedNames] = useState<string>("");
  const [position, setPosition] = useState<{top: number; left: number; width: number} | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const calcPosition = useCallback(() => {
    const inputEl = selectRef.current;
    const panelEl = panelRef.current;

    if (!inputEl) return;

    const inputRect = inputEl.getBoundingClientRect();

    if (multiSelect) {
      const panelWidth = multiSelectPanelWidth;
      const horizontalOffset = 8;

      let newLeft = inputRect.right + horizontalOffset;
      let newTop = inputRect.top;

      if (newLeft + panelWidth > window.innerWidth) {
        newLeft = inputRect.left - panelWidth - horizontalOffset;
      }
      if (newLeft < 0) {
        newLeft = horizontalOffset;
      }
      if (newLeft + panelWidth > window.innerWidth) {
        newLeft = window.innerWidth - panelWidth - horizontalOffset;
      }
      
      const panelCurrentHeight = panelEl ? panelEl.offsetHeight : 250;
      if (newTop + panelCurrentHeight > window.innerHeight) {
        newTop = window.innerHeight - panelCurrentHeight - 5;
      }
      if (newTop < 0) {
        newTop = 5;
      }

      setPosition({
        top: newTop,
        left: newLeft,
        width: panelWidth,
      });

    } else {
      const panelCurrentHeight = panelEl ? panelEl.offsetHeight : 250;
      let calculatedTop = inputRect.bottom;

      if ((inputRect.bottom + panelCurrentHeight > window.innerHeight) && (inputRect.top - panelCurrentHeight > 0)) {
          calculatedTop = inputRect.top - panelCurrentHeight;
      }
      else if (inputRect.bottom + panelCurrentHeight > window.innerHeight) {
            calculatedTop = window.innerHeight - panelCurrentHeight - 5;
            if (calculatedTop < 0) calculatedTop = 5;
      }
      if (calculatedTop < 0) calculatedTop = 5;

      setPosition({
        top: calculatedTop,
        left: inputRect.left,
        width: inputRect.width,
      });
    }
  }, [multiSelect, multiSelectPanelWidth, panelRef]); // selectRef es estable, no necesita estar en deps si no cambia

  useEffect(() => {
    if (multiSelect) {
      if (Array.isArray(options) && Array.isArray(selectValue)) {
        const selectedOptionObjects = options.filter((option: any) =>
          (selectValue as any[]).includes(option[optionValue])
        );
        let displayValue = "";
        if (selectedOptionObjects.length === 0) {
          displayValue = "";
        } else if (selectedOptionObjects.length > 2) {
          displayValue = `${selectedOptionObjects.length} elementos seleccionados`;
        } else {
          displayValue = selectedOptionObjects
            .map((opt: any) => opt[optionLabel] || "")
            .join(", ");
        }
        setSelectedNames(displayValue);
      } else {
        setSelectedNames("");
      }
    }
  }, [selectValue, options, multiSelect, optionLabel, optionValue]);

  useEffect(() => {
    if (multiSelect) {
      const currentPropValue = Array.isArray(value) ? value : [];
      if (JSON.stringify(selectValue) !== JSON.stringify(currentPropValue)) {
        setSelectValue(currentPropValue);
      }
    } else {
      let textForSingleSelect = "";
      if (value !== null && value !== undefined && value !== "" && Array.isArray(options) && options.length > 0) {
        const foundOption = options.find((o: any) => o[optionValue] === value);
        if (foundOption) {
          textForSingleSelect = foundOption[optionLabel] || "";
        }
      }
      if (selectValue !== textForSingleSelect) {
        setSelectValue(textForSingleSelect);
      }
    }
  }, [value, options, multiSelect, optionLabel, optionValue, selectValue]);


  useEffect(() => {
    if (openOptions) {
      calcPosition();
      
      const findScrollableParent = (element: HTMLElement | null): HTMLElement | Window => {
        if (!element) return window;
        let parent = element.parentElement;
        while (parent) {
          if (parent === document.body || parent === document.documentElement) return window;
          const { overflowY, overflowX } = window.getComputedStyle(parent);
          if (/(auto|scroll)/.test(overflowY + overflowX)) {
            return parent;
          }
          parent = parent.parentElement;
        }
        return window;
      };
      const scrollableParent = findScrollableParent(selectRef.current);
      
      window.addEventListener("resize", calcPosition);
      if (scrollableParent !== window) {
         (scrollableParent as HTMLElement).addEventListener("scroll", calcPosition, true);
      }
      window.addEventListener("scroll", calcPosition, true);

      return () => {
        window.removeEventListener("resize", calcPosition);
        if (scrollableParent !== window) {
          (scrollableParent as HTMLElement).removeEventListener("scroll", calcPosition, true);
        }
        window.removeEventListener("scroll", calcPosition, true);
      };
    }
  }, [openOptions, calcPosition]);

  if (!Array.isArray(options)) return null;

  const handleSelectClickElement = (elementValue: any) => {
    const option = options.find(opt => opt[optionValue] === elementValue);
    if (option) {
        setSelectValue(option[optionLabel] || "");
    } else {
        setSelectValue("");
    }
    setOpenOptions(false);
    onChange({ target: { name: name, value: elementValue } });
  };

  const handleSelectMultiClickElement = (elementValue: any) => {
    const currentSelectedValues = Array.isArray(selectValue) ? [...selectValue] : [];
    const index = currentSelectedValues.indexOf(elementValue);
    if (index !== -1) {
      currentSelectedValues.splice(index, 1);
    } else {
      currentSelectedValues.push(elementValue);
    }
    setSelectValue(currentSelectedValues);
    onChange({ target: { name: name, value: currentSelectedValues } });
  };

  const handleSelectClickIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setOpenOptions((old) => !old);
    }
  };

  const Section = () => {
    const [search, setSearch] = useState("");
    const [filteredOptions, setFilteredOptions] = useState(options);

     useEffect(() => {
        setFilteredOptions(options || []);
    }, [options]);

    const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = e.target.value;
      setSearch(searchValue);
      const normalizedSearchValue = searchValue
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
      const newFilteredOptions = (options || []).filter((option: any) =>
        (option[optionLabel] || "")
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .includes(normalizedSearchValue)
      );
      setFilteredOptions(newFilteredOptions);
    };

    useOnClickOutside(
      panelRef,
      () => {
        setOpenOptions(false);
      },
      null
    );

    return (
      <section
        ref={panelRef}
        className={`${styles.selectOptions} ${multiSelect ? styles.multiSelectSidePanel : ''} ${selectOptionsClassName}`}
        style={position ? {
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        } : { display: 'none' }}
      >
        {filter && (
          <div className={styles.filterInputContainer}>
            <Input
              type="text"
              value={search}
              onChange={onChangeSearch}
              name={"search-" + name} // Nombre único para el input de búsqueda
              placeholder={"Buscar..."}
            />
          </div>
        )}
        <ul>
          {(filteredOptions || []).map((option: any, key: any) => (
            <li
              className={
                Array.isArray(selectValue)
                  ? (selectValue as any[]).includes(option[optionValue])
                    ? styles["selected"]
                    : ""
                  : selectValue === (option[optionLabel] || "") 
                  ? styles["selected"]
                  : ""
              }
              key={"li" + name + (option[optionValue] !== undefined ? option[optionValue] : key)}
              onClick={
                !multiSelect
                  ? (e) => {
                      handleSelectClickElement(option[optionValue] !== undefined ? option[optionValue] : key);
                      e.stopPropagation();
                    }
                  : (e) => {
                      handleSelectMultiClickElement(
                        option[optionValue] !== undefined ? option[optionValue] : key
                      );
                      e.stopPropagation();
                    }
              }
            >
              <div style={{ alignItems: "center", gap: "8px", display: "flex", width: "100%"}}>
                {option["img"] && (
                  <Avatar
                    className={styles.avatar}
                    name={option[optionLabel] || ""}
                    src={option["img"]}
                    h={32}
                    w={32}
                  />
                )}
                <span style={{ flexGrow: 1 }}>{option[optionLabel] || ""}</span>
                {multiSelect && (
                  Array.isArray(selectValue) &&
                  (selectValue as any[]).includes(option[optionValue]) ? (
                    <IconCheckSquare size={18} />
                  ) : (
                    <IconCheckOff size={18} />
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  let displayValueInInput: string = "";
  if (multiSelect) {
    displayValueInInput = selectedNames;
  } else {
    if (typeof selectValue === 'string' && selectValue) {
        displayValueInInput = selectValue;
    } else if (value !== null && value !== undefined && value !== "" && Array.isArray(options) && options.length > 0) {
        const foundOption = options.find(opt => opt[optionValue] === value);
        if (foundOption) {
            displayValueInInput = foundOption[optionLabel] || "";
        }
    }
  }

  return (
    <div
      ref={selectRef}
      className={`${styles.select} ${className}`}
      style={style}
    >
      <div onClick={handleSelectClickIcon} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <Input
          type={"text"}
          value={displayValueInInput}
          readOnly={true}
          label={label}
          name={name} // CORRECCIÓN: Restaurado a 'name' (el nombre original del campo)
          // onChange={undefined} // CORRECCIÓN: El Input de display no necesita el onChange principal
          iconRight={<IconArrowDown className={openOptions ? styles.rotate : ""} />}
          placeholder={placeholder}
          required={required} // La prop 'required' en el Input visual es más para ARIA o estilos.
                              // La validación real se hace sobre el 'value' del Select.
          onBlur={onBlur} // Se pasa el onBlur por si el Input interno lo usa para algo.
          disabled={disabled}
          error={error} // Esta prop es la que debería hacer que Input se muestre en rojo.
          style={inputStyle}
        />
      </div>
      {openOptions && typeof document !== 'undefined' &&
        createPortal(
          <Section />,
          document.getElementById("portal-root") || document.body
        )}
    </div>
  );
};

export default Select;