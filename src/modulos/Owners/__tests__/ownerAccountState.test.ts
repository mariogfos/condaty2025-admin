import { describe, expect, it } from "vitest";
import {
  getOwnerOperationalStatus,
  isPendingOwner,
  isRecoverablePendingAccount,
} from "../ownerAccountState";

describe("estado operativo de residentes", () => {
  it("mantiene pendiente una cuenta global W aunque el vínculo ya esté activo", () => {
    const owner = { account_status: "W", membership_status: "A" };

    expect(getOwnerOperationalStatus(owner)).toBe("W");
    expect(isPendingOwner(owner)).toBe(true);
    expect(isRecoverablePendingAccount(owner)).toBe(true);
  });

  it("mantiene pendiente un preregistro cuyo vínculo todavía está W", () => {
    const owner = { account_status: "A", membership_status: "W" };

    expect(getOwnerOperationalStatus(owner)).toBe("W");
    expect(isRecoverablePendingAccount(owner)).toBe(false);
  });

  it("considera activa la cuenta cuando ambos estados permiten acceso", () => {
    const owner = { account_status: "A", membership_status: "A" };

    expect(getOwnerOperationalStatus(owner)).toBe("A");
    expect(isPendingOwner(owner)).toBe(false);
  });
});
