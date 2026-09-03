import type { ReactNode } from "react";
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
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={`${styles.detailSection} ${className}`.trim()}>
    {title || description ? (
      <header className={styles.sectionHeader}>
        <div>
          {title ? <h3 className={styles.sectionTitle}>{title}</h3> : null}
          {description ? (
            <p className={styles.sectionDescription}>{description}</p>
          ) : null}
        </div>
      </header>
    ) : null}
    <div className={styles.sectionBody}>{children}</div>
  </section>
);

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
