import { describe, expect, it } from "vitest";
import { getCurrentMonthRange, getDefaultReportRange } from "../reportCatalog";
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

  it("exposes a single sidebar entry only when at least one report can be read", () => {
    const entry = menuConfig.find((item) => item.type === "item" && item.href === "/reports");
    expect(entry?.type).toBe("item");
    if (!entry || entry.type !== "item") throw new Error("Missing reports entry");
    expect(isMenuItemVisible(entry, () => false)).toBe(false);
    expect(isMenuItemVisible(entry, (permission, action) => permission === "accesses" && action === "R")).toBe(true);
    expect(isMenuItemVisible(entry, (permission) => permission === "payments")).toBe(true);
    expect(isMenuItemVisible(entry, (permission) => permission === "owners")).toBe(false);
  });
});
