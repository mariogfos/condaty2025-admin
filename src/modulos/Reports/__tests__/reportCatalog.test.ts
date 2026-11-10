import { describe, expect, it } from "vitest";
import { getCurrentMonthRange, getDefaultReportRange, reportCatalog } from "../reportCatalog";
import { isMenuItemVisible, menuConfig } from "@/components/MainMenu/mainMenuConfig";

describe("report catalog", () => {
  it("opens accesses in the current Bolivian calendar month even across UTC midnight", () => {
    expect(getDefaultReportRange("accesses", new Date("2026-11-01T02:00:00Z"))).toEqual({
      startDate: "2026-10-01", endDate: "2026-10-31", allDates: false,
    });
    expect(getCurrentMonthRange(new Date("2028-02-10T12:00:00Z")).endDate).toBe("2028-02-29");
  });

  it("retains the year range for existing report links without explicit filters", () => {
    expect(getDefaultReportRange("unit-account-statement", new Date("2026-11-01T02:00:00Z"))).toEqual({
      startDate: "2026-01-01", endDate: "2026-10-31", allDates: false,
    });
  });

  it("opens accounts receivable with all due dates", () => {
    expect(getDefaultReportRange("accounts-receivable", new Date("2026-11-01T02:00:00Z"))).toEqual({
      startDate: "2026-01-01", endDate: "2026-10-31", allDates: true,
    });
  });

  it.each(["accounts-receivable-by-period", "accounts-receivable-by-unit", "overdue-expenses-by-unit"])(
    "opens %s in finance with all dates and debt permissions",
    (key) => {
      expect(reportCatalog.find((report) => report.key === key)).toMatchObject({
        category: "finance", permissions: ["debts_manager", "debts"],
      });
      expect(getDefaultReportRange(key).allDates).toBe(true);
    },
  );

  it("exposes a single sidebar entry only when at least one report can be read", () => {
    const entry = menuConfig.find((item) => item.type === "item" && item.href === "/reports");
    expect(entry?.type).toBe("item");
    if (!entry || entry.type !== "item") throw new Error("Missing reports entry");
    expect(isMenuItemVisible(entry, () => false)).toBe(false);
    expect(isMenuItemVisible(entry, (permission, action) => permission === "accesses" && action === "R")).toBe(true);
    expect(isMenuItemVisible(entry, (permission) => permission === "payments")).toBe(true);
    expect(isMenuItemVisible(entry, (permission, action) => permission === "debts_manager" && action === "R")).toBe(true);
    expect(isMenuItemVisible(entry, (permission, action) => permission === "debts" && action === "R")).toBe(true);
    expect(isMenuItemVisible(entry, (permission) => permission === "owners")).toBe(false);
  });
});
