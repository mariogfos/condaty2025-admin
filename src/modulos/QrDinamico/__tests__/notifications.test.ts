import { describe, expect, it, vi } from "vitest";
import { paymentNotifications } from "../notifications";

const run = (payload: any) => {
  const showToast = vi.fn();
  const dispatch = vi.fn();
  paymentNotifications.events["admins"]({
    notif: { event: "admins", payload },
    payload,
    showToast,
    dispatch,
  });
  return { showToast, dispatch };
};

describe("paymentNotifications (DES-29)", () => {
  it("un pago QR confirmado muestra el aviso y dispara payment:confirmed", () => {
    const { showToast, dispatch } = run({
      act: "confirmPayment",
      id: 4242,
      user_id: "owner-1",
    });
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith("payment:confirmed", {
      paymentId: 4242,
      ownerId: "owner-1",
    });
  });

  it("otros avisos del canal admins no producen toast ni evento", () => {
    const { showToast, dispatch } = run({ act: "newVoucher", id: 1 });
    expect(showToast).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
