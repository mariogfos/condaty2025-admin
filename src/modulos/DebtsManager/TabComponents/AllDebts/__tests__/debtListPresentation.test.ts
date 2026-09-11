import { describe, expect, it } from "vitest";
import {
  DEBT_TABLE_COLUMNS,
  getDebtCategoryLabel,
  getDebtConceptPeriodLabel,
  getDebtFinancialSummary,
  getDebtSubcategoryLabel,
  getDebtTypeLabel,
} from "../debtListPresentation";

describe("debtListPresentation", () => {
  it("defines the debt table columns in the requested order", () => {
    expect(Object.values(DEBT_TABLE_COLUMNS)).toEqual([
      { label: "Unidad", order: 1 },
      { label: "Tipo", order: 2 },
      { label: "Categoría", order: 3 },
      { label: "Subcategoría", order: 4 },
      { label: "Concepto/Periodo", order: 5 },
      { label: "Estado", order: 6 },
      { label: "Fecha de vencimiento", order: 7 },
      { label: "Deuda", order: 8 },
      { label: "Multa", order: 9 },
      { label: "Deuda total", order: 10 },
      { label: "Monto pagado", order: 11 },
      { label: "Saldo restante", order: 12 },
    ]);
  });

  it("resolves debt classification labels from list relations", () => {
    const item = {
      type: "1",
      subcategory: {
        name: "Expensas ordinarias",
        padre: { name: "Ingresos" },
      },
    };

    expect(getDebtTypeLabel(item)).toBe("Expensas");
    expect(getDebtCategoryLabel(item)).toBe("Ingresos");
    expect(getDebtSubcategoryLabel(item)).toBe("Expensas ordinarias");
  });

  it("uses month and year as the concept for expense debts", () => {
    expect(
      getDebtConceptPeriodLabel({
        type: 1,
        debt: { month: 9, year: 2026 },
      }),
    ).toBe("Septiembre 2026");
  });

  it("falls back to the debt description for non-expense concepts", () => {
    expect(
      getDebtConceptPeriodLabel({
        type: 0,
        description: "Reposición de tarjeta",
      }),
    ).toBe("Reposición de tarjeta");
  });

  it("calculates total, paid and remaining amounts for unpaid and paid debts", () => {
    expect(
      getDebtFinancialSummary({
        amount: "100",
        penalty_amount: "10",
        maintenance_amount: "5",
        status: "A",
      }),
    ).toEqual({
      debt: 100,
      penalty: 10,
      maintenance: 5,
      total: 115,
      paid: 0,
      remaining: 115,
    });

    expect(
      getDebtFinancialSummary({
        amount: "100",
        penalty_amount: "10",
        maintenance_amount: "5",
        status: "P",
      }),
    ).toMatchObject({ total: 115, paid: 115, remaining: 0 });
  });

  it("prioritizes exact payment balances returned by the API", () => {
    expect(
      getDebtFinancialSummary({
        amount: 100,
        penalty_amount: 10,
        maintenance_amount: 5,
        status: "I",
        confirmed_paid_amount: 65,
        total_remaining_amount: 50,
      }),
    ).toMatchObject({ total: 115, paid: 65, remaining: 50 });
  });

  it("derives a compatible balance for legacy partial-payment rows", () => {
    expect(
      getDebtFinancialSummary({
        amount: 100,
        penalty_amount: 10,
        maintenance_amount: 5,
        status: "I",
        remaining_amount: 40,
      }),
    ).toMatchObject({ total: 115, paid: 60, remaining: 55 });
  });

  it("treats forgiven and cancelled debts as having no collectible balance", () => {
    expect(
      getDebtFinancialSummary({ amount: 100, status: "F" }),
    ).toMatchObject({ paid: 0, remaining: 0 });
    expect(
      getDebtFinancialSummary({ amount: 100, status: "X" }),
    ).toMatchObject({ paid: 0, remaining: 0 });
  });
});
