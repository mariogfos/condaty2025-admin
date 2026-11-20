import { formatBs } from "@/mk/utils/numbers";
import type { PenaltyEditLimits } from "./types";

export const penaltyEditError = (input: string, limits?: PenaltyEditLimits): string => {
  if (input.trim() === "") {
    return "Ingresa un monto. Para quitar la multa, escribe 0.";
  }
  const amount = Number(input.replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) {
    return "Ingresa un monto válido mayor o igual a Bs 0.00.";
  }
  const cents = Math.round(amount * 100);
  if (cents > 9_999_999_999) {
    return "El monto máximo permitido es Bs 99,999,999.99.";
  }
  if (limits?.blocked_reason) return limits.blocked_reason;
  const minimum = Number(limits?.minimum_amount ?? 0);
  if (Number.isFinite(minimum) && cents < Math.round(minimum * 100)) {
    return `La multa no puede ser menor a ${formatBs(minimum)} porque ya hay ingresos aplicados a esta deuda. Primero debes corregir o anular esos ingresos si no corresponden.`;
  }
  return "";
};
