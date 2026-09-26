import type { ReactNode } from "react";

export type FinancialRecordType = "debt" | "payment" | "expense";

export type FinancialRecordReference = {
  type: FinancialRecordType;
  id: string | number;
  amount?: number | string | null;
  penaltyAmount?: number | string | null;
  paidAt?: string | null;
};

export type FinancialCapabilities = {
  can_edit_amount: boolean;
  can_edit_penalty: boolean;
  /** Siempre `false` en `dev`: la verificación del estado del pago se descartó. */
  can_verify_payment: boolean;
  can_edit_paid_at: boolean;
};

export type FinancialAuditActor = {
  id?: string | null;
  name: string;
  type?: string | null;
};

export type FinancialAuditEvent = {
  id: string;
  source: "audit" | "record";
  /**
   * 🔴 Dos formatos según `source`: los eventos de auditoría traen el NOMBRE
   * del enum del API (`PENALTY_UPDATED`); los de línea base, que se arman
   * desde el registro, vienen en minúscula (`debt_created`).
   */
  action: string;
  actor?: FinancialAuditActor | null;
  reason?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  occurred_at: string;
  correlation_id?: string | null;
};

export type FinancialWorkspace = {
  record: {
    type: FinancialRecordType;
    id: string;
    amount?: number | string | null;
  };
  capabilities: FinancialCapabilities;
  history: FinancialAuditEvent[];
  history_notice?: string;
};

export type FinancialStatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type FinancialSummary = {
  amount: ReactNode;
  date?: ReactNode;
  status?: {
    label: ReactNode;
    tone?: FinancialStatusTone;
  };
  eyebrow?: ReactNode;
};

export type FinancialMenuAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Va al final del menú, separado de las correcciones. */
  destructive?: boolean;
  disabled?: boolean;
};
