export const BANK_ACCOUNTS_V3_BASE = "/v3/bank-accounts";

export const bankAccountsApi = {
  base: BANK_ACCOUNTS_V3_BASE,
  modulo: BANK_ACCOUNTS_V3_BASE.replace(/^\//, ""),
  detail: (id: string | number) => `${BANK_ACCOUNTS_V3_BASE}/${id}`,
  availability: (id: string | number) => `/v3/bank-account-availability/${id}`,
};
