import { describe, it, expect } from "vitest";
import { DebtStatus } from "@/types/PaymentType";
import {
  paidUnits,
  sumPaidUnits,
  unitsPayable,
  isUnitInDefault,
} from "../utils";

// Helper: minimal Assigned-shaped row
const unit = (status: DebtStatus, amount = 100, penalty = 0) =>
  ({
    id: 1,
    debt_id: "d",
    amount,
    penalty_amount: penalty,
    status,
  } as any);

describe("expense summarizers — numeric DebtStatus", () => {
  const asignados = [
    unit(DebtStatus.PAID, 100, 10), // saldada
    unit(DebtStatus.PENDING, 200), // por cobrar
    unit(DebtStatus.OVERDUE, 300), // en mora
    unit(DebtStatus.CANCELLED, 400), // anulada
  ];

  it("paidUnits counts only PAID units", () => {
    expect(paidUnits(asignados)).toBe(1);
    expect(paidUnits([unit(DebtStatus.PENDING)])).toBe(0);
  });

  it("sumPaidUnits sums amount + penalty of PAID units only", () => {
    expect(sumPaidUnits(asignados)).toBe(110);
  });

  it("unitsPayable counts everything except PAID and CANCELLED", () => {
    // PENDING + OVERDUE = 2 payable; PAID and CANCELLED excluded
    expect(unitsPayable(asignados)).toBe(2);
  });

  it("isUnitInDefault is true only when there are payable units and it is past due", () => {
    const pastDue = "2000-01-01";
    const future = "2999-01-01";

    // payable units + past due => in default
    expect(
      isUnitInDefault({ asignados, due_at: pastDue } as any)
    ).toBe(true);

    // payable units but not yet due => not in default
    expect(
      isUnitInDefault({ asignados, due_at: future } as any)
    ).toBe(false);

    // no payable units (all PAID) even past due => not in default
    expect(
      isUnitInDefault({
        asignados: [unit(DebtStatus.PAID)],
        due_at: pastDue,
      } as any)
    ).toBe(false);
  });
});
