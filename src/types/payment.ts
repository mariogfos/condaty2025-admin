export interface PaymentStatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

export const PAYMENT_STATUS_MAP = {
  A: {
    label: "Por Pagar",
    color: "var(--cWarning)",
    backgroundColor: "var(--cHoverWarning)",
  },
  P: {
    label: "Pagado",
    color: "var(--cSuccess)",
    backgroundColor: "var(--cHoverSuccess)",
  },
  S: {
    label: "Por confirmar",
    color: "var(--cWarning)",
    backgroundColor: "var(--cHoverWarning)",
  },
  M: {
    label: "Moroso",
    color: "var(--cError)",
    backgroundColor: "var(--cHoverError)",
  },
  R: {
    label: "Rechazado",
    color: "var(--cError)",
    backgroundColor: "var(--cHoverError)",
  },
  X: {
    label: "Anulado",
    color: "var(--cMediumAlert)",
    backgroundColor: "var(--cHoverCompl5)",
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