export enum CurrencyTypeStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

export const CURRENCY_TYPE_STATUS_LABELS = {
  [CurrencyTypeStatus.INACTIVE]: "Inactivo",
  [CurrencyTypeStatus.ACTIVE]: "Activo",
} as const;

export interface CurrencyTypeItem {
  id?: string | number;
  name: string;
  code: string;
  description?: string;
  status: CurrencyTypeStatus | number;
  created_at?: string;
  updated_at?: string;
}
