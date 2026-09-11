import { MONTHS_ES } from "@/mk/utils/date";

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
  total: { label: "Deuda total", order: 10 },
  paid: { label: "Monto pagado", order: 11 },
  remaining: { label: "Saldo restante", order: 12 },
} as const;

export interface DebtFinancialSummary {
  debt: number;
  penalty: number;
  maintenance: number;
  total: number;
  paid: number;
  remaining: number;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const toMoney = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? roundMoney(Math.max(0, parsed)) : 0;
};

const readOptionalMoney = (item: any, keys: string[]) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value === null || value === undefined || value === "") continue;

    const parsed = Number(value);
    if (Number.isFinite(parsed)) return roundMoney(Math.max(0, parsed));
  }

  return null;
};

const clampToTotal = (value: number, total: number) =>
  roundMoney(Math.min(Math.max(value, 0), total));

export const getDebtCategoryLabel = (item: any) =>
  item?.debt?.subcategory?.padre?.name ||
  item?.subcategory?.padre?.name ||
  "-/-";

export const getDebtSubcategoryLabel = (item: any) =>
  item?.debt?.subcategory?.name || item?.subcategory?.name || "-/-";

export const getDebtTypeLabel = (item: any) => {
  switch (Number(item?.type ?? item?.debt?.type)) {
    case 0:
      return "Individual";
    case 1:
      return "Expensas";
    case 2:
      return "Reservas";
    case 3:
      return "Multa por Cancelación";
    case 4:
      return "Compartida";
    case 5:
      return "Condonación";
    default:
      return "-/-";
  }
};

export const getDebtConceptPeriodLabel = (item: any) => {
  const type = Number(item?.type ?? item?.debt?.type ?? 0);

  if (type === 1) {
    const month = item?.debt?.month ?? item?.shared?.month ?? item?.month;
    const year = item?.debt?.year ?? item?.shared?.year ?? item?.year;
    const monthNumber = Number(month);

    if (
      Number.isInteger(monthNumber) &&
      monthNumber >= 1 &&
      monthNumber <= 12 &&
      year
    ) {
      return `${MONTHS_ES[monthNumber - 1]} ${year}`;
    }
  }

  if (type === 2) {
    return (
      item?.reservation?.area?.title ||
      item?.debt?.reservation?.area?.title ||
      item?.description ||
      "-/-"
    );
  }

  if (type === 3) {
    return (
      item?.penaltyReservation?.area?.title ||
      item?.debt?.reservation_penalty?.area?.title ||
      item?.penalty_reservation?.area?.title ||
      item?.description ||
      "-/-"
    );
  }

  if (type === 4) {
    return item?.shared?.description || item?.description || "-/-";
  }

  return (
    item?.description ||
    item?.debt?.description ||
    getDebtSubcategoryLabel(item)
  );
};

export const getDebtFinancialSummary = (item: any): DebtFinancialSummary => {
  const debt = toMoney(item?.amount);
  const penalty = toMoney(item?.penalty_amount);
  const maintenance = toMoney(item?.maintenance_amount);
  const total = roundMoney(debt + penalty + maintenance);

  const exactPaid = readOptionalMoney(item, [
    "confirmed_paid_amount",
    "paid_amount",
  ]);
  const exactRemaining = readOptionalMoney(item, [
    "total_remaining_amount",
    "current_remaining",
  ]);

  if (exactPaid !== null || exactRemaining !== null) {
    const paid = clampToTotal(
      exactPaid ?? Math.max(total - (exactRemaining ?? total), 0),
      total,
    );
    const remaining = clampToTotal(
      exactRemaining ?? Math.max(total - paid, 0),
      total,
    );

    return { debt, penalty, maintenance, total, paid, remaining };
  }

  const status = String(item?.status ?? "").trim().toUpperCase();

  if (status === "P") {
    return { debt, penalty, maintenance, total, paid: total, remaining: 0 };
  }

  if (["F", "C", "X"].includes(status)) {
    return { debt, penalty, maintenance, total, paid: 0, remaining: 0 };
  }

  if (status === "I") {
    const principalRemaining = readOptionalMoney(item, ["remaining_amount"]);
    const paid = clampToTotal(
      principalRemaining === null
        ? 0
        : Math.max(debt - Math.min(principalRemaining, debt), 0),
      total,
    );

    return {
      debt,
      penalty,
      maintenance,
      total,
      paid,
      remaining: roundMoney(Math.max(total - paid, 0)),
    };
  }

  return { debt, penalty, maintenance, total, paid: 0, remaining: total };
};
