import { describe, expect, it } from "vitest";
import {
  firstCountOrZero,
  getUnitTotalCount,
  getUnitTypeCounts,
  toCount,
} from "../dashboardCounts";

describe("dashboardCounts", () => {
  it("keeps the first real unit type instead of skipping by index", () => {
    const counts = getUnitTypeCounts({
      Casa: 10,
      Departamento: 5,
    });

    expect(counts).toEqual([
      { id: "Casa", name: "Casa", value: 10 },
      { id: "Departamento", name: "Departamento", value: 5 },
    ]);
    expect(getUnitTotalCount({ Casa: 10, Departamento: 5 })).toBe(15);
  });

  it("uses explicit aggregate totals without rendering them as unit types", () => {
    const summary = {
      total: "20",
      Casa: "8",
      Departamento: "12",
    };

    expect(getUnitTypeCounts(summary)).toEqual([
      { id: "Casa", name: "Casa", value: 8 },
      { id: "Departamento", name: "Departamento", value: 12 },
    ]);
    expect(getUnitTotalCount(summary)).toBe(20);
  });

  it("falls back when the units summary is unavailable", () => {
    expect(getUnitTotalCount(undefined, "7")).toBe(7);
  });

  it("normalizes count values safely", () => {
    expect(toCount(["a", "b"])).toBe(2);
    expect(toCount({ count: "3" })).toBe(3);
    expect(toCount("not-a-number")).toBe(0);
  });

  it("uses the first valid count fallback", () => {
    expect(firstCountOrZero(undefined, "", "bad", "4")).toBe(4);
    expect(firstCountOrZero(undefined, null)).toBe(0);
  });
});
