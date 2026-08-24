export const PAYMENTS_V3_BASE = "/v3/payments";

export const paymentsApi = {
  unitFinancialState: (dptoId: string | number) =>
    `${PAYMENTS_V3_BASE}/units/${dptoId}/financial-state`,
  adminDebts: `${PAYMENTS_V3_BASE}/admin/debts`,
  create: PAYMENTS_V3_BASE,
  simulate: `${PAYMENTS_V3_BASE}/simulate`,
  partialSummary: (debtId: string | number) =>
    `${PAYMENTS_V3_BASE}/debts/${debtId}/partial-summary`,
  detail: (paymentId: string | number) => `${PAYMENTS_V3_BASE}/${paymentId}`,
  receipt: (paymentId: string | number) =>
    `${PAYMENTS_V3_BASE}/${paymentId}/receipt`,
  voucher: (paymentId: string | number) =>
    `${PAYMENTS_V3_BASE}/${paymentId}/voucher`,
  confirm: (paymentId: string | number) =>
    `${PAYMENTS_V3_BASE}/${paymentId}/confirm`,
  // Verifica un pago QR contra el banco (reconciliación por si el webhook no llegó).
  qrVerify: (paymentId: string | number) =>
    `/v3/qr-dynamic/payments/${paymentId}/verify`,
  cancel: (paymentId: string | number) => `${PAYMENTS_V3_BASE}/${paymentId}`,
  partialReceipt: (debtId: string | number) =>
    `${PAYMENTS_V3_BASE}/debts/${debtId}/partial-receipt`,
  resolvedPayment: (debtId: string | number) =>
    `${PAYMENTS_V3_BASE}/debts/${debtId}/resolved-payment`,
};
