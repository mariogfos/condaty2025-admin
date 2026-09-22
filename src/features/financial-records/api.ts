import type { FinancialRecordReference } from "./types";

const BASE = "/financial-records";

export const financialRecordsApi = {
  workspace: (record: FinancialRecordReference) =>
    `${BASE}/${record.type}/${record.id}/workspace`,
  amount: (record: FinancialRecordReference) =>
    `${BASE}/${record.type}/${record.id}/amount`,
  penalty: (recordId: string | number) => `${BASE}/debt/${recordId}/penalty`,
  verifyPaymentState: (recordId: string | number) =>
    `${BASE}/debt/${recordId}/payment-state-verification`,
  paidAt: (record: FinancialRecordReference) =>
    `${BASE}/${record.type}/${record.id}/paid-at`,
};
