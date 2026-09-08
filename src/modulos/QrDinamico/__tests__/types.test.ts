import { describe, expect, it } from "vitest";
import {
  PAYMENT_TYPE_LABEL,
  PaymentType,
  QR_STATE_COLOR,
  QR_STATE_LABEL,
  QrOrderState,
} from "../types";

describe("QrOrderState (espejo del backend)", () => {
  // El enum viejo tenía 3 valores con el 3 = Anulado. El backend nuevo usa
  // 3 = Reemplazado y 5 = Anulado: si alguien revierte esto, un QR
  // reemplazado se mostraría como "Anulado" en todo el admin.
  it("usa la numeración del backend: 1..5 con REPLACED=3 y CANCELLED=5", () => {
    expect(QrOrderState.PENDING).toBe(1);
    expect(QrOrderState.PAID).toBe(2);
    expect(QrOrderState.REPLACED).toBe(3);
    expect(QrOrderState.EXPIRED).toBe(4);
    expect(QrOrderState.CANCELLED).toBe(5);
  });

  it("cada estado tiene etiqueta y color", () => {
    const states = [1, 2, 3, 4, 5] as QrOrderState[];
    for (const s of states) {
      expect(QR_STATE_LABEL[s]).toBeTruthy();
      expect(QR_STATE_COLOR[s]).toBeTruthy();
    }
    expect(QR_STATE_LABEL[QrOrderState.REPLACED]).toBe("Reemplazado");
    expect(QR_STATE_LABEL[QrOrderState.CANCELLED]).toBe("Anulado");
  });
});

describe("PaymentType (espejo del backend)", () => {
  it("incluye 'O' (otras deudas) con su etiqueta", () => {
    expect(PaymentType.OTHER).toBe("O");
    expect(PAYMENT_TYPE_LABEL[PaymentType.OTHER]).toBe("Otras deudas");
  });
});
