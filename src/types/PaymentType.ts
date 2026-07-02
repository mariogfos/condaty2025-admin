export enum DebtStatus {
  PENDING = 1,            // Por cobrar
  OVERDUE = 2,            // En mora
  PARTIAL = 3,            // En proceso parcial
  SUBMITTED = 4,          // Pago por confirmar
  PAID = 5,               // Saldada
  FORGIVEN = 6,           // Condonada
  WORKFLOW_PENDING = 7,   // Flujo externo pendiente
  CANCELLED = 8,          // Anulada
  AWAITING_VOUCHER = 9,   // Por subir comprobante
  REJECTED = 10,          // Rechazado
}

export interface PaymentStatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
  longLabel?: string;
}

// Mapa de estados de DEUDA
export const DEBT_STATUS_MAP: Record<number, PaymentStatusConfig> = {
  [DebtStatus.PENDING]: {
    label: "Por Pagar",
    color: "var(--cInfo)",
    backgroundColor: "var(--cHoverCompl3)",
  },
  [DebtStatus.OVERDUE]: {
    label: "Moroso",
    color: "var(--cError)",
    backgroundColor: "var(--cHoverError)",
  },
  [DebtStatus.PARTIAL]: {
    label: "Parcial",
    color: "var(--cInfo)",
    backgroundColor: "var(--cHoverCompl3)",
  },
  [DebtStatus.SUBMITTED]: {
    label: "Por confirmar",
    color: "var(--cWarning)",
    backgroundColor: "var(--cHoverCompl4)",
  },
  [DebtStatus.PAID]: {
    label: "Cobrado",
    color: "var(--cSuccess)",
    backgroundColor: "var(--cHoverCompl2)",
  },
  [DebtStatus.FORGIVEN]: {
    label: "Condonado",
    color: "var(--cSuccess)",
    backgroundColor: "var(--cHoverCompl2)",
  },
  [DebtStatus.WORKFLOW_PENDING]: {
    label: "Pendiente aprobación",
    color: "var(--cWarning)",
    backgroundColor: "var(--cHoverCompl4)",
  },
  [DebtStatus.CANCELLED]: {
    label: "Anulado",
    color: "var(--cError)",
    backgroundColor: "var(--cHoverError)",
  },
  [DebtStatus.AWAITING_VOUCHER]: {
    label: "Por subir comprobante",
    color: "var(--cWarning)",
    backgroundColor: "var(--cHoverCompl4)",
  },
  [DebtStatus.REJECTED]: {
    label: "Rechazado",
    color: "var(--cError)",
    backgroundColor: "var(--cHoverError)",
  },
};

export const getDebtStatusConfig = (status: number): PaymentStatusConfig => {
  return DEBT_STATUS_MAP[status] || {
    label: "Desconocido",
    color: "var(--cLight)",
    backgroundColor: "var(--cHoverLight)",
  };
};
