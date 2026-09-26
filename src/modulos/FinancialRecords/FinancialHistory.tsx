"use client";

import { AlertCircle, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { DEBT_STATUS_TEXT, DebtStatus } from "@/types/PaymentType";
import styles from "./FinancialDetail.module.css";
import type { FinancialAuditEvent } from "./types";

/**
 * 🔴 Dos formatos de `action` en el mismo historial:
 *
 * - los eventos de AUDITORÍA traen el NOMBRE del enum `FinancialAuditAction`
 *   del API, en mayúscula (`PENALTY_UPDATED`);
 * - los de LÍNEA BASE los arma el API desde el registro, en minúscula
 *   (`debt_created`).
 *
 * Una clave en el formato equivocado no da error: el título cae al texto crudo.
 */
const ACTION_LABELS: Record<string, string> = {
  debt_created: "Deuda creada",
  payment_created: "Ingreso registrado",
  expense_created: "Egreso registrado",
  payment_confirmed: "Pago confirmado",
  payment_rejected: "Pago rechazado",
  payment_cancelled: "Ingreso anulado",
  expense_cancelled: "Egreso anulado",
  DEBT_AMOUNT_UPDATED: "Monto de deuda editado",
  PAYMENT_AMOUNT_UPDATED: "Monto de ingreso editado",
  PENALTY_UPDATED: "Multa editada",
  // ⚠️ Existen en el enum del API pero en `dev` nada los escribe.
  PAYMENT_STATE_CHECKED: "Estado del pago verificado",
  PAYMENT_STATE_REPAIRED: "Estado del pago reparado",
  PAYMENT_DATE_UPDATED: "Fecha de pago editada",
};

const FIELD_LABELS: Record<string, string> = {
  amount: "Monto",
  allocated_amount: "Monto aplicado",
  penalty_amount: "Multa",
  paid_at: "Fecha de pago",
  status: "Estado",
  payment_id: "Pago vinculado",
  remaining_amount: "Saldo principal",
  total_remaining_amount: "Saldo total",
  is_partial: "Pago parcial",
};

/**
 * El API guarda el estado de la deuda por su NOMBRE (`"OVERDUE"`), no por el
 * número: en la bitácora un 2 sería ambiguo entre deuda y pago. Si no es un
 * nombre de `DebtStatus`, se muestra crudo.
 */
const debtStatusLabel = (value: unknown) =>
  DEBT_STATUS_TEXT[DebtStatus[String(value) as keyof typeof DebtStatus]] ||
  String(value);

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
  if (value === null || value === undefined || value === "") return "Sin dato";
  if (field === "status") return debtStatusLabel(value);
  if (field.includes("amount")) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
        minimumFractionDigits: 2,
      }).format(number);
    }
  }
  if (field.endsWith("_at")) {
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

/**
 * Los snapshots del API son planos (`{ amount, penalty_amount, status, … }`).
 * El historial de producción los aplanaba porque su reparación de estado
 * escribía deuda, deuda general y reserva anidadas; en `dev` esa acción se
 * descartó y nada escribe snapshots anidados.
 */
const fieldLabel = (field: string) => FIELD_LABELS[field] || field.replaceAll("_", " ");

const flattenChanges = (event: FinancialAuditEvent) => {
  const before: Record<string, unknown> = event.before || {};
  const after: Record<string, unknown> = event.after || {};
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
            const repaired = event.action === "PAYMENT_STATE_REPAIRED";
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
