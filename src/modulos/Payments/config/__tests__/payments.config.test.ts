/**
 * S-D: payments.config.tsx — form method select options must use numeric PaymentMethod ids
 *      + S37.5: mod.exportAsync slot para migrar al flow async XLSX
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
import { getPaymentsConfig } from "@/modulos/Payments/config/payments.config";

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

describe("payments.config — mod.exportAsync slot (S37.5)", () => {
  // S37.5: pinea el slot exportAsync (S36.5) en payments.config.tsx para
  // migrar al flow async XLSX (S32 + S37 PaymentsReportType). El viewer
  // reportPreset sigue disponible BC para preview + PDF.

  it("pinea mod.exportAsync.type = 'payments' (matchea ReportTypeRegistry)", () => {
    const { mod } = getPaymentsConfig("text-overflow", "text-right", "text-center");
    expect(mod.exportAsync).toBeDefined();
    expect(mod.exportAsync?.type).toBe("payments");
  });

  it("pinea mod.exportAsync.format = 'excel' (ExcelGenerator path, S37)", () => {
    const { mod } = getPaymentsConfig("text-overflow", "text-right", "text-center");
    expect(mod.exportAsync?.format).toBe("excel");
  });

  /**
   * El label dejó de nombrar un formato cuando el botón pasó a ser un menú.
   *
   * Con `supportedFormats` el usuario elige pdf / xlsx / csv (y los customs
   * del módulo) DENTRO del menú, así que "Exportar XLSX" mentía sobre lo que
   * hace el botón. Lo que importa no es el texto exacto sino que no vuelva a
   * prometer un formato único.
   */
  it("pinea un label de exportacion que no promete un formato unico", () => {
    const { mod } = getPaymentsConfig("text-overflow", "text-right", "text-center");
    expect(mod.exportAsync?.label).toBe("Exportar");
    expect(mod.exportAsync?.supportedFormats?.length).toBeGreaterThan(1);
  });

  it("mod.export = false → deshabilita IconExport legacy (override)", () => {
    // S36.5 D-36.5-3: si pinean AMBOS export: true Y exportAsync,
    // el async override el legacy. Pineando export: false dejamos
    // claro: solo async.
    const { mod } = getPaymentsConfig("text-overflow", "text-right", "text-center");
    expect(mod.export).toBe(false);
  });

  it("mantiene mod.reportPreset = 'payments-income' (viewer BC)", () => {
    // BC: el viewer sigue disponible para preview + PDF.
    const { mod } = getPaymentsConfig("text-overflow", "text-right", "text-center");
    expect(mod.reportPreset).toBe("payments-income");
  });
});
