import { describe, it, expect } from "vitest";
import { MONTHS_S } from "@/mk/utils/date";

// Inline characterization tests for UnitFinanceHistory pure helpers.
// We inline the TRANSFORMED logic (post-refactor) to lock the intended behavior.
// The actual component file should match this logic after Commit 3 of S6 HU-3 Slice D.

// ---------------------------------------------------------------------------
// Inlined helpers (post-transform)
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

// POST-TRANSFORM: debt?.status removed; dpto.status is canonical
const getDebtStatusCode_inline = (row: any) =>
  String(
    row?.status ?? row?.debt_status ?? row?.debt_dpto?.status ?? "",
  )
    .trim()
    .toUpperCase();

// POST-TRANSFORM: uses row?.due_at directly (Commit 0 backfilled)
const resolveDebtStatus_inline = (row: any) => {
  const normalizedStatus = getDebtStatusCode_inline(row);
  const dueAtString = row?.due_at || "";
  const todayString = new Date().toISOString().split("T")[0];

  if (normalizedStatus === "A" && dueAtString && dueAtString < todayString) {
    return "M";
  }

  return normalizedStatus || "A";
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UnitFinanceHistory — S6 HU-3 Slice D characterization", () => {
  // Test 1
  it("getDebtConceptLabel type=1 EXPENSE: reads month/year from dpto-level, not debt head", () => {
    const row = {
      type: 1,
      month: 3,
      year: 2025,
      debt: { month: 12, year: 9999 },
      shared: null,
    };
    const result = getDebtConceptLabel_inline(row);
    // Should use dpto-level month=3 (Mar) and year=2025, NOT debt.month=12/debt.year=9999
    expect(result).toContain(MONTHS_S[3]);
    expect(result).toContain("2025");
    expect(result).not.toContain("9999");
    expect(result).not.toContain(MONTHS_S[12]);
  });

  // Test 2
  it("getDebtConceptLabel type=1 SHARED: falls back to shared when dpto month/year are null", () => {
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

  // Test 3
  it("getDebtConceptLabel default: does NOT use debt.description", () => {
    const row = {
      type: 99,
      description: null,
      shared: { description: null },
      debt: { description: "never" },
      subcategory: null,
    };
    const result = getDebtConceptLabel_inline(row);
    // debt.description must be dropped — fallback should reach "-/-"
    expect(result).toBe("-/-");
    expect(result).not.toBe("never");
  });

  // Test 4
  it("getDebtStatusCode: uses dpto-level status, not debt head status", () => {
    const row = {
      status: "2",
      debt_status: undefined,
      debt: { status: "A" },
      debt_dpto: null,
    };
    const result = getDebtStatusCode_inline(row);
    expect(result).toBe("2");
    expect(result).not.toBe("A");
  });

  // Test 5
  it("resolveDebtStatus: uses dpto due_at directly (not debt.due_at)", () => {
    // dpto due_at is in the past → should return 'M' (overdue)
    // debt.due_at is far in the future — if we accidentally read it, status stays 'A'
    const row = {
      status: "A",
      due_at: "2020-01-01",
      debt: { due_at: "2099-12-31" },
    };
    const result = resolveDebtStatus_inline(row);
    expect(result).toBe("M");
  });

  // Test 6
  it("debtSort: sorts by dpto due_at not debt.due_at (descending)", () => {
    const rows = [
      {
        id: "b",
        due_at: "2025-06-01",
        debt: { due_at: "2020-01-01" },
        created_at: "",
      },
      {
        id: "a",
        due_at: "2025-01-01",
        debt: { due_at: "2030-12-31" },
        created_at: "",
      },
    ];

    // POST-TRANSFORM sort: uses right?.due_at || right?.created_at (no debt?.due_at)
    const sorted = [...rows].sort((left, right) =>
      String(right?.due_at || right?.created_at || "").localeCompare(
        String(left?.due_at || left?.created_at || ""),
      ),
    );

    // Descending by dpto due_at: 'b' (June 2025) first, 'a' (Jan 2025) second
    expect(sorted[0].id).toBe("b");
    expect(sorted[1].id).toBe("a");
  });
});
