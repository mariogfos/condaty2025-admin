/* eslint-disable react-hooks/exhaustive-deps */
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
  required = false,
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
  const selectRef = useRef<HTMLDivElement>(null);
  const [selectedNames, setSelectedNames]: any = useState([]);
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

  const [_options, setOptions]: any = useState([]);

  useEffect(() => {
    if (options) setOptions(options || []);
    if (multiSelect) {
      if (
        Array.isArray(options) &&
        options.length > 0 &&
        Array.isArray(selectValue)
      ) {
        const selectedValues = options.filter((option: any) =>
          selectValue.includes(option.id)
        );
        let selectedDisplay = "";
        if (selectedValues.length > 2) {
          selectedDisplay = selectedValues.length + " elementos seleccionados";
        } else {
          const selectedNames = selectedValues.map(
            (option: any) => option.name || option.label
          );
          selectedDisplay = selectedNames.join(", ");
        }
        setSelectedNames(selectedDisplay);
      }
    }
  }, [selectValue, options]);

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
      // handleSelectPosition();
      calcPosition();
    }
  }, [openOptions]);

  useEffect(() => {
    if (!multiSelect) {
      if (selectValue !== value) {
        let valueText = options?.filter(
          (o: any) => o[optionValue] === value
        )[0];
        if (valueText) {
          valueText = valueText[optionLabel];
        }
        setSelectValue(valueText);
      }
    }
  }, [value, selectValue]);

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
    setOpenOptions((old: boolean) => !old);
  };

  // const handleSelectPosition = () => {
  //   // const select = selectRef.current;
  //   // if (select) {
  //   //   const top = select.getBoundingClientRect().top;
  //   //   const bottom = window.innerHeight - select.getBoundingClientRect().bottom;
  //   //   return top > bottom ? "bottom-full" : "top-full";
  //   // }
  //   // return "";
  // };

  const Section = () => {
    const [search, setSearch] = useState("");
    const [_options, setFilterOptions]: any = useState(options);
    const normalizeText = (text: string) =>
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

    const onChangeSearch = (e: any) => {
      const searchValue = normalizeText(e.target.value);
      setSearch(e.target.value);

      const filteredOptions = options.filter((option: any) =>
        normalizeText(option[optionLabel]).includes(searchValue)
      );

      setFilterOptions(filteredOptions);
    };

    useOnClickOutside(
      selectRef1,
      (e: any) => {
        setOpenOptions(false);
      },
      selectRef as any
    );
    return (
      <section
        ref={selectRef1}
        className={styles.selectOptions + " " + selectOptionsClassName}
        style={{
          top: (position?.top || 0) + "px",
          left: (position?.left || 0) + "px",
          width: (position?.width || 0) + "px",
        }}
      >
        <div className={filter ? "" : "hidden"}>
          <Input
            type="text"
            value={search}
            onChange={onChangeSearch}
            name={"search" + name}
            placeholder={"Buscar..."}
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
                  key={"li" + name + (option[optionValue] || key)}
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
                        className={styles.avatar}
                        name={option[optionLabel] || option.label}
                        src={option["img"]}
                        h={32}
                        w={32}
                      />
                    )}
                    {option[optionLabel] || option.label}
                    {multiSelect ? (
                      Array.isArray(selectValue) &&
                      selectValue.includes(option[optionValue]) ? (
                        <IconCheckSquare size={18} />
                      ) : (
                        <IconCheckOff size={18} />
                      )
                    ) : null}
                  </div>
                </li>
              ))
            : Object.keys(_options).map((key) => (
                <li
                  key={"li" + name + key}
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
  return (
    <div
      ref={selectRef}
      className={styles.select + " " + className}
      style={style}
    >
      <div onClick={disabled ? () => {} : handleSelectClickIcon}>
        <Input
          type={"text"}
          value={
            multiSelect
              ? selectedNames
              : options.find
              ? options.find((i: any) => {
                  return i[optionValue] == value;
                })
                ? options.find((i: any) => {
                    return i[optionValue] == value;
                  })[optionLabel]
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
          error={error}
          style={inputStyle}
        />
      </div>
      {openOptions &&
        createPortal(
          <Section />,
          document.getElementById("portal-root") as any
        )}
    </div>
  );
};

export default Select;
