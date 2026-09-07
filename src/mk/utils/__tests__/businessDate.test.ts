import { describe, expect, it } from "vitest";
import { formatBusinessDateTime, getBusinessDate } from "../date";

describe("businessDate", () => {
  it("usa el día calendario de Bolivia antes de medianoche local", () => {
    const instant = new Date("2026-09-01T02:30:00.000Z");

    expect(getBusinessDate(instant)).toBe("2026-08-31");
  });

  it("cambia de día a medianoche de Bolivia", () => {
    const instant = new Date("2026-09-01T04:00:00.000Z");

    expect(getBusinessDate(instant)).toBe("2026-09-01");
  });

  it("muestra los instantes UTC con fecha y hora de Bolivia", () => {
    expect(formatBusinessDateTime("2026-09-01T02:30:00.000000Z")).toBe(
      "31/08/2026, 22:30",
    );
    expect(formatBusinessDateTime("2026-09-01 02:30:00")).toBe(
      "31/08/2026, 22:30",
    );
  });
});
