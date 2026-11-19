import type { ReactNode } from "react";

export type FinancialRecordType = "debt" | "payment" | "expense";
export type DebtDiscountType = "percent" | "fixed";

export type DebtDiscountFields = {
  gross_principal_amount?: number;
  discount_type?: DebtDiscountType | null;
  discount_value?: number | string | null;
  discount_amount?: number | string | null;
  settled_by_discount?: boolean;
  confirmed_paid_amount?: number;
};

export type FinancialRecordReference = {
  type: FinancialRecordType;
  id: string | number;
  amount?: number | string | null;
  penaltyAmount?: number | string | null;
  paidAt?: string | null;
} & DebtDiscountFields;

export type FinancialCapabilities = {
  can_edit_amount: boolean;
  can_edit_penalty: boolean;
  can_edit_discount?: boolean;
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
    amount?: number | string | null;
    usd_terms?: { principal: UsdComponent; penalty: UsdComponent; quote_error?: string } | null;
  } & DebtDiscountFields;
  capabilities: FinancialCapabilities;
  history: FinancialAuditEvent[];
  history_notice?: string;
};

export type UsdComponent = {
  currency: "USD" | "BOB";
  amount: string;
  remaining?: string;
  rate: { value: string; date: string; effective_date?: string; source: string };
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
