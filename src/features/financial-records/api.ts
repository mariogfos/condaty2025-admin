import type { FinancialRecordReference } from "./types";

const BASE = "/financial-records";

export const financialRecordsApi = {
  workspace: (record: FinancialRecordReference) =>
    `${BASE}/${record.type}/${record.id}/workspace`,
  penalty: (recordId: string | number) => `${BASE}/debt/${recordId}/penalty`,
  verifyPaymentState: (recordId: string | number) =>
    `${BASE}/debt/${recordId}/payment-state-verification`,
  paidAt: (record: FinancialRecordReference) =>
    `${BASE}/${record.type}/${record.id}/paid-at`,
};
