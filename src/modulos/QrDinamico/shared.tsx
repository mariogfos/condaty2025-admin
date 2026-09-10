import React from "react";
import { QR_STATE_COLOR, QR_STATE_LABEL, QrOrderState } from "./types";

/** Badge de estado de un QR — compartido por deuda, ingreso e historial. */
export const StateBadge = ({ state }: { state: QrOrderState }) => {
  const cfg = QR_STATE_COLOR[state];
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
 * Mensaje mostrable de una respuesta de useAxios (DES-32).
 * En 2xx viene en data.message; en 403/404/422 axios tira y el cuerpo
 * del backend queda en error.data.message.
 */
export const apiMessage = (res: any): string | null =>
  res?.data?.message || res?.error?.data?.message || null;

export type QrAccountState = "active" | "incomplete" | "disabled";

/**
 * Dynamic-QR state of a bank account, derived from the bank-accounts list
 * response. The non-sensitive qr_dynamic_* columns ship with every row, and
 * the API derives qr_dynamic_has_credentials so the front can tell a
 * configured account from an empty one without ever seeing the secrets.
 */
export const qrAccountState = (account: any): QrAccountState => {
  if (!account?.qr_dynamic_enabled) return "disabled";
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
