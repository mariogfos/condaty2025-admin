export enum PaymentStatus {
  SUBMITTED = 1, // Por confirmar
  PAID = 2,      // Confirmado
  REJECTED = 3,  // Rechazado
  CANCELLED = 4, // Anulado
}

export enum DebtStatus {
  PENDING = 1,           // Por cobrar
  OVERDUE = 2,           // En mora
  PARTIAL = 3,           // En proceso parcial
  SUBMITTED = 4,         // Pago por confirmar
  PAID = 5,              // Saldada
  FORGIVEN = 6,          // Condonada
  WORKFLOW_PENDING = 7,  // Flujo externo pendiente
  CANCELLED = 8,         // Anulada
}

export enum PaymentMethod {
  TRANSFER = 1,
  OFFICE = 2,
  QR = 3,
  CASH = 4,
  CHEQUE = 5,
}

export enum PaymentType {
  ALL_DEBTS = 1,
  EXPENSES = 2,
  RESERVATIONS = 3,
  CONDONATION = 4,
  PAYMENT_PLAN = 5,
  OTHER_DEBTS = 6,
  DIRECT_INCOME = 7,
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
};

// Mapa de estados de PAGO
export const PAYMENT_STATUS_MAP: Record<number, PaymentStatusConfig> = {
  [PaymentStatus.SUBMITTED]: {
    label: "Por confirmar",
    color: "var(--cWarning)",
    backgroundColor: "var(--cHoverCompl4)",
  },
  [PaymentStatus.PAID]: {
    label: "Confirmado",
    color: "var(--cSuccess)",
    backgroundColor: "var(--cHoverCompl2)",
  },
  [PaymentStatus.REJECTED]: {
    label: "Rechazado",
    color: "var(--cMediumAlert)",
    backgroundColor: "var(--cHoverCompl5)",
  },
  [PaymentStatus.CANCELLED]: {
    label: "Anulado",
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

export const getPaymentStatusConfig = (status: number): PaymentStatusConfig => {
  return PAYMENT_STATUS_MAP[status] || {
    label: "Desconocido",
    color: "var(--cLight)",
    backgroundColor: "var(--cHoverLight)",
  };
};
