import { describe, expect, it } from "vitest";
import { canRegisterReservationPayment } from "../utils/reservationStatus";

describe("canRegisterReservationPayment", () => {
  it("allows registering a payment only for a pending reservation with its debt", () => {
    expect(canRegisterReservationPayment("A", 42)).toBe(true);
  });

  it("does not allow payment registration for other statuses or without a debt", () => {
    expect(canRegisterReservationPayment("Q", 42)).toBe(false);
    expect(canRegisterReservationPayment("A", null)).toBe(false);
  });
});
