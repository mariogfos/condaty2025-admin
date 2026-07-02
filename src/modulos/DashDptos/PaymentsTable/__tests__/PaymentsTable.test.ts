/**
 * S-D: PaymentsTable — numeric PaymentStatus + PaymentMethod mapping
 *
 * RED: these tests fail while PaymentsTable still imports stale @/types/payment
 * (string-keyed PAYMENT_STATUS_MAP) and uses string method map ('T'/'E'/'C'/'Q'/'O').
 *
 * GREEN: after repointing to @/modulos/Payments/Type/PaymentType numeric enums.
 */
import { describe, it, expect } from "vitest";
import {
  getPaymentStatusConfig,
  METHOD_MAP,
  PaymentStatus,
  PaymentMethod,
} from "@/modulos/Payments/Type/PaymentType";

describe("PaymentsTable — numeric PaymentStatus (S-D)", () => {
  it("status 1 (SUBMITTED) resolves to 'Por confirmar'", () => {
    const info = getPaymentStatusConfig(PaymentStatus.SUBMITTED);
    expect(info.label).toBe("Por confirmar");
  });

  it("status 2 (PAID) resolves to 'Confirmado'", () => {
    const info = getPaymentStatusConfig(PaymentStatus.PAID);
    expect(info.label).toBe("Confirmado");
  });

  it("status 3 (REJECTED) resolves to 'Rechazado'", () => {
    const info = getPaymentStatusConfig(PaymentStatus.REJECTED);
    expect(info.label).toBe("Rechazado");
  });

  it("status 4 (CANCELLED) resolves to 'Anulado'", () => {
    const info = getPaymentStatusConfig(PaymentStatus.CANCELLED);
    expect(info.label).toBe("Anulado");
  });

  it("unknown status returns fallback, not a letter code", () => {
    const info = getPaymentStatusConfig(99 as any);
    expect(info.label).toBe("Desconocido");
  });
});

describe("PaymentsTable — numeric PaymentMethod map (S-D)", () => {
  it("method 1 (TRANSFER) resolves to 'Transferencia bancaria'", () => {
    expect(METHOD_MAP[PaymentMethod.TRANSFER]).toBe("Transferencia bancaria");
  });

  it("method 2 (OFFICE) resolves to 'Pago en oficina'", () => {
    expect(METHOD_MAP[PaymentMethod.OFFICE]).toBe("Pago en oficina");
  });

  it("method 3 (QR) resolves to 'Pago QR'", () => {
    expect(METHOD_MAP[PaymentMethod.QR]).toBe("Pago QR");
  });

  it("method 4 (CASH) resolves to 'Efectivo'", () => {
    expect(METHOD_MAP[PaymentMethod.CASH]).toBe("Efectivo");
  });

  it("method 5 (CHEQUE) resolves to 'Cheque'", () => {
    expect(METHOD_MAP[PaymentMethod.CHEQUE]).toBe("Cheque");
  });

  it("string legacy 'T' does NOT resolve (guard: old string map is gone)", () => {
    expect(METHOD_MAP["T"]).toBeUndefined();
  });
});
