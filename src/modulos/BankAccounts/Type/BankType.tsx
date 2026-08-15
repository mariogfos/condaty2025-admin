/**
 * Los enums de Bancos, espejo de `app/Modules/Banks/Enums/` del API.
 *
 * 🔴 `INACTIVE` valía 0 en los dos estados. Desde el 2026-08-15 los enums del
 * proyecto arrancan en 1, y acá el motivo es concreto: el filtro de estados de
 * esta misma pantalla declara `{ id: BankAccountStatus.INACTIVE }`, y `0 == ""`
 * es `true` en JavaScript. El `Select` compartido llegó a auto-elegir la opción
 * con id 0 como si el usuario la hubiera tocado (CDT-30).
 */
export enum BankAccountType {
  CURRENT = 1,
  SAVINGS = 2,
}

export enum BankAccountStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

export enum BankEntityStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

/**
 * Si la cuenta está designada para un uso — `is_main`, `is_reserve`,
 * `is_expense`.
 *
 * 🔴 Eran tres `number` con 1 = sí. Ahora el 1 es **NO**: cualquier
 * comparación contra el número crudo quedó al revés. Lo lee
 * `usePaymentsForm` para preseleccionar la cuenta destino del pago.
 */
export enum BankAccountAssignment {
  NO = 1,
  YES = 2,
}

export const BANK_ACCOUNT_TYPE_LABELS = {
  [BankAccountType.CURRENT]: "Cuenta corriente",
  [BankAccountType.SAVINGS]: "Cuenta ahorro",
} as const;

export const BANK_ACCOUNT_STATUS_LABELS = {
  [BankAccountStatus.INACTIVE]: "Deshabilitada",
  [BankAccountStatus.ACTIVE]: "Habilitada",
} as const;

/**
 * Los usos a los que está asignada una cuenta, como los pinta el listado.
 *
 * 🔴 Este cálculo estaba escrito DOS VECES, palabra por palabra, en
 * `BankAccounts.tsx` y en `RenderView/RenderView.tsx`, y las dos copias
 * filtraban con `flags[index] > 0`. Con `BankAccountAssignment` el "no"
 * también es mayor que cero, así que las dos habrían pintado las tres
 * etiquetas en todas las cuentas y ninguna habría salido con "-/-".
 *
 * Espeja al `CONCAT_WS` de `BankAccountRepository`, que es el que arma la
 * misma columna para el listado y el reporte.
 */
export const getAssignmentLabels = (item: {
  is_expense?: unknown;
  is_reserve?: unknown;
  is_main?: unknown;
}): string => {
  const asignada = (valor: unknown) =>
    Number(valor) === BankAccountAssignment.YES;

  return (
    [
      ["Expensa", item?.is_expense],
      ["Reserva", item?.is_reserve],
      ["Principal", item?.is_main],
    ] as const
  )
    .filter(([, valor]) => asignada(valor))
    .map(([label]) => label)
    .join(", ") || "-/-";
};

export interface BankEntityItem {
  id: string | number;
  name: string;
  bank_code?: string;
  description?: string;
  status?: BankEntityStatus | number;
  [key: string]: any;
}

export interface BankAccountItem {
  id?: string | number;
  client_id?: string | number;
  bank_entity_id: string | number;
  currency_type_id: string | number;
  account_type: BankAccountType | number;
  account_number: string;
  holder: string;
  ci_holder: string;
  alias_holder: string;
  images?: string | string[] | any;
  initial_amount?: number;
  is_main?: BankAccountAssignment | number;
  is_reserve?: BankAccountAssignment | number;
  is_expense?: BankAccountAssignment | number;
  status?: BankAccountStatus | number;
  bank_entity?: BankEntityItem;
  [key: string]: any;
}
