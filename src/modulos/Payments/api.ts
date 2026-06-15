export const PAYMENTS_V3_BASE = "/v3/payments";

export const paymentsApi = {
  unitFinancialState: (dptoId: string | number) =>
    `${PAYMENTS_V3_BASE}/units/${dptoId}/financial-state`,
  adminDebts: `${PAYMENTS_V3_BASE}/admin/debts`,
  adminPartialDebts: `${PAYMENTS_V3_BASE}/admin/partial-debts`,
  full: `${PAYMENTS_V3_BASE}/full`,
  partial: `${PAYMENTS_V3_BASE}/partial`,
  partialSummary: (debtId: string | number) =>
    `${PAYMENTS_V3_BASE}/debts/${debtId}/partial-summary`,
  detail: (paymentId: string | number) => `${PAYMENTS_V3_BASE}/${paymentId}`,
  receipt: (paymentId: string | number) =>
    `${PAYMENTS_V3_BASE}/${paymentId}/receipt`,
  voucher: (paymentId: string | number) =>
    `${PAYMENTS_V3_BASE}/${paymentId}/voucher`,
  confirm: (paymentId: string | number) =>
    `${PAYMENTS_V3_BASE}/${paymentId}/confirm`,
  cancel: (paymentId: string | number) => `${PAYMENTS_V3_BASE}/${paymentId}`,
  partialReceipt: (debtId: string | number) =>
    `${PAYMENTS_V3_BASE}/debts/${debtId}/partial-receipt`,
  resolvedPayment: (debtId: string | number) =>
    `${PAYMENTS_V3_BASE}/debts/${debtId}/resolved-payment`,
};
