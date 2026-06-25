/**
 * Characterization tests for reportPresets helpers — S6 HU-3 Slice D
 *
 * getPaymentPeriodOrConceptValues is not exported; we inline the relevant logic
 * (getDebtPeriodLabel + the transformed call site) to lock the behaviour
 * introduced in this commit.
 */

// ---------------------------------------------------------------------------
// Inline: MONTH_NAMES (copied from reportPresets.ts)
// ---------------------------------------------------------------------------
const MONTH_NAMES: Record<number, string> = {
  1: "Ene",
  2: "Feb",
  3: "Mar",
  4: "Abr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Ago",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dic",
};

// ---------------------------------------------------------------------------
// Inline: getDebtPeriodLabel (copied verbatim from reportPresets.ts ~line 171)
// ---------------------------------------------------------------------------
const getDebtPeriodLabel = (
  debt: Record<string, any> | null | undefined,
): string => {
  if (!debt) return "";

  const rawMonth = Number(
    debt?.month ?? debt?.mes ?? debt?.period ?? debt?.periodo ?? 0,
  );
  const monthLabel =
    Number.isFinite(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? MONTH_NAMES[rawMonth]
      : String(
          debt?.month ?? debt?.mes ?? debt?.period ?? debt?.periodo ?? "",
        ).trim();
  const yearLabel = String(
    debt?.year ?? debt?.anio ?? debt?.yr ?? debt?.y ?? "",
  ).trim();

  return [monthLabel, yearLabel].filter(Boolean).join(" ").trim();
};

// ---------------------------------------------------------------------------
// Inline: transformed call-site helper (after-transform version of line ~192)
//
// BEFORE: getDebtPeriodLabel(detail?.debt_dpto?.debt)
// AFTER:  getDebtPeriodLabel(detail?.debt_dpto) || getDebtPeriodLabel(detail?.debt_dpto?.shared)
// ---------------------------------------------------------------------------
const getDebtPeriodLabelForDpto = (debtDpto: any): string =>
  getDebtPeriodLabel(debtDpto) ||
  getDebtPeriodLabel(debtDpto?.shared);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getDebtPeriodLabel — unit characterization", () => {
  it("returns empty string for null argument", () => {
    expect(getDebtPeriodLabel(null)).toBe("");
  });

  it("returns empty string for undefined argument", () => {
    expect(getDebtPeriodLabel(undefined)).toBe("");
  });

  it("formats a known month + year correctly", () => {
    const result = getDebtPeriodLabel({ month: 4, year: 2025 });
    expect(result).toContain("Abr");
    expect(result).toContain("2025");
  });

  it("returns empty string when month and year keys are absent (undefined)", () => {
    // All chain members resolve to undefined → rawMonth = Number(0) = 0 → outside 1-12
    // monthLabel = String("").trim() = ""
    // yearLabel  = String("").trim() = ""
    // filter(Boolean) → [] → join = ""
    expect(getDebtPeriodLabel({})).toBe("");
  });
});

describe("getDebtPeriodLabelForDpto — EXPENSE rows read period from dpto-level fields", () => {
  /**
   * Test A — EXPENSE: dpto has valid month/year; debt head has different values.
   * After transform, getDebtPeriodLabel(debt_dpto) is called first, so it must
   * return the dpto-level period, NOT the head values.
   */
  it("reads period from dpto-level fields, ignoring any nested debt head", () => {
    const debtDpto = {
      month: 4,
      year: 2025,
      // stale head values — must NOT be used
      debt: { month: 99, year: 9999 },
      shared: null,
    };

    const result = getDebtPeriodLabelForDpto(debtDpto);

    expect(result).toContain("Abr");
    expect(result).toContain("2025");
    expect(result).not.toContain("99");
    expect(result).not.toContain("9999");
  });
});

describe("getDebtPeriodLabelForDpto — SHARED rows fall back to shared when dpto has no period", () => {
  /**
   * Test B — SHARED: dpto-level month/year are null (the REAL API shape).
   *
   * SHARED debt_dpto rows link via shared_id and were never backfilled with
   * period (HU-2 joined on debt_id only), so the smallint nullable columns
   * serialize as `null`, not absent. getDebtPeriodLabel collapses null through
   * the `?? ""` chain and filter(Boolean) → returns "" (falsy), so the `||`
   * correctly picks the shared head. The code is robust to null AND absent.
   */
  it("falls back to shared when dpto month/year are null (real API shape)", () => {
    const debtDpto = {
      month: null,
      year: null,
      shared: { month: 9, year: 2023 },
    };

    const result = getDebtPeriodLabelForDpto(debtDpto);

    expect(result).toContain("Sep");
    expect(result).toContain("2023");
  });

  it("falls back to shared when dpto has no month/year keys (absent)", () => {
    const debtDpto = {
      // month and year intentionally absent (undefined)
      shared: { month: 9, year: 2023 },
    };

    const result = getDebtPeriodLabelForDpto(debtDpto);

    expect(result).toContain("Sep");
    expect(result).toContain("2023");
  });

  it("returns empty string when both dpto and shared have no period keys", () => {
    const debtDpto = {
      shared: {},
    };

    expect(getDebtPeriodLabelForDpto(debtDpto)).toBe("");
  });

  it("returns empty string when debtDpto itself is undefined", () => {
    expect(getDebtPeriodLabelForDpto(undefined)).toBe("");
  });
});

describe("fallbackConcept description — reads from dpto-level (not head)", () => {
  /**
   * Test C — Description source after transform.
   *
   * The call site reads detail?.debt_dpto?.description (dpto-level field).
   * This was already correct before the transform (not .debt.description).
   * We lock this behaviour: when no period or reservation title is present,
   * the description comes from debt_dpto, not from any nested head.
   *
   * We inline the fallbackConcept resolution logic as it appears in
   * getPaymentPeriodOrConceptValues after the transform.
   */
  it("uses debt_dpto.description as fallback concept, not any nested head description", () => {
    const detail = {
      debt_dpto: {
        // No month/year → getDebtPeriodLabelForDpto returns ""
        // No reservation
        description: "Expensas comunes dpto-level",
        debt: {
          description: "Head description — must NOT be used",
        },
      },
      subcategory: null,
    };

    // Reproduce the call-site logic from getPaymentPeriodOrConceptValues:
    const debtPeriod = getDebtPeriodLabelForDpto(detail?.debt_dpto);
    const reservationTitle =
      detail?.debt_dpto?.reservation?.area?.title ||
      detail?.debt_dpto?.reservation?.area?.name ||
      detail?.debt_dpto?.penaltyReservation?.area?.title ||
      detail?.debt_dpto?.penaltyReservation?.area?.name;

    const fallbackConcept =
      (!debtPeriod && !reservationTitle && detail?.debt_dpto?.description) ||
      detail?.subcategory?.name;

    expect(fallbackConcept).toBe("Expensas comunes dpto-level");
    expect(fallbackConcept).not.toBe("Head description — must NOT be used");
  });
});
