import type { ReactNode } from "react";

export type FinancialRecordType = "debt" | "payment" | "expense";

export type FinancialRecordReference = {
  type: FinancialRecordType;
  id: string | number;
  penaltyAmount?: number | string | null;
  paidAt?: string | null;
};

export type FinancialCapabilities = {
  can_edit_penalty: boolean;
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
  destructive?: boolean;
  disabled?: boolean;
};
