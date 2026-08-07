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

/**
 * Cómo se llama cada estado de deuda para el usuario, COMPLETO.
 *
 * 🔴 Lo reportó Mario el 2026-08-07: en el detalle de un periodo de Expensas la
 * columna Estado mostraba **un "3" pelado**, y el filtro por estado no ofrecía
 * ese estado. Medido en la base local: **257 expensas en PARTIAL**.
 *
 * La causa: cada pantalla escribía su propio `switch` o su propio mapa, y
 * ninguno estaba completo. Éste es el espejo exacto de `DebtStatus::label()`
 * del backend — si las palabras se separan, el PDF dice una cosa y la pantalla
 * otra sobre la misma fila.
 *
 * ⚠️ `Record<DebtStatus, string>` (no `Record<number, string>`) a propósito:
 * si se agrega un case al enum y nadie le pone nombre, **no compila**. Con
 * `number` el hueco es silencioso y se descubre en un PDF.
 *
 * ⚠️ Este archivo tiene además `DEBT_STATUS_MAP` con OTRAS palabras para el
 * mismo enum ("Por Pagar", "Moroso", "Cobrado"), y `DebtsManager` tiene una
 * tercera. No las unifico sin decisión de producto: cambiaría texto en
 * pantallas que nadie pidió tocar.
 */
export const DEBT_STATUS_TEXT: Record<DebtStatus, string> = {
  [DebtStatus.PENDING]: "Por cobrar",
  [DebtStatus.OVERDUE]: "En mora",
  [DebtStatus.PARTIAL]: "Pago parcial",
  [DebtStatus.SUBMITTED]: "Por confirmar",
  [DebtStatus.PAID]: "Cobrada",
  [DebtStatus.FORGIVEN]: "Condonada",
  [DebtStatus.WORKFLOW_PENDING]: "En flujo externo",
  [DebtStatus.CANCELLED]: "Anulada",
  [DebtStatus.AWAITING_VOUCHER]: "Por subir comprobante",
  [DebtStatus.REJECTED]: "Rechazado",
};

export const getDebtStatusText = (status: number): string =>
  DEBT_STATUS_TEXT[status as DebtStatus] ?? "Desconocido";

export const getDebtStatusConfig = (status: number): PaymentStatusConfig => {
  return DEBT_STATUS_MAP[status] || {
    label: "Desconocido",
    color: "var(--cLight)",
    backgroundColor: "var(--cHoverLight)",
  };
};
