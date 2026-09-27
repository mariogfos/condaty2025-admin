import { MONTHS_ES } from "@/mk/utils/date";
import { DebtType } from "@/types/PaymentType";

/**
 * Las columnas de "Todas las deudas", en el orden en que se ven.
 *
 * "Mant. Valor" sólo se muestra si el condominio lo tiene habilitado
 * (`hasMaintenanceValue`); cuando no, su hueco en el orden no molesta.
 */
export const DEBT_TABLE_COLUMNS = {
  unit: { label: "Unidad", order: 1 },
  type: { label: "Tipo", order: 2 },
  category: { label: "Categoría", order: 3 },
  subcategory: { label: "Subcategoría", order: 4 },
  conceptPeriod: { label: "Concepto/Periodo", order: 5 },
  status: { label: "Estado", order: 6 },
  dueAt: { label: "Fecha de vencimiento", order: 7 },
  debt: { label: "Deuda", order: 8 },
  penalty: { label: "Multa", order: 9 },
  maintenance: { label: "Mant. Valor", order: 10 },
  total: { label: "Deuda total", order: 11 },
  paid: { label: "Monto pagado", order: 12 },
  balance: { label: "Saldo restante", order: 13 },
} as const;

const toMoney = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
};

/** `null` cuando el API no mandó la clave: no se inventa un número de plata. */
const toMoneyOrNull = (value: unknown): number | null =>
  value === null || value === undefined || value === "" ? null : toMoney(value);

export interface DebtAmounts {
  debt: number;
  penalty: number;
  maintenance: number;
  total: number;
  paid: number | null;
  balance: number | null;
}

/**
 * Los montos de una fila de `GET /v3/debt-dptos?fullType=L` (admin).
 *
 * 🔴 El saldo es `total_remaining_amount` (capital + multa + mantenimiento −
 * lo confirmado), NUNCA `remaining_amount`: ése es sólo el CAPITAL. Una expensa
 * parcial con el capital cobrado y la multa pendiente trae `remaining_amount`
 * 0 y un saldo positivo — leerla del capital la muestra saldada.
 *
 * ⚠️ Lo pagado es `confirmed_paid_amount`, no `paid_amount`: ésa la pisa un
 * accessor del modelo con otra semántica.
 *
 * Si el API no manda alguna de las dos, se devuelve `null` y la celda muestra
 * "-/-": derivarla de `remaining_amount` o del estado es inventarla.
 */
export const getDebtAmounts = (
  item: any,
  includeMaintenance: boolean,
): DebtAmounts => {
  const debt = toMoney(item?.amount);
  const penalty = toMoney(item?.penalty_amount);
  const maintenance = includeMaintenance ? toMoney(item?.maintenance_amount) : 0;

  return {
    debt,
    penalty,
    maintenance,
    total: toMoney(debt + penalty + maintenance),
    paid: toMoneyOrNull(item?.confirmed_paid_amount),
    balance: toMoneyOrNull(item?.total_remaining_amount),
  };
};

/**
 * ⚠️ La QUINTA tabla de nombres del tipo de deuda del admin, y con las
 * palabras del API ("Individual", "Compartida"). Las claves se unifican; las
 * palabras se dejan porque son de producto.
 */
const DEBT_TYPE_LABELS: Record<number, string> = {
  [DebtType.NORMAL]: "Individual",
  [DebtType.EXPENSE]: "Expensas",
  [DebtType.RESERVATION]: "Reservas",
  [DebtType.PENALTY_RESERVATION]: "Multa por Cancelación",
  [DebtType.SHARED]: "Compartida",
  [DebtType.FORGIVENESS]: "Condonación",
  [DebtType.PAYMENT_PLAN]: "Plan de pago",
};

export const getDebtTypeLabel = (item: any): string =>
  DEBT_TYPE_LABELS[Number(item?.type)] ?? "-/-";

export const getDebtCategoryLabel = (item: any): string =>
  item?.subcategory?.padre?.name || "-/-";

export const getDebtSubcategoryLabel = (item: any): string =>
  item?.subcategory?.name || "-/-";

/**
 * Una expensa se nombra por su periodo ("Septiembre 2026"); el resto, por su
 * descripción y, si no tiene, por su subcategoría. El listado del admin trae
 * `debt_dptos.*` con `subcategory.padre`, sin reservas ni compartidas.
 */
export const getDebtConceptPeriodLabel = (item: any): string => {
  const month = Number(item?.month);
  if (
    Number(item?.type) === DebtType.EXPENSE &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    item?.year
  ) {
    return `${MONTHS_ES[month - 1]} ${item.year}`;
  }

  return item?.description || getDebtSubcategoryLabel(item);
};
