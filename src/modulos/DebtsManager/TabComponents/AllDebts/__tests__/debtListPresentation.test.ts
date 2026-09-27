import { describe, expect, it } from "vitest";
import { formatBs } from "@/mk/utils/numbers";
import { DebtType } from "@/types/PaymentType";
import {
  DEBT_TABLE_COLUMNS,
  getDebtAmounts,
  getDebtCategoryLabel,
  getDebtConceptPeriodLabel,
  getDebtSubcategoryLabel,
  getDebtTypeLabel,
} from "../debtListPresentation";

describe("debtListPresentation", () => {
  it("ordena las columnas de la tabla", () => {
    expect(
      Object.values(DEBT_TABLE_COLUMNS)
        .sort((a, b) => a.order - b.order)
        .map((column) => column.label),
    ).toEqual([
      "Unidad",
      "Tipo",
      "Categoría",
      "Subcategoría",
      "Concepto/Periodo",
      "Estado",
      "Fecha de vencimiento",
      "Deuda",
      "Multa",
      "Mant. Valor",
      "Deuda total",
      "Monto pagado",
      "Saldo restante",
    ]);
  });

  /**
   * 🔴 Una expensa PARCIAL con el capital cobrado y la multa pendiente:
   * `remaining_amount` (capital) es 0, pero debe 52,20. Si «Saldo restante»
   * lee `remaining_amount`, la muestra saldada.
   */
  it("el saldo restante es total_remaining_amount, no el capital", () => {
    const amounts = getDebtAmounts(
      {
        amount: "600.00",
        penalty_amount: "52.20",
        maintenance_amount: "0.00",
        remaining_amount: "0.00",
        total_remaining_amount: "52.20",
        confirmed_paid_amount: "600.00",
        paid_amount: 0,
        status: 3,
      },
      false,
    );

    expect(amounts.balance).toBe(52.2);
    expect(amounts.paid).toBe(600);
    expect(amounts.total).toBe(652.2);
    expect(formatBs(amounts.balance!)).toBe("Bs 52.20");
    expect(formatBs(amounts.paid!)).toBe("Bs 600.00");
  });

  it("sin los montos del API no inventa lo pagado ni el saldo", () => {
    expect(
      getDebtAmounts({ amount: 100, remaining_amount: 40 }, false),
    ).toMatchObject({ paid: null, balance: null });
  });

  it("el mantenimiento entra al total sólo si el condominio lo habilita", () => {
    const item = { amount: 100, penalty_amount: 10, maintenance_amount: 5 };
    expect(getDebtAmounts(item, true)).toMatchObject({ maintenance: 5, total: 115 });
    expect(getDebtAmounts(item, false)).toMatchObject({ maintenance: 0, total: 110 });
  });

  it("nombra el tipo, la categoría y la subcategoría", () => {
    const item = {
      type: DebtType.EXPENSE,
      subcategory: { name: "Expensas ordinarias", padre: { name: "Ingresos" } },
    };
    expect(getDebtTypeLabel(item)).toBe("Expensas");
    expect(getDebtTypeLabel({ type: DebtType.NORMAL })).toBe("Individual");
    expect(getDebtTypeLabel({ type: 99 })).toBe("-/-");
    expect(getDebtCategoryLabel(item)).toBe("Ingresos");
    expect(getDebtSubcategoryLabel(item)).toBe("Expensas ordinarias");
  });

  it("una expensa se nombra por su periodo; el resto, por su descripción", () => {
    expect(
      getDebtConceptPeriodLabel({ type: DebtType.EXPENSE, month: 9, year: 2026 }),
    ).toBe("Septiembre 2026");
    expect(
      getDebtConceptPeriodLabel({
        type: DebtType.NORMAL,
        description: "Reposición de tarjeta",
      }),
    ).toBe("Reposición de tarjeta");
    expect(
      getDebtConceptPeriodLabel({
        type: DebtType.NORMAL,
        subcategory: { name: "Multas" },
      }),
    ).toBe("Multas");
  });
});
