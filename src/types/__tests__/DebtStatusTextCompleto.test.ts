import { describe, it, expect } from "vitest";
import { DebtStatus, DEBT_STATUS_TEXT, getDebtStatusText } from "@/types/PaymentType";

/**
 * 🔴 Ningún estado de deuda puede llegar al usuario como un número.
 *
 * Lo reportó Mario el 2026-08-07 mirando el detalle de un periodo de Expensas:
 * la columna Estado mostraba **un "3" pelado**. La causa era un `switch` con 5
 * de los 10 estados y un `default` que devolvía `String(item.status)`.
 * Medido en la base local: **257 expensas en PARTIAL**.
 *
 * ⚠️ Se recorre el enum entero, no una lista escrita a mano: una lista a mano
 * se olvida igual que se olvidó el `switch`.
 */
describe("DEBT_STATUS_TEXT", () => {
  const casos = Object.values(DebtStatus).filter(
    (v): v is DebtStatus => typeof v === "number",
  );

  it("le pone nombre a los diez estados", () => {
    expect(casos).toHaveLength(10);

    for (const estado of casos) {
      const texto = getDebtStatusText(estado);

      expect(texto, `${estado} sin etiqueta`).not.toBe("Desconocido");
      // 🔴 Ésta es la que veía Mario: el número crudo como texto.
      expect(texto, `${estado} sale como el número crudo`).not.toBe(String(estado));
      expect(texto.trim()).not.toBe("");
    }
  });

  it("el que rompía: PARTIAL se llama Pago parcial", () => {
    expect(getDebtStatusText(DebtStatus.PARTIAL)).toBe("Pago parcial");
  });

  it("un valor fuera del enum sí es un desconocido de verdad", () => {
    expect(getDebtStatusText(99)).toBe("Desconocido");
  });

  /**
   * ⚠️ Espejo del `DebtStatus::label()` del backend. Si las palabras se
   * separan, el PDF dice una cosa y la pantalla otra sobre la misma fila.
   * Estas seis son las que el usuario ve todos los días en Expensas.
   */
  it("las palabras son las mismas que las del reporte", () => {
    expect(DEBT_STATUS_TEXT[DebtStatus.PENDING]).toBe("Por cobrar");
    expect(DEBT_STATUS_TEXT[DebtStatus.OVERDUE]).toBe("En mora");
    expect(DEBT_STATUS_TEXT[DebtStatus.PARTIAL]).toBe("Pago parcial");
    expect(DEBT_STATUS_TEXT[DebtStatus.SUBMITTED]).toBe("Por confirmar");
    expect(DEBT_STATUS_TEXT[DebtStatus.PAID]).toBe("Cobrada");
    expect(DEBT_STATUS_TEXT[DebtStatus.FORGIVEN]).toBe("Condonada");
  });
});
