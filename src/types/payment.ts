export interface PaymentStatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

export const PAYMENT_STATUS_MAP = {
  A: {
    label: "Por Pagar",
    color: "var(--cInfo)",
    backgroundColor: "var(--cHoverCompl3)",
  },
  P: {
    label: "Pagado",
    color: "var(--cSuccess)",
    backgroundColor: "var(--cHoverCompl2)",
  },
  S: {
    label: "Por confirmar",
    color: "var(--cWarning)",
    backgroundColor: "var(--cHoverCompl4)",
  },
  M: {
    label: "Moroso",
    color: "var(--cError)",
    backgroundColor: "var(--cHoverError)",
  },
  R: {
    label: "Rechazado",
    color: "var(--cMediumAlert)",
    backgroundColor: "var(--cHoverCompl5)",
  },
  X: {
    label: "Anulado",
    color: "var(--cError)",
    backgroundColor: "var(--cHoverError)",
  },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS_MAP;

export const getPaymentStatusConfig = (status: PaymentStatus): PaymentStatusConfig => {
  return PAYMENT_STATUS_MAP[status] || {
    label: status,
    color: "var(--cLight)",
    backgroundColor: "var(--cHoverLight)",
  };
};