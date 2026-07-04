"use client";
import {
  IconCheckOff,
  IconCheckSquare,
} from "@/components/layout/icons/IconsBiblioteca";
import { IconArrowDown } from "@/components/layout/icons/LucideIcons";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Input from "../Input/Input";
import styles from "./select.module.css";
import { PropsTypeInputBase, getFieldErrorMessage } from "../ControlLabel";
import { createPortal } from "react-dom";
import { useOnClickOutside } from "@/mk/hooks/useOnClickOutside";
import { Avatar } from "../../ui/Avatar/Avatar";
import { shouldIgnoreValueTranslationContext } from "@/i18n/translationGuards";
// import { buscarCoincidencias } from "@/mk/utils/searchs";

interface PropsType extends PropsTypeInputBase {
  multiSelect?: boolean;
  filter?: boolean;
  options: any[];
  optionLabel?: string;
  optionValue?: string;
  inputStyle?: any;
  selectOptionsClassName?: string;
  style?: CSSProperties;
  filterStyle?: CSSProperties;
}

const getDisplayLabel = (option: any, optionLabel: string, optionValue: string) => {
  if (!option) return "";
  return option[optionLabel] || option.label || String(option[optionValue] ?? "");
};

const Section = ({
  selectRef1,
  position,
  selectOptionsClassName,
  filter,
  filterStyle,
  name,
  _options,
  search,
  onChangeSearch,
  multiSelect,
  selectValue,
  optionValue,
  optionLabel,
  handleSelectClickElement,
  handleSelectMultiClickElement,
  onClose,
  selectRef,
  ignoreOptionsTranslation,
}: any) => {
  useOnClickOutside(
    selectRef1,
    () => {
      onChangeSearch({ target: { value: "" } });
      onClose();
    },
    selectRef,
  );

  return (
    <section
      ref={selectRef1}
      className={`${styles.selectOptions} ${selectOptionsClassName}`}
      style={{
        top: `${position?.top || 0}px`,
        left: `${position?.left || 0}px`,
        minWidth: `${position?.width || 0}px`,
      }}
    >
      <div className={filter ? styles.searchBox : styles.hidden}>
        <Input
          type="text"
          value={search}
          onChange={onChangeSearch}
          name={`search${name}`}
          placeholder={"Buscar..."}
          error={false}
          style={{ ...filterStyle }}
        />
      </div>
      <ul>
        {_options.map
          ? _options.map((option: any, key: any) => (
              (() => {
                const isGroupLabel = Boolean(option?.isGroupLabel);
                const isSelected = isGroupLabel
                  ? false
                  : Array.isArray(selectValue)
                    ? selectValue.includes(option[optionValue])
                    : selectValue === option[optionValue];

                return (
              <li
                data-i18n-ignore={
                  ignoreOptionsTranslation || option.translate === false
                    ? "true"
                    : undefined
                }
                className={[
                  isSelected ? styles["selected"] : "",
                  isGroupLabel ? styles.groupOption : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={`li${name}${option[optionValue] ?? key}`}
                onClick={
                  isGroupLabel
                    ? undefined
                    : !multiSelect
                    ? (e) => {
                        handleSelectClickElement(option[optionValue] ?? key);
                        e.stopPropagation();
                      }
                    : (e) => {
                        handleSelectMultiClickElement(
                          option[optionValue] ?? key,
                        );
                        e.stopPropagation();
                      }
                }
              >
                <div className={styles.optionContent}>
                  {option["img"] && !isGroupLabel && (
                    <Avatar
                      className={styles.avatar}
                      name={getDisplayLabel(option, optionLabel, optionValue)}
                      src={option["img"]}
                      h={32}
                      w={32}
                    />
                  )}
                  {multiSelect && !isGroupLabel ? (
                    Array.isArray(selectValue) &&
                    selectValue.includes(option[optionValue]) ? (
                      <IconCheckSquare size={18} />
                    ) : (
                      <IconCheckOff size={18} />
                    )
                  ) : null}
                  <div
                    className={isGroupLabel ? styles.groupLabelText : ""}
                    style={{ flexGrow: 1, flexBasis: 0 }}
                  >
                    {getDisplayLabel(option, optionLabel, optionValue)}
                  </div>
                </div>
              </li>
                );
              })()
            ))
          : Object.keys(_options).map((key) => (
              <li
                key={`li${name}${key}`}
                onClick={() =>
                  handleSelectClickElement(
                    _options[key][optionValue] || _options[key].label,
                  )
                }
              >
                {_options[key][optionValue] || _options[key].label}
              </li>
            ))}
      </ul>
    </section>
  );
};

const Select = ({
  value,
  name,
  error = null,
  className = "",
  selectOptionsClassName = "",
  multiSelect = false,
  filter = false,
  options = [],
  optionLabel = "name",
  optionValue = "id",
  readOnly = false,
  disabled = false,
  required = true,
  placeholder = "",
  label = "",
  inputStyle = {},
  filterStyle = {},
  style = {},
  onBlur = () => {},
  onChange = (e: any) => {},
}: PropsType) => {
  const [selectValue, setSelectValue] = useState(
    value || (multiSelect ? [] : ""),
  );
  const [openOptions, setOpenOptions] = useState(false);
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [selectedNames, setSelectedNames]: any = useState("");
  const [position, setPosition]: any = useState(null);
  const selectRef1 = useRef<HTMLDivElement>(null);
  const ignoreOptionsTranslation = shouldIgnoreValueTranslationContext({
    label,
    key: name,
  });
  const fieldError = getFieldErrorMessage(error, name);
  const safeOptions = Array.isArray(options) ? options : [];
  const isAutoWidth =
    style?.width === "auto" ||
    style?.width === "fit-content" ||
    style?.minWidth === "auto";

  // esto se esta dejando cuando para verlo despues cuando se aplique el otro tipo de busqueda 06/11/2025

  // const [filteredOptions, setFilteredOptions] = useState(options);
  // let filteredOptions = options;

  // useEffect(() => {
  //   if (search) {
  //     const filteredOptions = buscarCoincidencias(
  //       options,
  //       search,
  //       optionLabel || "label",
  //       {
  //         umbralSimilitud: 0.5,
  //       }
  //     );
  //     setFilteredOptions(filteredOptions);
  //   }
  // }, [search]);

  const findParentWithClass = (element: any, className: string) => {
    while (element && element !== document) {
      if (element.classList.contains(className)) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  };

  useEffect(() => {
    if (multiSelect) {
      const currentSelectedValues = Array.isArray(selectValue)
        ? selectValue
        : [];

      if (
        safeOptions.length > 0 &&
        currentSelectedValues.length > 0
      ) {
        const selectedFullOptions = safeOptions.filter((option: any) =>
          currentSelectedValues.includes(option[optionValue]),
        );

        let displayString = "";
        const count = selectedFullOptions.length;

        if (count > 10) {
          displayString = `${count} elementos seleccionados`;
        } else {
          const namesArray = selectedFullOptions.map((option: any) => {
            // Si el objeto tiene campo nro y estamos en multiSelect, mostrar solo el número
            if (multiSelect && option.nro) {
              return String(option.nro);
            }
            return (
              option[optionLabel] || option.label || String(option[optionValue])
            );
          });
          displayString = namesArray.join(", ");
        }
        setSelectedNames(displayString);
      } else {
        setSelectedNames("");
      }
    }
  }, [multiSelect, optionLabel, optionValue, safeOptions, selectValue]);

  useEffect(() => {
    const parentWithClass = findParentWithClass(
      selectRef.current,
      "contScrollable",
    );
    if (parentWithClass) {
      parentWithClass.addEventListener("scroll", calcPosition);
    }
    return () => {
      if (parentWithClass) {
        parentWithClass.removeEventListener("scroll", calcPosition);
      }
    };
  }, []);

  const calcPosition = () => {
    const select: any = selectRef.current;
    const child: any = selectRef1.current;

    if (!select) return;

    let parent: any = select.getBoundingClientRect();
    let childPosition: any = child?.getBoundingClientRect();

    let up = 57;
    if (childPosition) {
      if (parent.top + 57 + childPosition.height > window.innerHeight) {
        up = childPosition.height * -1;
      }
    }
    setPosition({
      top: parent.top + up,
      left: parent.left,
      width: parent.width,
    });
  };

  useEffect(() => {
    if (openOptions) {
      calcPosition();
    }
  }, [openOptions]);
  //cambio for value in multiselect
  useEffect(() => {
    if (multiSelect) {
      if (
        Array.isArray(value) &&
        JSON.stringify(value) !== JSON.stringify(selectValue)
      ) {
        setSelectValue(value);
      }
      if (
        Array.isArray(value) &&
        value.length === 0 &&
        Array.isArray(selectValue) &&
        selectValue.length !== 0
      ) {
        setSelectValue([]);
      }
    } else {
      if (value !== selectValue) {
        setSelectValue(value);
      }
    }
  }, [value, multiSelect]);

  const selectedOption = useMemo(() => {
    if (multiSelect || safeOptions.length === 0) return null;
    return (
      safeOptions.find((option: any) => option?.[optionValue] == value) || null
    );
  }, [multiSelect, optionValue, safeOptions, value]);

  const currentValueLabel = multiSelect
    ? selectedNames
    : getDisplayLabel(selectedOption, optionLabel, optionValue);

  const hasValue = Boolean(currentValueLabel);
  const triggerText = hasValue
    ? currentValueLabel
    : placeholder || "Seleccionar";
  const triggerStyle = {
    ...inputStyle,
    ...((isFocused || openOptions) && !disabled && !readOnly
      ? {
          borderColor: "var(--cPrimary)",
          boxShadow: "0 0 0 3px rgba(0, 227, 140, 0.12)",
        }
      : {}),
  };

  const closeOptions = () => {
    setOpenOptions(false);
    setSearch("");
    onBlur?.({ target: { name, value: selectValue } });
  };

  const handleSelectClickElement = (element: any) => {
    setSelectValue(element);
    onChange({ target: { name: name, value: element } });
    closeOptions();
  };

  const handleSelectMultiClickElement = (element: any) => {
    const selectedValues = Array.isArray(selectValue) ? [...selectValue] : [];
    const index = selectedValues.indexOf(element);
    if (index !== -1) {
      selectedValues.splice(index, 1);
    } else {
      selectedValues.push(element);
    }
    setSelectValue(selectedValues);
    onChange({ target: { name: name, value: selectedValues } });
  };

  const handleSelectClickIcon = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenOptions((old: boolean) => !old);
  };

  const normalizeText = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  const filteredOptions = safeOptions.filter((option: any) => {
    if (option?.isGroupLabel) return true;
    const label = option[optionLabel] || option.label || "";
    return normalizeText(String(label)).includes(normalizeText(search));
  });

  // const filteredOptions = () =>
  //   search
  //     ? buscarCoincidencias(options, search, optionLabel || "label", {
  //         umbralSimilitud: 0.5,
  //       })
  //     : options;

  return (
    <div
      ref={selectRef}
      className={[
        styles.select,
        className,
        openOptions ? styles.isOpen : "",
        disabled || readOnly ? styles.isDisabled : "",
        fieldError ? styles.hasError : "",
        isAutoWidth ? styles.autoWidth : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <button
        type="button"
        onClick={disabled || readOnly ? undefined : handleSelectClickIcon}
        className={[
          styles.selectTrigger,
          !label ? styles.noLabel : "",
          hasValue ? styles.isFilled : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={triggerStyle}
        disabled={disabled}
        aria-expanded={openOptions}
        aria-haspopup="listbox"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <div className={styles.triggerBody}>
          {label && <span className={styles.triggerLabel}>{label}</span>}
          <span
            className={[
              styles.triggerValue,
              !hasValue ? styles.placeholderValue : "",
            ]
              .filter(Boolean)
              .join(" ")}
            title={triggerText}
          >
            {triggerText}
          </span>
        </div>
        <IconArrowDown
          size={18}
          className={[
            styles.chevron,
            openOptions ? styles.chevronOpen : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </button>
      {fieldError ? <p className={styles.errorText}>{fieldError}</p> : null}
      {openOptions &&
        createPortal(
          <Section
            selectRef1={selectRef1}
            position={position}
            selectOptionsClassName={selectOptionsClassName}
            filter={filter}
            filterStyle={filterStyle}
            name={name}
            _options={filteredOptions}
            search={search}
            onChangeSearch={(e: any) => setSearch(e.target.value)}
            multiSelect={multiSelect}
            selectValue={selectValue}
            optionValue={optionValue}
            optionLabel={optionLabel}
            handleSelectClickElement={handleSelectClickElement}
            handleSelectMultiClickElement={handleSelectMultiClickElement}
            onClose={closeOptions}
            selectRef={selectRef}
            ignoreOptionsTranslation={ignoreOptionsTranslation}
          />,
          document.getElementById("portal-root") as any,
        )}
    </div>
  );
};

export default Select;
