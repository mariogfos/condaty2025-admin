const BASE = "/backoffice/financial";

export const financialIntegrityApi = {
  clients: `${BASE}/clients`,
  scanDebtPaymentState: `${BASE}/integrity/debt-payment-state`,
  fixDebtPaymentState: `${BASE}/integrity/debt-payment-state/fix`,
  history: `${BASE}/history`,
};
