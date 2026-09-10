import React from "react";
import { BankAccountStatus } from "../BankAccounts/Type/BankType";
import { QR_STATE_COLOR, QR_STATE_LABEL, QrOrderState } from "./types";

/** Badge de estado de un QR — compartido por deuda, ingreso e historial. */
export const StateBadge = ({ state }: { state: QrOrderState }) => {
  const cfg = QR_STATE_COLOR[state];

  // ⚠️ Un estado que este front todavía no conoce se dibuja crudo, no vacío.
  // El backend puede sumar casos antes de que el admin se despliegue, y una
  // celda en blanco se lee como «esta orden no tiene estado».
  if (!cfg) return <span>{String(state)}</span>;

  return (
    <span
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {QR_STATE_LABEL[state] ?? state}
    </span>
  );
};

/**
 * El mensaje mostrable de una respuesta de `useAxios`.
 *
 * 🔴 En 2xx viene en `data.message`. En 403, 404 y 422 **axios lanza**, y
 * `useAxios` devuelve `data: null` con el cuerpo del backend en `error.data`.
 * Leer sólo `data.message` deja al usuario con la pantalla en blanco y sin
 * saber qué pasó, justo en los casos que hay que explicar.
 */
export const apiMessage = (res: any): string | null =>
  res?.data?.message || res?.error?.data?.message || null;

export type QrAccountState = "active" | "incomplete" | "disabled";

/**
 * El estado del QR dinámico de una cuenta, derivado de la fila del listado.
 *
 * Las columnas `qr_dynamic_*` que no son secretas viajan con cada fila, y el
 * API agrega `qr_dynamic_has_credentials` —un booleano, nunca la credencial—
 * para que el front distinga una cuenta configurada de una vacía.
 *
 * 🔴 **«Incompleta» no es un detalle cosmético.** Es una cuenta que se ve
 * encendida y no puede cobrar: el residente pide su QR y recibe un error del
 * proveedor. Sin este estado, esa cuenta se pinta igual que una lista para
 * cobrar y el problema aparece recién el día del primer pago.
 */
export const qrAccountState = (account: any): QrAccountState => {
  // ⚠️ `qr_dynamic_status`, no un booleano `qr_dynamic_enabled`: en este repo
  // el estado es el enum numérico de `BankAccountStatus`.
  if (Number(account?.qr_dynamic_status) !== BankAccountStatus.ACTIVE) {
    return "disabled";
  }

  return account.qr_dynamic_bank_id &&
    account.qr_dynamic_account_reference &&
    account.qr_dynamic_has_credentials
    ? "active"
    : "incomplete";
};

export const QR_ACCOUNT_STATE_LABEL: Record<QrAccountState, string> = {
  active: "Activo",
  incomplete: "Incompleto",
  disabled: "Deshabilitado",
};

export const QR_ACCOUNT_STATE_COLOR: Record<
  QrAccountState,
  { color: string; bg: string }
> = {
  active: { color: "var(--cSuccess)", bg: "var(--cHoverSuccess)" },
  incomplete: { color: "var(--cWarning)", bg: "var(--cHoverWarning)" },
  disabled: { color: "var(--cError)", bg: "var(--cHoverError)" },
};
