/**
 * S-D: payments.config.tsx — form method select options must use numeric PaymentMethod ids
 *
 * RED: fails while the form select uses string ids ('T'/'E'/'C').
 * GREEN: after replacing with FORM_PAYMENT_METHODS (numeric PaymentMethod ids).
 */
import { describe, it, expect } from "vitest";
import {
  FORM_PAYMENT_METHODS,
  METHOD_MAP,
  PaymentMethod,
} from "@/modulos/Payments/Type/PaymentType";

describe("payments.config — FORM_PAYMENT_METHODS are numeric (S-D)", () => {
  it("all form method option ids are numbers, not strings", () => {
    for (const option of FORM_PAYMENT_METHODS) {
      expect(typeof option.id).toBe("number");
    }
  });

  it("includes TRANSFER (1) as a form option", () => {
    const option = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.TRANSFER);
    expect(option).toBeDefined();
    expect(option?.name).toBe("Transferencia bancaria");
  });

  it("includes CASH (4) as a form option", () => {
    const option = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.CASH);
    expect(option).toBeDefined();
    expect(option?.name).toBe("Efectivo");
  });

  it("includes CHEQUE (5) as a form option", () => {
    const option = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.CHEQUE);
    expect(option).toBeDefined();
    expect(option?.name).toBe("Cheque");
  });

  it("includes QR (3) as a form option", () => {
    const option = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.QR);
    expect(option).toBeDefined();
    expect(option?.name).toBe("Pago QR");
  });

  it("includes OFFICE (2) as a form option", () => {
    const option = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.OFFICE);
    expect(option).toBeDefined();
    expect(option?.name).toBe("Pago en oficina");
  });

  it("does NOT have string ids 'T', 'E', 'C' (old legacy codes)", () => {
    const ids = FORM_PAYMENT_METHODS.map((o) => o.id);
    expect(ids).not.toContain("T");
    expect(ids).not.toContain("E");
    expect(ids).not.toContain("C");
  });
});

describe("payments.config — renderMethodCell uses numeric METHOD_MAP (S-D)", () => {
  it("method 1 (TRANSFER) resolves to 'Transferencia bancaria'", () => {
    expect(METHOD_MAP[PaymentMethod.TRANSFER]).toBe("Transferencia bancaria");
  });

  it("method 4 (CASH) resolves to 'Efectivo'", () => {
    expect(METHOD_MAP[PaymentMethod.CASH]).toBe("Efectivo");
  });

  it("method 5 (CHEQUE) resolves to 'Cheque'", () => {
    expect(METHOD_MAP[PaymentMethod.CHEQUE]).toBe("Cheque");
  });

  it("string 'T' does NOT resolve (stale code guard)", () => {
    expect(METHOD_MAP["T"]).toBeUndefined();
  });
});
