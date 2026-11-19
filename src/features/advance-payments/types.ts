export const advanceApi = "/advance-payments";

export type DiscountInput = {
  mode: "none" | "proportional" | "latest" | "custom";
  type?: "fixed" | "percent";
  value?: number;
  replace_existing?: boolean;
  items?: { key: string; type: "fixed" | "percent"; value: number }[];
};
export type AdvanceRow = {
  key: string; debt_id: number | null; period: string; title: string; due_at: string;
  available: boolean; reason?: string; future: boolean; can_discount: boolean;
  bank_account_id?: string | number | null;
  gross: number; fees: number; existing_discount: number;
  debt_type?: number; penalty?: number; maintenance?: number;
  discount?: number; discount_percent?: number; net?: number;
  principal_currency?: string; current_status?: string; current_discount?: string;
};
export type AdvancePlan = { items: AdvanceRow[]; original: number; discount: number; net: number; version: string };
export type AdvanceDraft = {
  payload: { unit_id: number; type: string; selected: string[]; discount: DiscountInput; paid_at?: string };
  preview: AdvancePlan | null; ready: boolean; operation: boolean; requestKey: string; reason: string;
};
export type AdvanceGroup = {
  id: string; unit_label: string; actor_label: string; created_at: string; reason: string | null;
  status: "applied" | "cancelled"; payment_id: string | null;
  period_from: string; period_to: string; debt_count: number;
  payment?: { id: string; code: string; status: string; amount: string; paid_at: string } | null;
  original_amount: string; discount_amount: string; paid_amount: string;
  distribution: DiscountInput; items: AdvanceRow[];
};
export const distributionNames: Record<DiscountInput["mode"], string> = {
  none: "Sin descuento nuevo", proportional: "Proporcional entre las seleccionadas",
  latest: "Desde el último período", custom: "Personalizado por deuda",
};
export const advanceStatus = (group: AdvanceGroup) => group.status === "cancelled" || ["X", "R"].includes(group.payment?.status ?? "")
  ? "Anulada" : !group.payment_id ? "Saldada por descuento" : "Ingreso registrado";
