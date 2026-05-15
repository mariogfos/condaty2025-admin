"use client";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PropsTypeInputBase } from "../ControlLabel";
import idioma from "@/mk/utils/traductor/es";
import Tooltip from "../../ui/Tooltip/Tooltip";
import styles from "./dataSearch.module.css";

interface PropsType extends PropsTypeInputBase {
  setSearch: Function;
  textButton?: string;
  searchMsg?: string;
}

const DataSearch = ({
  setSearch,
  name,
  value,
  label = "",
  placeholder = "",
  textButton = idioma.search,
  className = "",
  searchMsg = "",
  disabled = false,
  readOnly = false,
  style = {},
  onBlur = () => {},
}: PropsType) => {
  const normalizedValue = value == null ? "" : String(value);
  const [searchBy, setSearchBy] = useState(normalizedValue);
  const [oldSearch, setOldSearch] = useState(normalizedValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSearchBy(normalizedValue);
    setOldSearch(normalizedValue);
  }, [normalizedValue]);

  const submitSearch = (nextValue?: string) => {
    const resolvedValue = (nextValue ?? searchBy).trim();

    if (resolvedValue === oldSearch) return;

    setSearchBy(resolvedValue);
    setOldSearch(resolvedValue);
    setSearch(resolvedValue);
  };

  const clearSearch = () => {
    setSearchBy("");
    if (oldSearch === "") return;
    setOldSearch("");
    setSearch("");
  };

  const disabledState = disabled || readOnly;
  const hasValue = searchBy.trim().length > 0;
  const placeholderText = useMemo(
    () => placeholder || `${textButton}...`,
    [placeholder, textButton],
  );
  const focusInput = () => {
    if (disabledState) return;

    inputRef.current?.focus();

    const cursorAt = inputRef.current?.value.length ?? 0;
    inputRef.current?.setSelectionRange(cursorAt, cursorAt);
  };

  const field = (
    <div
      className={[
        styles.searchField,
        className,
        disabledState ? styles.isDisabled : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onClick={(event) => {
        const target = event.target as HTMLElement | null;
        if (
          !target ||
          target.closest("button") ||
          target.tagName === "INPUT" ||
          target.closest("input")
        ) {
          return;
        }

        focusInput();
      }}
    >
      <div className={styles.searchBody}>
        {label ? <span className={styles.searchLabel}>{label}</span> : null}
        <input
          ref={inputRef}
          name={name}
          type="search"
          value={searchBy}
          disabled={disabledState}
          readOnly={readOnly}
          placeholder={placeholderText}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setSearchBy(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch();
            }

            if (event.key === "Escape" && hasValue) {
              event.preventDefault();
              clearSearch();
            }
          }}
          onBlur={(event) => onBlur?.(event)}
        />
      </div>

      {hasValue ? (
        <button
          type="button"
          className={styles.clearButton}
          onClick={clearSearch}
          aria-label="Limpiar búsqueda"
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      ) : null}

      <button
        type="button"
        className={[
          styles.submitButton,
          hasValue ? styles.submitButtonActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => submitSearch()}
        disabled={disabledState}
        aria-label="Buscar"
      >
        <Search size={16} strokeWidth={1.3} />
      </button>
    </div>
  );

  return (
    <div className={styles.searchRoot}>
      {searchMsg ? (
        <Tooltip
          title={searchMsg}
          position="top-left"
          singleLine={false}
          maxWidth={360}
          className={styles.tooltipAnchor}
        >
          {field}
        </Tooltip>
      ) : (
        field
      )}
    </div>
  );
};

export default DataSearch;
