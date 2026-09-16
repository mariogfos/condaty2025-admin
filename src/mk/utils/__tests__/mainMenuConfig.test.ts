import { describe, expect, it } from "vitest";
import {
  getFirstAccessibleMenuRoute,
  isMenuItemVisible,
  menuConfig,
} from "@/components/MainMenu/mainMenuConfig";

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

  it("shows QR Dinámico and Log de Orange only to FOS admins", () => {
    const finance = menuConfig.find(
      (item) => item.type === "dropdown" && item.key === "Finanzas",
    );
    const fosOnlyItems = finance?.items.filter((item) => item.fosOnly) ?? [];
    const canReadPayments = (permission: string) => permission === "payments";

    expect(fosOnlyItems.map((item) => item.href)).toEqual([
      "/qr-dinamico",
      "/orange-logs",
    ]);
    expect(
      fosOnlyItems.every((item) =>
        isMenuItemVisible(item, canReadPayments, false),
      ),
    ).toBe(false);
    expect(
      fosOnlyItems.every((item) =>
        isMenuItemVisible(item, canReadPayments, true),
      ),
    ).toBe(true);
  });
});
