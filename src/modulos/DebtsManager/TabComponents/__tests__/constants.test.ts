import { describe, it, expect } from "vitest";
import { DebtStatus, DebtType } from "@/types/PaymentType";

// These imports will fail (RED) until constants.ts is migrated to numeric.
import {
  getStatusText,
  getStatusConfig,
  getAvailableActions,
  getBalanceTitle,
  DEFAULT_VALUES,
  STATUS_FILTER_OPTIONS,
} from "../constants";

// ---------------------------------------------------------------------------
// getStatusText — numeric keys
// ---------------------------------------------------------------------------

describe("getStatusText — numeric DebtStatus", () => {
  it("returns correct label for PENDING (1)", () => {
    expect(getStatusText(DebtStatus.PENDING)).toBe("Por cobrar");
  });

  it("returns correct label for OVERDUE (2)", () => {
    expect(getStatusText(DebtStatus.OVERDUE)).toBe("En mora");
  });

  it("returns correct label for PARTIAL (3)", () => {
    expect(getStatusText(DebtStatus.PARTIAL)).toBe("Pago parcial");
  });

  it("returns correct label for SUBMITTED (4)", () => {
    expect(getStatusText(DebtStatus.SUBMITTED)).toBe("Por confirmar");
  });

  it("returns correct label for PAID (5)", () => {
    expect(getStatusText(DebtStatus.PAID)).toBe("Cobrado");
  });

  it("returns correct label for FORGIVEN (6)", () => {
    expect(getStatusText(DebtStatus.FORGIVEN)).toBe("Condonada");
  });

  it("returns correct label for WORKFLOW_PENDING (7)", () => {
    expect(getStatusText(DebtStatus.WORKFLOW_PENDING)).toBe("En flujo externo");
  });

  it("returns correct label for CANCELLED (8)", () => {
    expect(getStatusText(DebtStatus.CANCELLED)).toBe("Anulada");
  });

  it("returns correct label for AWAITING_VOUCHER (9)", () => {
    expect(getStatusText(DebtStatus.AWAITING_VOUCHER)).toBe("Por subir comprobante");
  });

  it("returns correct label for REJECTED (10)", () => {
    expect(getStatusText(DebtStatus.REJECTED)).toBe("Rechazado");
  });

  it("falls back gracefully for unknown numeric status", () => {
    const result = getStatusText(99 as any);
    expect(typeof result).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// getStatusConfig — numeric keys + overdue rule
// ---------------------------------------------------------------------------

describe("getStatusConfig — numeric DebtStatus + overdue rule", () => {
  it("returns config for PAID (5)", () => {
    const { color, bgColor } = getStatusConfig(DebtStatus.PAID);
    expect(color).toBeTruthy();
    expect(bgColor).toBeTruthy();
  });

  it("overdue rule: PENDING + past dueDate => returns OVERDUE config", () => {
    const pendingConfig = getStatusConfig(DebtStatus.PENDING, "2099-12-31");
    const overdueConfig = getStatusConfig(DebtStatus.OVERDUE);
    const overdueViaRule = getStatusConfig(DebtStatus.PENDING, "2020-01-01");

    // Colors should differ: PENDING without past date vs OVERDUE config
    expect(overdueViaRule.color).toBe(overdueConfig.color);
    expect(overdueViaRule.bgColor).toBe(overdueConfig.bgColor);
    // PENDING with future date should NOT produce OVERDUE
    expect(pendingConfig.color).not.toBe(overdueConfig.color);
  });

  it("non-PENDING + past dueDate stays unchanged", () => {
    const paidConfig = getStatusConfig(DebtStatus.PAID, "2020-01-01");
    const paidDirectConfig = getStatusConfig(DebtStatus.PAID);
    expect(paidConfig.color).toBe(paidDirectConfig.color);
  });

  it("returns config for AWAITING_VOUCHER (9)", () => {
    const { color, bgColor } = getStatusConfig(DebtStatus.AWAITING_VOUCHER);
    expect(color).toBeTruthy();
    expect(bgColor).toBeTruthy();
  });

  it("returns config for REJECTED (10)", () => {
    const { color, bgColor } = getStatusConfig(DebtStatus.REJECTED);
    expect(color).toBeTruthy();
    expect(bgColor).toBeTruthy();
  });

  it("returns a fallback config for unknown status", () => {
    const { color, bgColor } = getStatusConfig(99 as any);
    expect(color).toBeTruthy();
    expect(bgColor).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// getAvailableActions — numeric DebtStatus (business logic parity)
// ---------------------------------------------------------------------------

describe("getAvailableActions — numeric DebtStatus", () => {
  // type=0 (individual) — full switch
  it("PAID (5) + NORMAL: showVerPago=true, showRegistrarPago=false, showAnular=false", () => {
    const a = getAvailableActions(DebtStatus.PAID, DebtType.NORMAL);
    expect(a.showVerPago).toBe(true);
    expect(a.showRegistrarPago).toBe(false);
    expect(a.showAnular).toBe(false);
    expect(a.showEditar).toBe(false);
  });

  it("PARTIAL (3) + NORMAL: showVerPago=true, showRegistrarPago=false", () => {
    const a = getAvailableActions(DebtStatus.PARTIAL, DebtType.NORMAL);
    expect(a.showVerPago).toBe(true);
    expect(a.showRegistrarPago).toBe(false);
  });

  it("FORGIVEN (6) + NORMAL: no payments, no actions", () => {
    const a = getAvailableActions(DebtStatus.FORGIVEN, DebtType.NORMAL);
    expect(a.showVerPago).toBe(false);
    expect(a.showRegistrarPago).toBe(false);
    expect(a.showAnular).toBe(false);
    expect(a.showEditar).toBe(false);
  });

  it("PENDING (1) + NORMAL: showAnular=true, showEditar=true, showRegistrarPago=true", () => {
    const a = getAvailableActions(DebtStatus.PENDING, DebtType.NORMAL);
    expect(a.showAnular).toBe(true);
    expect(a.showEditar).toBe(true);
    expect(a.showRegistrarPago).toBe(true);
    expect(a.showVerPago).toBe(false);
  });

  it("OVERDUE (2) + NORMAL: same as PENDING (showAnular=true)", () => {
    const a = getAvailableActions(DebtStatus.OVERDUE, DebtType.NORMAL);
    expect(a.showAnular).toBe(true);
    expect(a.showEditar).toBe(true);
    expect(a.showRegistrarPago).toBe(true);
    expect(a.showVerPago).toBe(false);
  });

  // 🔴 CDT-89: una deuda anulada NO se cobra. Editar y Anular siguen
  // ofreciéndose — está fuera del alcance de CDT-89 y anotado para producto.
  it("CANCELLED (8) + NORMAL: showRegistrarPago=false (Editar y Anular siguen)", () => {
    const a = getAvailableActions(DebtStatus.CANCELLED, DebtType.NORMAL);
    expect(a.showRegistrarPago).toBe(false);
    expect(a.showVerPago).toBe(false);
    expect(a.showAnular).toBe(true);
    expect(a.showEditar).toBe(true);
  });

  it("CANCELLED (8) + EXPENSE: showRegistrarPago=false", () => {
    const a = getAvailableActions(DebtStatus.CANCELLED, DebtType.EXPENSE);
    expect(a.showRegistrarPago).toBe(false);
    expect(a.showVerPago).toBe(false);
  });

  // type != 0 — simplified rules
  it("PAID (5) + EXPENSE: showRegistrarPago=false, showVerPago=true", () => {
    const a = getAvailableActions(DebtStatus.PAID, DebtType.EXPENSE);
    expect(a.showRegistrarPago).toBe(false);
    expect(a.showVerPago).toBe(true);
    expect(a.showAnular).toBe(false);
  });

  it("PENDING (1) + EXPENSE: showRegistrarPago=true, showVerPago=false", () => {
    const a = getAvailableActions(DebtStatus.PENDING, DebtType.EXPENSE);
    expect(a.showRegistrarPago).toBe(true);
    expect(a.showVerPago).toBe(false);
  });

  it("FORGIVEN (6) + EXPENSE: showRegistrarPago=false", () => {
    const a = getAvailableActions(DebtStatus.FORGIVEN, DebtType.EXPENSE);
    expect(a.showRegistrarPago).toBe(false);
  });

  it("SUBMITTED (4) + EXPENSE: showRegistrarPago=false, showVerPago=true", () => {
    const a = getAvailableActions(DebtStatus.SUBMITTED, DebtType.EXPENSE);
    expect(a.showRegistrarPago).toBe(false);
    expect(a.showVerPago).toBe(true);
  });

  it("AWAITING_VOUCHER (9) + NORMAL: falls through default", () => {
    const a = getAvailableActions(DebtStatus.AWAITING_VOUCHER, DebtType.NORMAL);
    expect(a.showAnular).toBe(true);
    expect(a.showEditar).toBe(true);
    expect(a.showRegistrarPago).toBe(true);
  });

  it("REJECTED (10) + NORMAL: falls through default", () => {
    const a = getAvailableActions(DebtStatus.REJECTED, DebtType.NORMAL);
    expect(a.showAnular).toBe(true);
  });

  it("WORKFLOW_PENDING (7) + NORMAL: falls through default", () => {
    const a = getAvailableActions(DebtStatus.WORKFLOW_PENDING, DebtType.NORMAL);
    expect(a.showAnular).toBe(true);
    expect(a.showEditar).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getBalanceTitle — numeric DebtStatus
// ---------------------------------------------------------------------------

describe("getBalanceTitle — numeric DebtStatus", () => {
  it("PAID (5): Saldo cobrado", () => {
    expect(getBalanceTitle(DebtStatus.PAID)).toBe("Saldo cobrado");
  });

  it("OVERDUE (2): Saldo a cobrar", () => {
    expect(getBalanceTitle(DebtStatus.OVERDUE)).toBe("Saldo a cobrar");
  });

  it("PENDING (1): Saldo a cobrar", () => {
    expect(getBalanceTitle(DebtStatus.PENDING)).toBe("Saldo a cobrar");
  });

  it("unknown status: falls back to Saldo a cobrar", () => {
    expect(getBalanceTitle(99 as any)).toBe("Saldo a cobrar");
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_VALUES.STATUS — now numeric PENDING
// ---------------------------------------------------------------------------

describe("DEFAULT_VALUES.STATUS", () => {
  it("STATUS default is DebtStatus.PENDING (1)", () => {
    expect(DEFAULT_VALUES.STATUS).toBe(DebtStatus.PENDING);
  });
});

// ---------------------------------------------------------------------------
// STATUS_FILTER_OPTIONS — numeric ids
// ---------------------------------------------------------------------------

describe("STATUS_FILTER_OPTIONS — numeric ids", () => {
  it("all option ids are numbers", () => {
    for (const opt of STATUS_FILTER_OPTIONS) {
      expect(typeof opt.id).toBe("number");
    }
  });

  it("includes PENDING (1) and PAID (5) entries", () => {
    const ids = STATUS_FILTER_OPTIONS.map((o) => o.id);
    expect(ids).toContain(DebtStatus.PENDING);
    expect(ids).toContain(DebtStatus.PAID);
  });

  it("includes AWAITING_VOUCHER (9) and REJECTED (10)", () => {
    const ids = STATUS_FILTER_OPTIONS.map((o) => o.id);
    expect(ids).toContain(DebtStatus.AWAITING_VOUCHER);
    expect(ids).toContain(DebtStatus.REJECTED);
  });
});
