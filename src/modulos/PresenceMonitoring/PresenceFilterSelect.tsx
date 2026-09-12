"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import styles from "./PresenceMonitoring.module.css";

export type PresenceFilterTone =
  | "neutral"
  | "admin"
  | "resident"
  | "guard"
  | "active"
  | "recent"
  | "offline";

export type PresenceFilterOption<T extends string> = {
  value: T;
  label: string;
  description: string;
  tone: PresenceFilterTone;
};

type Props<T extends string> = {
  label: string;
  value: T;
  options: PresenceFilterOption<T>[];
  align?: "start" | "end";
  onChange: (value: T) => void;
};

const toneClass = (tone: PresenceFilterTone) => {
  const classes: Record<PresenceFilterTone, string> = {
    neutral: styles.filterToneNeutral,
    admin: styles.filterToneAdmin,
    resident: styles.filterToneResident,
    guard: styles.filterToneGuard,
    active: styles.filterToneActive,
    recent: styles.filterToneRecent,
    offline: styles.filterToneOffline,
  };

  return classes[tone];
};

export default function PresenceFilterSelect<T extends string>({
  label,
  value,
  options,
  align = "start",
  onChange,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dialogId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    optionRefs.current[selectedIndex]?.focus();

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [open, selectedIndex]);

  const closeAndRestoreFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveOptionFocus = (index: number, direction: 1 | -1) => {
    const nextIndex = (index + direction + options.length) % options.length;
    optionRefs.current[nextIndex]?.focus();
  };

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveOptionFocus(index, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveOptionFocus(index, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      optionRefs.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      optionRefs.current[options.length - 1]?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className={styles.filterControl}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          closeAndRestoreFocus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.filterTrigger}
        aria-label={`${label}: ${selectedOption.label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span
          className={`${styles.filterIndicator} ${toneClass(selectedOption.tone)}`}
          aria-hidden="true"
        />
        <span className={styles.filterTriggerText}>
          <span>{label}</span>
          <strong>{selectedOption.label}</strong>
        </span>
        <ChevronDown
          className={open ? styles.filterChevronOpen : styles.filterChevron}
          size={16}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <section
          id={dialogId}
          className={`${styles.filterPopover} ${
            align === "end" ? styles.filterPopoverEnd : ""
          }`.trim()}
          role="dialog"
          aria-label={`Filtrar por ${label.toLowerCase()}`}
        >
          <header className={styles.filterPopoverHeader}>
            <span>Filtrar por</span>
            <strong>{label}</strong>
          </header>
          <div className={styles.filterOptions}>
            {options.map((option, index) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  className={`${styles.filterOption} ${
                    selected ? styles.filterOptionSelected : ""
                  }`.trim()}
                  aria-label={`${option.label}: ${option.description}`}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(option.value);
                    closeAndRestoreFocus();
                  }}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                >
                  <span
                    className={`${styles.filterIndicator} ${toneClass(option.tone)}`}
                    aria-hidden="true"
                  />
                  <span className={styles.filterOptionText}>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                  {selected ? <Check size={15} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
