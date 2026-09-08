"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import styles from "./FinancialDetail.module.css";

export type FinancialDetailField = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  wide?: boolean;
  tone?: "default" | "success" | "warning" | "danger";
};

export const FinancialDetailSection = ({
  title,
  description,
  children,
  className = "",
  defaultOpen = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isCollapsible = Boolean(title || description);

  return (
    <section className={`${styles.detailSection} ${className}`.trim()}>
      {isCollapsible ? (
        <button
          type="button"
          className={styles.sectionToggle}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span>
            {title ? <span className={styles.sectionTitle}>{title}</span> : null}
            {description ? (
              <span className={styles.sectionDescription}>{description}</span>
            ) : null}
          </span>
          <ChevronDown
            className={`${styles.sectionChevron} ${
              isOpen ? styles.sectionChevronOpen : ""
            }`.trim()}
            size={20}
            aria-hidden="true"
          />
        </button>
      ) : null}
      {!isCollapsible || isOpen ? (
        <div className={styles.sectionBody}>{children}</div>
      ) : null}
    </section>
  );
};

export const FinancialDetailGrid = ({ fields }: { fields: FinancialDetailField[] }) => (
  <div className={styles.detailGrid}>
    {fields.map((field) => {
      const toneClass =
        field.tone === "success"
          ? styles.fieldSuccess
          : field.tone === "warning"
            ? styles.fieldWarning
            : field.tone === "danger"
              ? styles.fieldDanger
              : "";

      return (
        <div
          key={field.id}
          className={`${styles.detailField} ${field.wide ? styles.fieldWide : ""}`.trim()}
        >
          <div className={styles.fieldLabel}>{field.label}</div>
          <div className={`${styles.fieldValue} ${toneClass}`.trim()}>
            {field.value ?? "-/-"}
          </div>
        </div>
      );
    })}
  </div>
);

export const FinancialDetailMessage = ({ children }: { children: ReactNode }) => (
  <p className={styles.message}>{children}</p>
);
