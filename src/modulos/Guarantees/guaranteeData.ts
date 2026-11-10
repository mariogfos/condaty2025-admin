import { formatBs } from "@/mk/utils/numbers";

export type Guarantee = {
  id: number;
  unit_id: number;
  unit: string;
  owner: string;
  bank: string;
  balance_cents: number;
  committed_cents: number;
  available_cents: number;
};

export type GuaranteeOption = { id: number | string; name: string };

export type GuaranteeUnit = {
  holders: GuaranteeOption[];
  deposit_bank_account_id: number | null;
};

export type Movement = {
  id: number;
  kind: "deposit" | "refund" | "payment";
  amount_cents: number;
  reference: string;
  created_at: string | null;
  registered_by: string | null;
};

export type MovementPage = { items: Movement[]; next_before_id: number | null };

export const guaranteePath = "/reservation-guarantees";
export const formatCents = (cents: number) => formatBs(cents / 100);
