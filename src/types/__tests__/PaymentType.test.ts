import { describe, it, expect } from "vitest";
import {
  DebtStatus,
  DEBT_STATUS_MAP,
  getDebtStatusConfig,
} from "../PaymentType";

describe("DebtStatus enum — numeric values 1–10", () => {
  it("covers existing cases 1–8 with correct numeric values", () => {
    expect(DebtStatus.PENDING).toBe(1);
    expect(DebtStatus.OVERDUE).toBe(2);
    expect(DebtStatus.PARTIAL).toBe(3);
    expect(DebtStatus.SUBMITTED).toBe(4);
    expect(DebtStatus.PAID).toBe(5);
    expect(DebtStatus.FORGIVEN).toBe(6);
    expect(DebtStatus.WORKFLOW_PENDING).toBe(7);
    expect(DebtStatus.CANCELLED).toBe(8);
  });

  it("has AWAITING_VOUCHER = 9", () => {
    expect(DebtStatus.AWAITING_VOUCHER).toBe(9);
  });

  it("has REJECTED = 10", () => {
    expect(DebtStatus.REJECTED).toBe(10);
  });
});

describe("DEBT_STATUS_MAP entries for new cases", () => {
  it("has a map entry for AWAITING_VOUCHER (9) with a label and colors", () => {
    const entry = DEBT_STATUS_MAP[9];
    expect(entry).toBeDefined();
    expect(typeof entry.label).toBe("string");
    expect(entry.label.length).toBeGreaterThan(0);
    expect(typeof entry.color).toBe("string");
    expect(typeof entry.backgroundColor).toBe("string");
  });

  it("has a map entry for REJECTED (10) with a label and colors", () => {
    const entry = DEBT_STATUS_MAP[10];
    expect(entry).toBeDefined();
    expect(typeof entry.label).toBe("string");
    expect(entry.label.length).toBeGreaterThan(0);
    expect(typeof entry.color).toBe("string");
    expect(typeof entry.backgroundColor).toBe("string");
  });
});

describe("getDebtStatusConfig — numeric lookup", () => {
  it("returns config for AWAITING_VOUCHER (9), not 'Desconocido'", () => {
    const config = getDebtStatusConfig(9);
    expect(config.label).not.toBe("Desconocido");
  });

  it("returns config for REJECTED (10), not 'Desconocido'", () => {
    const config = getDebtStatusConfig(10);
    expect(config.label).not.toBe("Desconocido");
  });

  it("returns Desconocido fallback for unknown status 99", () => {
    const config = getDebtStatusConfig(99);
    expect(config.label).toBe("Desconocido");
  });
});
