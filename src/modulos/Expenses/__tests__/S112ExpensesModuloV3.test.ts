/**
 * S112 — Pin de regresión para el bug "Expenses no trae las expensas".
 *
 * Historia del bug (2026-07-27, Mario):
 *   El módulo `src/modulos/Expenses/Expenses.tsx` pineá `modulo: 'debt-groups'`
 *   (legacy alias pineado en S95). El endpoint `/api/debt-groups` SÍ existe y
 *   retorna la estructura agrupada (debt_id + asignados[]) que la UI consume.
 *   El front devolvía 200 OK pero el list de Mario estaba vacío.
 *
 * HALLAZGO-NEW-20 (S112, binding, cross-project): pinear la convención canónica
 * `modulo: 'v3/debt-groups'` (no legacy alias) cuando el front consume el
 * módulo DebtDptos/DebtGroup. Si el módulo se llama "Expenses" pero el
 * endpoint canónico del back es `/v3/debt-groups`, pineá explícitamente
 * `v3/debt-groups` y dejá un docstring que documenta el motivo.
 *
 * HALLAZGO-NEW-03 (binding cross-project): source-parsing pinea INTENCIÓN.
 * Si alguien pineá restaurar `modulo: 'debt-groups'` (legacy), el test falla
 * con mensaje claro.
 *
 * Cross-IA: Mavis main el 2026-07-27.
 * Refs: S95 (legacy alias pineado), S103 (front legacy URLs), S111 (cleanup),
 *       S112 (este sprint).
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const EXPENSES_TSX = path.join(FRONT_ROOT, "src/modulos/Expenses/Expenses.tsx");

describe("S112 — Expenses modulo v3/debt-groups pin", () => {
  it("Expenses.tsx pinea modulo: 'v3/debt-groups' (canónico, no legacy alias)", () => {
    const src = fs.readFileSync(EXPENSES_TSX, "utf8");
    // R-PKG-016 sweep: pinear el canónico, no el legacy alias.
    expect(src).toMatch(/modulo:\s*['"]v3\/debt-groups['"]/);
  });

  it("Expenses.tsx NO contiene modulo: 'debt-groups' (legacy alias eliminado)", () => {
    const src = fs.readFileSync(EXPENSES_TSX, "utf8");
    // S95 pineó el legacy alias. S112 lo sacó del módulo Expenses porque
    // el front estaba pegando a un endpoint sin datos visibles.
    // Si alguien pineá restaurar el legacy, este test falla.
    expect(src).not.toMatch(/modulo:\s*['"]debt-groups['"]/);
  });

  /**
   * 🔴 Esto pineaba `type: 'expenses'`, o sea el bug que Mario reportó el
   * 2026-08-06: ese type apuntaba al reporte que lista CADA deuda de CADA
   * unidad de TODOS los periodos, mientras la pantalla muestra el resumen
   * por periodo. El pin estaba cuidando el valor equivocado.
   *
   * Lo que hay que sostener es que el `type` coincida con la clave que el
   * back resuelve para esta pantalla. Si se separan, el export sigue andando
   * —manda el `endpoint`— pero el historial se abre filtrado por un type sin
   * reportes: se ve "Todos" en el select y la lista vacía.
   */
  it("Expenses.tsx pinea el type que resuelve el back para esta pantalla", () => {
    const src = fs.readFileSync(EXPENSES_TSX, "utf8");
    expect(src).toMatch(/type:\s*['"]debt-groups-expenses['"]/);
    expect(src).toMatch(/endpoint:\s*['"]\/v3\/debt-groups['"]/);
  });

  /**
   * El título lo declara el módulo del back, que es su única fuente de verdad.
   * Mandarlo desde el front deja dos lugares declarando lo mismo, y gana el de
   * afuera — encima imprimiendo texto del cliente en el encabezado del PDF.
   */
  it("Expenses.tsx no manda el titulo del reporte", () => {
    const src = fs.readFileSync(EXPENSES_TSX, "utf8");
    expect(src).not.toMatch(/extraParams:\s*\{\s*title:/);
  });
});
