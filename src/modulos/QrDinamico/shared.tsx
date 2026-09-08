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
