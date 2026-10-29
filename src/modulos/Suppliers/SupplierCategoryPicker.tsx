"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Plus } from "lucide-react";
import ControlLabel from "@/mk/components/forms/ControlLabel";
import inputStyles from "@/mk/components/forms/Input/input.module.css";
import styles from "./Suppliers.module.css";

export const categoryKey = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

type Category = { id: string; name: string };

type Props = {
  value: string;
  options: Category[];
  error?: any;
  creating: boolean;
  onChange: (value: string) => void;
  onCreate: (name: string) => Promise<boolean>;
};

export default function SupplierCategoryPicker({
  value, options, error, creating, onChange, onCreate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const query = categoryKey(value);
  const matches = options.filter(({ name }) => categoryKey(name).includes(query));
  const canCreate = Boolean(query) && !options.some(({ name }) => categoryKey(name) === query);
  const optionCount = matches.length + Number(canCreate);

  const choose = (index: number) => {
    if (creating) return;
    if (index < matches.length) {
      onChange(matches[index].name);
      setOpen(false);
    } else if (canCreate) {
      void onCreate(value.trim().replace(/\s+/g, " ")).then((created) => {
        if (created) setOpen(false);
      });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(event.key === "ArrowDown" ? 0 : Math.max(optionCount - 1, 0));
        return;
      }
      setOpen(true);
      setActiveIndex((current) =>
        optionCount === 0 ? 0 : (current + (event.key === "ArrowDown" ? 1 : -1) + optionCount) % optionCount,
      );
    }
    if (event.key === "Enter" && open && optionCount > 0) {
      event.preventDefault();
      choose(Math.min(activeIndex, optionCount - 1));
    }
  };

  return (
    <div className={styles.categoryPicker} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <ControlLabel
        name="service_category"
        label="Rubro o servicio"
        value={value}
        error={error}
        required={false}
        className={inputStyles.input}
        iconRight={<ChevronDown size={17} />}
        onContainerClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          id="service_category"
          name="service_category"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && optionCount > 0 ? `${listId}-${Math.min(activeIndex, optionCount - 1)}` : undefined}
          autoComplete="off"
          maxLength={100}
          placeholder="Busca o crea un rubro"
          value={value}
          disabled={creating}
          onFocus={() => { setOpen(true); setActiveIndex(0); }}
          onClick={() => setOpen(true)}
          onChange={(event) => { onChange(event.target.value); setActiveIndex(0); setOpen(true); }}
          onKeyDown={onKeyDown}
        />
      </ControlLabel>
      {open ? (
        <div id={listId} role="listbox" aria-label="Rubros disponibles" className={styles.categoryMenu}>
          {matches.map(({ id, name }, index) => (
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              id={`${listId}-${index}`}
              key={id}
              className={styles.categoryOption}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              {name}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              role="option"
              aria-selected={matches.length === activeIndex}
              id={`${listId}-${matches.length}`}
              className={`${styles.categoryOption} ${styles.createCategory}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(matches.length)}
            >
              <Plus size={16} /> {creating ? "Creando rubro…" : `Crear “${value.trim().replace(/\s+/g, " ")}”`}
            </button>
          ) : null}
          {!optionCount ? <p className={styles.categoryEmpty}>Escribe para crear un nuevo rubro.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
