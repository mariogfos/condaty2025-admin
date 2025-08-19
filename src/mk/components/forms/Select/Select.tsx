"use client";
import {
  IconArrowDown,
  IconCheckOff,
  IconCheckSquare,
} from "@/components/layout/icons/IconsBiblioteca";
import { CSSProperties, useEffect, useRef, useState } from "react";
import Input from "../Input/Input";
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
  inputStyle?: any;
  selectOptionsClassName?: string;
  style?: CSSProperties;
}

const Section = ({
  selectRef1,
  position,
  selectOptionsClassName,
  filter,
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
  setOpenOptions,
  selectRef,
}: any) => {
  useOnClickOutside(
    selectRef1,
    () => {
      onChangeSearch({ target: { value: "" } });
      setOpenOptions(false);
    },
    selectRef
  );

  return (
    <section
      ref={selectRef1}
      className={`${styles.selectOptions} ${selectOptionsClassName}`}
      style={{
        top: `${position?.top || 0}px`,
        left: `${position?.left || 0}px`,
        width: `${position?.width || 0}px`,
      }}
    >
      <div className={filter ? "" : "hidden"}>
        <Input
          type="text"
          value={search}
          onChange={onChangeSearch}
          name={`search${name}`}
          placeholder={"Buscar..."}
          error={false}
        />
      </div>
      <ul>
        {_options.map
          ? _options.map((option: any, key: any) => (
              <li
                className={
                  Array.isArray(selectValue)
                    ? selectValue.includes(option[optionValue])
                      ? styles["selected"]
                      : ""
                    : selectValue === option[optionValue]
                    ? styles["selected"]
                    : ""
                }
                key={`li${name}${option[optionValue] || key}`}
                onClick={
                  !multiSelect
                    ? (e) => {
                        handleSelectClickElement(option[optionValue] || key);
                        e.stopPropagation();
                      }
                    : (e) => {
                        handleSelectMultiClickElement(
                          option[optionValue] || key
                        );
                        e.stopPropagation();
                      }
                }
              >
                <div style={{ alignItems: "center", gap: "8px" }}>
                  {option["img"] && (
                    <Avatar
                      hasImage={option.has_image}
                      className={styles.avatar}
                      name={option[optionLabel] ?? option.label}
                      src={option["img"]}
                      h={32}
                      w={32}
                    />
                  )}
                  {multiSelect ? (
                    Array.isArray(selectValue) &&
                    selectValue.includes(option[optionValue]) ? (
                      <IconCheckSquare size={18} />
                    ) : (
                      <IconCheckOff size={18} />
                    )
                  ) : null}
                  <div style={{ flexGrow: 1, flexBasis: 0 }}>
                    {option[optionLabel] || option.label}
                  </div>
                </div>
              </li>
            ))
          : Object.keys(_options).map((key) => (
              <li
                key={`li${name}${key}`}
                onClick={() =>
                  handleSelectClickElement(
                    _options[key][optionValue] || _options[key].label
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
  style = {},
  onBlur = () => {},
  onChange = (e: any) => {},
}: PropsType) => {
  const [selectValue, setSelectValue] = useState(
    value || (multiSelect ? [] : "")
  );
  const [openOptions, setOpenOptions] = useState(false);
  const [search, setSearch] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);
  const [selectedNames, setSelectedNames]: any = useState("");
  const [position, setPosition]: any = useState(null);
  const selectRef1 = useRef<HTMLDivElement>(null);

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
        Array.isArray(options) &&
        options.length > 0 &&
        currentSelectedValues.length > 0
      ) {
        const selectedFullOptions = options.filter((option: any) =>
          currentSelectedValues.includes(option[optionValue])
        );

        let displayString = "";
        const count = selectedFullOptions.length;

        if (count > 10) {
          displayString = `${count} elementos seleccionados`;
        } else {
          const namesArray = selectedFullOptions.map(
            (option: any) => {
              // Si el objeto tiene campo nro y estamos en multiSelect, mostrar solo el número
              if (multiSelect && option.nro) {
                return String(option.nro);
              }
              return option[optionLabel] || option.label || String(option[optionValue]);
            }
          );
          displayString = namesArray.join(", ");
        }
        setSelectedNames(displayString);
      } else {
        setSelectedNames("");
      }
    }
  }, [selectValue, options, multiSelect, optionLabel, optionValue]);

  useEffect(() => {
    const parentWithClass = findParentWithClass(
      selectRef.current,
      "contScrollable"
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

    let up = 34;
    if (childPosition) {
      if (parent.top + 34 + childPosition.height > window.innerHeight) {
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

  if (!options) return null;

  let valueText: any = "";
  if (readOnly) {
    if (options.filter) {
      valueText = options.filter((o: any) => o[optionValue] === value)[0];
      if (valueText) {
        valueText = valueText[optionLabel];
      }
    } else {
      valueText = options[value]?.label || "";
    }
  }

  const handleSelectClickElement = (element: any) => {
    setSelectValue(element);
    setOpenOptions(false);
    onChange({ target: { name: name, value: element } });
    setSearch("");
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

  const filteredOptions = options.filter((option: any) => {
    const label = option[optionLabel] || option.label || "";
    return normalizeText(String(label)).includes(normalizeText(search));
  });

  return (
    <div
      ref={selectRef}
      className={`${styles.select} ${className}`}
      style={style}
    >
      <div onClick={disabled ? () => {} : handleSelectClickIcon}>
        <Input
          type={"text"}
          value={
            multiSelect
              ? selectedNames
              : options.find
              ? options.find((i: any) => i[optionValue] == value)
                ? options.find((i: any) => i[optionValue] == value)[optionLabel]
                : ""
              : options[value]?.label
          }
          onChange={onChange}
          readOnly={true}
          label={label}
          name={name}
          iconRight={<IconArrowDown className={openOptions ? "rotate" : ""} />}
          placeholder={placeholder}
          required={required}
          onBlur={onBlur}
          disabled={disabled}
          error={error ?? undefined}
          style={{ ...inputStyle, cursor: "pointer" }}
          styleInput={{ cursor: "pointer" }}
        />
      </div>
      {openOptions &&
        createPortal(
          <Section
            selectRef1={selectRef1}
            position={position}
            selectOptionsClassName={selectOptionsClassName}
            filter={filter}
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
            setOpenOptions={setOpenOptions}
            selectRef={selectRef}
          />,
          document.getElementById("portal-root") as any
        )}
    </div>
  );
};

export default Select;
