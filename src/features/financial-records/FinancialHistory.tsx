"use client";

import { AlertCircle, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
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
      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        <Clock3 className="mr-2 size-4 animate-pulse" />
        Cargando historial…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      >
        <AlertCircle className="mb-2 size-5" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <div className="flex gap-2 rounded-xl border border-border bg-muted/45 px-3 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{notice}</span>
        </div>
      ) : null}

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay acciones registradas.
        </div>
      ) : (
        <ol className="relative space-y-0 before:absolute before:top-4 before:bottom-4 before:left-[15px] before:w-px before:bg-border">
          {events.map((event) => {
            const changes = flattenChanges(event);
            const repaired = event.action === "payment_state_repaired";
            return (
              <li key={event.id} className="relative grid grid-cols-[32px_1fr] gap-3 pb-5 last:pb-0">
                <span
                  className={cn(
                    "relative z-10 flex size-8 items-center justify-center rounded-full border bg-card",
                    repaired ? "border-primary/60 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {repaired ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}
                </span>
                <div className="min-w-0 rounded-xl border border-border bg-card/75 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {ACTION_LABELS[event.action] || event.action.replaceAll("_", " ")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {event.actor?.name || "Sistema"}
                      </p>
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(event.occurred_at)}
                    </time>
                  </div>

                  {event.reason ? (
                    <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-foreground/85">
                      <span className="font-medium text-muted-foreground">Motivo: </span>
                      {event.reason}
                    </p>
                  ) : null}

                  {changes.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {changes.map((change) => (
                        <div
                          key={change.field}
                          className="grid gap-1 text-xs sm:grid-cols-[132px_1fr]"
                        >
                          <span className="capitalize text-muted-foreground">{change.label}</span>
                          <span className="min-w-0 break-words text-foreground/85">
                            <span className="line-through opacity-60">{change.before}</span>
                            <span className="mx-1.5 text-muted-foreground">→</span>
                            <span className="font-medium text-foreground">{change.after}</span>
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
