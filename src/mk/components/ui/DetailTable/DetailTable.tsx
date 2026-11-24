"use client";

import type { Key, ReactNode } from "react";
import styles from "./detailTable.module.css";

export type DetailTableColumn<Row> = {
  key: string;
  label: string;
  align?: "start" | "center" | "end";
  onRender?: (context: { item: Row }) => ReactNode;
};

type Props<Row> = {
  label: string;
  columns: DetailTableColumn<Row>[];
  data: Row[];
  rowKey?: (row: Row, index: number) => Key;
  onRowClick?: (row: Row) => void;
  rowLabel?: (row: Row) => string;
  emptyMessage?: string;
};

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(target.closest("a, button, input, select, textarea, [role='button']"));

export default function DetailTable<Row extends object>({
  label,
  columns,
  data,
  rowKey,
  onRowClick,
  rowLabel,
  emptyMessage = "No hay registros para mostrar.",
}: Props<Row>) {
  return (
    <div className={styles.frame}>
      <div className={styles.scroller}>
        <table className={styles.table} aria-label={label}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={styles[column.align || "start"]}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const values = row as Record<string, ReactNode>;
              const key = rowKey?.(row, index) ?? (row as { id?: Key }).id ?? index;
              return (
                <tr
                  key={key}
                  className={onRowClick ? styles.clickableRow : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={rowLabel?.(row)}
                  onClick={onRowClick ? (event) => {
                    if (!isInteractiveTarget(event.target)) onRowClick(row);
                  } : undefined}
                  onKeyDown={onRowClick ? (event) => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  } : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={styles[column.align || "start"]}>
                      <span className={styles.mobileLabel} aria-hidden="true">{column.label}</span>
                      <div className={styles.cellContent}>
                        {column.onRender ? column.onRender({ item: row }) : values[column.key] ?? "—"}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr><td className={styles.empty} colSpan={columns.length}>{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
