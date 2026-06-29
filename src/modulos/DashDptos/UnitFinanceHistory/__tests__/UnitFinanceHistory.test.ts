import { describe, it, expect } from "vitest";
import { MONTHS_S } from "@/mk/utils/date";
import { DebtStatus } from "@/types/PaymentType";

// ---------------------------------------------------------------------------
// Inlined helpers — NUMERIC-NATIVE (post-S6-status-numeric refactor)
// ---------------------------------------------------------------------------

const getMonthPeriodLabel = (monthValue: any, yearValue: any) => {
  if (monthValue == null || yearValue == null) return "";
  const monthNumber = Math.max(1, Math.min(12, Number(monthValue)));
  const monthLabel = MONTHS_S[monthNumber] || String(monthValue);
  return `${monthLabel} ${yearValue}`;
};

// POST-TRANSFORM: reads row?.month/year (dpto-level), debt head retired
const getDebtConceptLabel_inline = (row: any) => {
  const debtType = Number(row?.type ?? -1);

  if (debtType === 1) {
    return (
      getMonthPeriodLabel(
        row?.month ?? row?.shared?.month,
        row?.year ?? row?.shared?.year,
      ) || "-/-"
    );
  }

  if (debtType === 2) {
    return "-/-"; // reservation area label omitted in inline version
  }

  if (debtType === 3) {
    return row?.description || "-/-";
  }

  // POST-TRANSFORM: debt?.description dropped
  return (
    row?.description ||
    row?.shared?.description ||
    row?.subcategory?.name ||
    "-/-"
  );
};

// NUMERIC-NATIVE: status is always a number; never calls .toUpperCase()
const getDebtNumericStatus = (row: any): number => {
  const raw = row?.status ?? row?.debt_status ?? row?.debt_dpto?.status;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DebtStatus.PENDING;
};

// NUMERIC overdue rule: PENDING + past due_at => OVERDUE
const resolveDebtStatus_numeric = (row: any): number => {
  const status = getDebtNumericStatus(row);
  const dueAtString = row?.due_at || "";
  const todayString = new Date().toISOString().split("T")[0];

  if (status === DebtStatus.PENDING && dueAtString && dueAtString < todayString) {
    return DebtStatus.OVERDUE;
  }

  return status;
};

// ACTIVE set: numeric DebtStatus values
const ACTIVE_DEBT_STATUSES_NUMERIC = new Set([
  DebtStatus.PENDING,
  DebtStatus.OVERDUE,
  DebtStatus.PARTIAL,
  DebtStatus.SUBMITTED,
]);

// ---------------------------------------------------------------------------
// Tests — concept label (unchanged from S6 HU-3 Slice D)
// ---------------------------------------------------------------------------

describe("UnitFinanceHistory — concept label (S6 HU-3 Slice D)", () => {
  it("type=1 EXPENSE: reads month/year from dpto-level, not debt head", () => {
    const row = {
      type: 1,
      month: 3,
      year: 2025,
      debt: { month: 12, year: 9999 },
      shared: null,
    };
    const result = getDebtConceptLabel_inline(row);
    expect(result).toContain(MONTHS_S[3]);
    expect(result).toContain("2025");
    expect(result).not.toContain("9999");
    expect(result).not.toContain(MONTHS_S[12]);
  });

  it("type=1 SHARED: falls back to shared when dpto month/year are null", () => {
    const row = {
      type: 1,
      month: null,
      year: null,
      shared: { month: 7, year: 2022 },
    };
    const result = getDebtConceptLabel_inline(row);
    expect(result).toContain(MONTHS_S[7]);
    expect(result).toContain("2022");
  });

  it("default type: does NOT use debt.description", () => {
    const row = {
      type: 99,
      description: null,
      shared: { description: null },
      debt: { description: "never" },
      subcategory: null,
    };
    const result = getDebtConceptLabel_inline(row);
    expect(result).toBe("-/-");
    expect(result).not.toBe("never");
  });
});

// ---------------------------------------------------------------------------
// Tests — NUMERIC status helpers (new in this slice)
// ---------------------------------------------------------------------------

describe("UnitFinanceHistory — numeric status (debt_dptos.status is int)", () => {
  it("getDebtNumericStatus: returns numeric status from row.status", () => {
    expect(getDebtNumericStatus({ status: 2 })).toBe(DebtStatus.OVERDUE);
    expect(getDebtNumericStatus({ status: 5 })).toBe(DebtStatus.PAID);
  });

  it("getDebtNumericStatus: falls back to PENDING when status is missing", () => {
    expect(getDebtNumericStatus({})).toBe(DebtStatus.PENDING);
    expect(getDebtNumericStatus({ status: null })).toBe(DebtStatus.PENDING);
  });

  it("getDebtNumericStatus: reads debt_dpto.status as fallback chain", () => {
    expect(
      getDebtNumericStatus({ debt_dpto: { status: 3 } }),
    ).toBe(DebtStatus.PARTIAL);
  });

  it("resolveDebtStatus_numeric: PENDING + past due_at => OVERDUE", () => {
    const row = { status: DebtStatus.PENDING, due_at: "2020-01-01" };
    expect(resolveDebtStatus_numeric(row)).toBe(DebtStatus.OVERDUE);
  });

  it("resolveDebtStatus_numeric: non-PENDING past due_at stays unchanged", () => {
    // A PAID debt that is past due should NOT become OVERDUE
    const row = { status: DebtStatus.PAID, due_at: "2020-01-01" };
    expect(resolveDebtStatus_numeric(row)).toBe(DebtStatus.PAID);
  });

  it("resolveDebtStatus_numeric: PENDING + future due_at stays PENDING", () => {
    const row = { status: DebtStatus.PENDING, due_at: "2099-12-31" };
    expect(resolveDebtStatus_numeric(row)).toBe(DebtStatus.PENDING);
  });

  it("ACTIVE_DEBT_STATUSES_NUMERIC includes PENDING, OVERDUE, PARTIAL, SUBMITTED", () => {
    expect(ACTIVE_DEBT_STATUSES_NUMERIC.has(DebtStatus.PENDING)).toBe(true);
    expect(ACTIVE_DEBT_STATUSES_NUMERIC.has(DebtStatus.OVERDUE)).toBe(true);
    expect(ACTIVE_DEBT_STATUSES_NUMERIC.has(DebtStatus.PARTIAL)).toBe(true);
    expect(ACTIVE_DEBT_STATUSES_NUMERIC.has(DebtStatus.SUBMITTED)).toBe(true);
  });

  it("ACTIVE_DEBT_STATUSES_NUMERIC excludes PAID, FORGIVEN, CANCELLED", () => {
    expect(ACTIVE_DEBT_STATUSES_NUMERIC.has(DebtStatus.PAID)).toBe(false);
    expect(ACTIVE_DEBT_STATUSES_NUMERIC.has(DebtStatus.FORGIVEN)).toBe(false);
    expect(ACTIVE_DEBT_STATUSES_NUMERIC.has(DebtStatus.CANCELLED)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests — sort still uses dpto-level due_at (not debt.due_at)
// ---------------------------------------------------------------------------

describe("UnitFinanceHistory — sort by dpto due_at (not debt.due_at)", () => {
  it("sorts descending by dpto-level due_at", () => {
    const rows = [
      { id: "b", due_at: "2025-06-01", debt: { due_at: "2020-01-01" }, created_at: "" },
      { id: "a", due_at: "2025-01-01", debt: { due_at: "2030-12-31" }, created_at: "" },
    ];

    const sorted = [...rows].sort((left, right) =>
      String(right?.due_at || right?.created_at || "").localeCompare(
        String(left?.due_at || left?.created_at || ""),
      ),
    );

    expect(sorted[0].id).toBe("b");
    expect(sorted[1].id).toBe("a");
  });
});
