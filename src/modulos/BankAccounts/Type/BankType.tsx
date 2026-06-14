export enum BankAccountType {
  CURRENT = 1,
  SAVINGS = 2,
}

export enum BankAccountStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

export enum BankEntityStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

export const BANK_ACCOUNT_TYPE_LABELS = {
  [BankAccountType.CURRENT]: "Cuenta corriente",
  [BankAccountType.SAVINGS]: "Cuenta ahorro",
} as const;

export const BANK_ACCOUNT_STATUS_LABELS = {
  [BankAccountStatus.INACTIVE]: "Deshabilitada",
  [BankAccountStatus.ACTIVE]: "Habilitada",
} as const;

export interface BankEntityItem {
  id: string | number;
  name: string;
  bank_code_v3?: string;
  description?: string;
  status_v3?: BankEntityStatus | number;
  [key: string]: any;
}

export interface BankAccountItem {
  id?: string | number;
  client_id?: string | number;
  bank_entity_id: string | number;
  currency_type_id: string | number;
  account_type_v3: BankAccountType | number;
  account_number: string;
  holder: string;
  ci_holder: string;
  alias_holder: string;
  images?: string | string[] | any;
  has_image?: number;
  initial_amount?: number;
  is_main?: number;
  is_reserve?: number;
  is_expense?: number;
  status_v3?: BankAccountStatus | number;
  bank_entity?: BankEntityItem;
  [key: string]: any;
}
