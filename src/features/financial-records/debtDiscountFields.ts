import { formatBs } from "@/mk/utils/numbers";
import type { FinancialDetailField } from "./FinancialDetailPrimitives";
import type { DebtDiscountFields } from "./types";

export const discountTypes = [
  { id: "percent", name: "Porcentaje (%)" },
  { id: "fixed", name: "Monto fijo (Bs)" },
];

export function debtDiscountLabel(discount?: DebtDiscountFields | null): string | null {
  if (!discount?.discount_type || !Number(discount.discount_amount)) return null;
  if (discount.discount_type === "percent") {
    const percent = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
    return `Descuento del ${percent.format(Number(discount.discount_value))}%`;
  }
  return `Descuento de ${formatBs(Number(discount.discount_amount))}`;
}

export function getDebtDiscountFields(discount?: DebtDiscountFields | null): FinancialDetailField[] {
  if (!discount?.discount_type) return [];
  return [
    { id: "gross-principal", label: "Capital original", value: formatBs(discount.gross_principal_amount ?? 0) },
    { id: "discount", label: "Descuento aplicado", value: formatBs(Number(discount.discount_amount ?? 0)) },
  ];
}
