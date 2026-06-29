/**
 * S6.5 expenses.type — admin frontend expense type/method uses numeric PaymentMethod
 *
 * Consumers:
 *  - RenderForm (Outlays/RenderForm): paymentMethods select for create/edit expense
 *  - PerformBudget/RenderForm: paymentMethods select for budget execution
 *  - RenderView: getPaymentMethodText — display label for a numeric type value
 *
 * RED: fails while those files use hardcoded string ids ("T"/"O"/"Q"/"E"/"C").
 * GREEN: after replacing with FORM_PAYMENT_METHODS (numeric) and METHOD_MAP.
 */
import { describe, it, expect } from "vitest";
import {
  FORM_PAYMENT_METHODS,
  METHOD_MAP,
  PaymentMethod,
} from "@/modulos/Payments/Type/PaymentType";

// ---------------------------------------------------------------------------
// Guard: FORM_PAYMENT_METHODS must have all numeric ids (no legacy strings)
// ---------------------------------------------------------------------------
describe("Outlays expense type — FORM_PAYMENT_METHODS are numeric (S6.5)", () => {
  it("all option ids are numbers, not strings", () => {
    for (const option of FORM_PAYMENT_METHODS) {
      expect(typeof option.id).toBe("number");
    }
  });

  it("includes TRANSFER (1)", () => {
    const opt = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.TRANSFER);
    expect(opt).toBeDefined();
    expect(opt?.name).toBe("Transferencia bancaria");
  });

  it("includes OFFICE (2)", () => {
    const opt = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.OFFICE);
    expect(opt).toBeDefined();
    expect(opt?.name).toBe("Pago en oficina");
  });

  it("includes QR (3)", () => {
    const opt = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.QR);
    expect(opt).toBeDefined();
    expect(opt?.name).toBe("Pago QR");
  });

  it("includes CASH (4)", () => {
    const opt = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.CASH);
    expect(opt).toBeDefined();
    expect(opt?.name).toBe("Efectivo");
  });

  it("includes CHEQUE (5)", () => {
    const opt = FORM_PAYMENT_METHODS.find((o) => o.id === PaymentMethod.CHEQUE);
    expect(opt).toBeDefined();
    expect(opt?.name).toBe("Cheque");
  });

  it("does NOT include legacy string ids 'T', 'O', 'Q', 'E', 'C'", () => {
    const ids = FORM_PAYMENT_METHODS.map((o) => o.id);
    expect(ids).not.toContain("T");
    expect(ids).not.toContain("O");
    expect(ids).not.toContain("Q");
    expect(ids).not.toContain("E");
    expect(ids).not.toContain("C");
  });

  it("does NOT include an 'ALL' catch-all option (forms should not have it)", () => {
    const ids = FORM_PAYMENT_METHODS.map((o) => o.id);
    expect(ids).not.toContain("ALL");
  });
});

// ---------------------------------------------------------------------------
// Guard: METHOD_MAP maps numeric keys to display strings (RenderView consumer)
// ---------------------------------------------------------------------------
describe("Outlays expense type — METHOD_MAP resolves numeric type to label (S6.5)", () => {
  it("numeric 1 (TRANSFER) → 'Transferencia bancaria'", () => {
    expect(METHOD_MAP[PaymentMethod.TRANSFER]).toBe("Transferencia bancaria");
  });

  it("numeric 2 (OFFICE) → 'Pago en oficina'", () => {
    expect(METHOD_MAP[PaymentMethod.OFFICE]).toBe("Pago en oficina");
  });

  it("numeric 3 (QR) → 'Pago QR'", () => {
    expect(METHOD_MAP[PaymentMethod.QR]).toBe("Pago QR");
  });

  it("numeric 4 (CASH) → 'Efectivo'", () => {
    expect(METHOD_MAP[PaymentMethod.CASH]).toBe("Efectivo");
  });

  it("numeric 5 (CHEQUE) → 'Cheque'", () => {
    expect(METHOD_MAP[PaymentMethod.CHEQUE]).toBe("Cheque");
  });

  it("unknown numeric falls back to undefined (caller handles gracefully)", () => {
    expect(METHOD_MAP[99]).toBeUndefined();
  });

  it("legacy string 'T' does NOT resolve (stale-code guard)", () => {
    expect(METHOD_MAP["T"]).toBeUndefined();
  });

  it("legacy string 'E' does NOT resolve (stale-code guard)", () => {
    expect(METHOD_MAP["E"]).toBeUndefined();
  });
});
