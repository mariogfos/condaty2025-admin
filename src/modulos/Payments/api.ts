export const PAYMENTS_V2_BASE = "/payments-v2";

export const paymentsApi = {
  unitFinancialState: (dptoId: string | number) =>
    `${PAYMENTS_V2_BASE}/units/${dptoId}/financial-state`,
  adminDebts: `${PAYMENTS_V2_BASE}/admin/debts`,
  adminPartialDebts: `${PAYMENTS_V2_BASE}/admin/partial-debts`,
  full: `${PAYMENTS_V2_BASE}/full`,
  partial: `${PAYMENTS_V2_BASE}/partial`,
  partialSummary: (debtId: string | number) =>
    `${PAYMENTS_V2_BASE}/debts/${debtId}/partial-summary`,
  detail: (paymentId: string | number) => `${PAYMENTS_V2_BASE}/${paymentId}`,
  receipt: (paymentId: string | number) =>
    `${PAYMENTS_V2_BASE}/${paymentId}/receipt`,
  voucher: (paymentId: string | number) =>
    `${PAYMENTS_V2_BASE}/${paymentId}/voucher`,
  confirm: (paymentId: string | number) =>
    `${PAYMENTS_V2_BASE}/${paymentId}/confirm`,
  cancel: (paymentId: string | number) => `${PAYMENTS_V2_BASE}/${paymentId}`,
  partialReceipt: (debtId: string | number) =>
    `${PAYMENTS_V2_BASE}/debts/${debtId}/partial-receipt`,
  resolvedPayment: (debtId: string | number) =>
    `${PAYMENTS_V2_BASE}/debts/${debtId}/resolved-payment`,
};
