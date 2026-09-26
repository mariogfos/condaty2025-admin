import type { FinancialRecordReference } from "./types";

/**
 * `v3/financial-records` — sin `/api/`: el baseURL ya lo trae.
 *
 * ⚠️ `payment-state-verification` NO está: en `dev` esa acción se descartó y
 * `can_verify_payment` llega siempre en `false`.
 */
const BASE = "/v3/financial-records";

export const financialRecordsApi = {
  workspace: (record: FinancialRecordReference) =>
    `${BASE}/${record.type}/${record.id}/workspace`,
  amount: (record: FinancialRecordReference) =>
    `${BASE}/${record.type}/${record.id}/amount`,
  penalty: (recordId: string | number) => `${BASE}/debt/${recordId}/penalty`,
  paidAt: (record: FinancialRecordReference) =>
    `${BASE}/${record.type}/${record.id}/paid-at`,
};
