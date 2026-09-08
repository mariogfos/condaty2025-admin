import { describe, expect, it } from "vitest";
import { getFirstAccessibleMenuRoute } from "@/components/MainMenu/mainMenuConfig";

describe("getFirstAccessibleMenuRoute", () => {
  it("returns the first visible module when Home is not available", () => {
    const allowed = new Set(["guards", "alerts"]);

    expect(
      getFirstAccessibleMenuRoute((permission) => allowed.has(permission)),
    ).toBe("/guards");
  });

  it("respects the same order shown in the sidebar", () => {
    const allowed = new Set(["owners", "guards"]);

    expect(
      getFirstAccessibleMenuRoute((permission) => allowed.has(permission)),
    ).toBe("/owners");
  });

  it("returns null when the administrator has no visible module", () => {
    expect(getFirstAccessibleMenuRoute(() => false)).toBeNull();
  });
});
