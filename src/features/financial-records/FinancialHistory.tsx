"use client";

import { AlertCircle, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import styles from "./FinancialDetail.module.css";
import type { FinancialAuditEvent } from "./types";

const ACTION_LABELS: Record<string, string> = {
  debt_created: "Deuda creada",
  payment_created: "Ingreso registrado",
  expense_created: "Egreso registrado",
  payment_confirmed: "Pago confirmado",
  payment_rejected: "Pago rechazado",
  payment_cancelled: "Ingreso anulado",
  expense_cancelled: "Egreso anulado",
  penalty_updated: "Multa editada",
  payment_state_checked: "Estado del pago verificado",
  payment_state_repaired: "Estado del pago reparado",
  payment_date_updated: "Fecha de pago editada",
};

const FIELD_LABELS: Record<string, string> = {
  penalty_amount: "Multa",
  paid_at: "Fecha de pago",
  status: "Estado",
  payment_id: "Pago vinculado",
  remaining_amount: "Saldo principal",
  total_remaining_amount: "Saldo total",
  is_partial: "Pago parcial",
};

const RECORD_LABELS: Record<string, string> = {
  debt: "Deuda",
  parent_debt: "Deuda general",
  reservation: "Reserva",
};

const STATUS_LABELS: Record<string, string> = {
  A: "Por cobrar",
  M: "En mora",
  I: "Pago parcial",
  S: "Por confirmar",
  P: "Pagado",
  R: "Rechazado",
  X: "Anulado",
  F: "Condonado",
  W: "Pendiente de aprobación",
  L: "Reserva pagada",
  Q: "Reserva por confirmar",
};

const formatDate = (value?: string) => {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatValue = (field: string, value: unknown) => {
  const leafField = field.split(".").at(-1) || field;
  if (value === null || value === undefined || value === "") return "Sin dato";
  if (leafField === "status") return STATUS_LABELS[String(value)] || String(value);
  if (leafField.includes("amount")) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
        minimumFractionDigits: 2,
      }).format(number);
    }
  }
  if (leafField.endsWith("_at")) {
    const normalized = String(value).replace(
      /^(\d{4}-\d{2}-\d{2})\s/,
      "$1T",
    );
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" }).format(date);
    }
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") return "Estado relacionado actualizado";
  return String(value);
};

const flattenState = (
  state: Record<string, unknown>,
  prefix = "",
): Record<string, unknown> =>
  Object.entries(state).reduce<Record<string, unknown>>((result, [field, value]) => {
    const path = prefix ? `${prefix}.${field}` : field;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenState(value as Record<string, unknown>, path));
    } else {
      result[path] = value;
    }
    return result;
  }, {});

const fieldLabel = (field: string) => {
  const parts = field.split(".");
  const leafField = parts.at(-1) || field;
  const label = FIELD_LABELS[leafField] || leafField.replaceAll("_", " ");
  const recordLabel = parts.length > 1 ? RECORD_LABELS[parts[0]] : null;
  return recordLabel ? `${recordLabel}: ${label}` : label;
};

const flattenChanges = (event: FinancialAuditEvent) => {
  const before = flattenState(event.before || {});
  const after = flattenState(event.after || {});
  return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .slice(0, 5)
    .map((field) => ({
      field,
      label: fieldLabel(field),
      before: formatValue(field, before[field]),
      after: formatValue(field, after[field]),
    }));
};

type Props = {
  events: FinancialAuditEvent[];
  loading?: boolean;
  error?: string;
  notice?: string;
};

export const FinancialHistory = ({ events, loading, error, notice }: Props) => {
  if (loading) {
    return (
      <div className={`${styles.historyState} ${styles.history}`}>
        <Clock3 className={styles.spinner} size={20} aria-hidden="true" />
        Cargando historial…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className={`${styles.historyState} ${styles.historyError} ${styles.history}`}
      >
        <AlertCircle size={20} aria-hidden="true" />
        {error}
      </div>
    );
  }

  return (
    <div className={styles.history}>
      {notice ? (
        <div className={styles.historyNotice}>
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{notice}</span>
        </div>
      ) : null}

      {events.length === 0 ? (
        <div className={styles.historyState}>
          Todavía no hay acciones registradas.
        </div>
      ) : (
        <ol className={styles.historyList}>
          {events.map((event) => {
            const changes = flattenChanges(event);
            const repaired = event.action === "payment_state_repaired";
            return (
              <li key={event.id} className={styles.historyItem}>
                <span
                  className={`${styles.historyMarker} ${
                    repaired ? styles.historyMarkerSuccess : ""
                  }`.trim()}
                >
                  {repaired ? (
                    <CheckCircle2 size={18} aria-hidden="true" />
                  ) : (
                    <Clock3 size={18} aria-hidden="true" />
                  )}
                </span>
                <div className={styles.historyBody}>
                  <div className={styles.historyHeader}>
                    <div>
                      <h3 className={styles.historyTitle}>
                        {ACTION_LABELS[event.action] || event.action.replaceAll("_", " ")}
                      </h3>
                      <p className={styles.historyActor}>
                        {event.actor?.name || "Sistema"}
                      </p>
                    </div>
                    <time className={styles.historyTime}>
                      {formatDate(event.occurred_at)}
                    </time>
                  </div>

                  {event.reason ? (
                    <p className={styles.historyReason}>
                      <span className={styles.historyReasonLabel}>Motivo: </span>
                      {event.reason}
                    </p>
                  ) : null}

                  {changes.length > 0 ? (
                    <div className={styles.changes}>
                      {changes.map((change) => (
                        <div key={change.field} className={styles.changeRow}>
                          <span className={styles.changeLabel}>{change.label}</span>
                          <span className={styles.changeValue}>
                            <span className={styles.changeBefore}>{change.before}</span>
                            <span className={styles.changeArrow}>→</span>
                            <span className={styles.changeAfter}>{change.after}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
