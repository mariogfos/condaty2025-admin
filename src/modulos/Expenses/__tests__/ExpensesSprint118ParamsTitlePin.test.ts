/**
 * S118 front — Pin de regresión para el bug "Expenses.tsx no pinea title".
 *
 * Historia del bug (2026-07-27, Mario):
 *   Después de mergear S118a (fix doble render) y S118b back (split
 *   Expenses vs Outlays), el back `ExpensesReportType` pineá el title
 *   desde `$report->params['title']` con default "Reporte de Expensas".
 *   El front `Expenses.tsx` no pineaba `extraParams.title` en su
 *   `mod.exportAsync`, entonces el PDF mostraba el default
 *   "Reporte de Expensas" — pero sin garantía de consistencia entre
 *   front y back.
 *
 * Fix (S118 front):
 *   - `Expenses.tsx` pinea `extraParams: { title: "Reporte de Expensas" }`
 *     en su `mod.exportAsync`.
 *   - El back lee `$report->params['title']` y lo usa como title del
 *     header del PDF.
 *
 * Cross-project: aplica a TODO `mod.exportAsync` que quiera un title
 * distinto del default del back. El patrón canónico es
 * `extraParams: { title: "Reporte de X" }` (merge con filterBy/searchBy
 * desde useCrud S118, ver `useCrud.exportAsync.test.tsx`).
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = process.cwd();
const EXPENSES_PATH = path.join(
  FRONT_ROOT,
  "src/modulos/Expenses/Expenses.tsx",
);

describe("S118 front — Expenses.tsx params.title pin", () => {
  it("Expenses.tsx pinea mod.exportAsync.type = 'expenses' (matchea ExpensesReportType)", () => {
    const source = fs.readFileSync(EXPENSES_PATH, "utf8");
    expect(source).toMatch(/exportAsync:\s*\{/);
    expect(source).toMatch(/type:\s*['"]expenses['"]/);
  });

  it("Expenses.tsx pinea mod.exportAsync.extraParams.title = 'Reporte de Expensas'", () => {
    const source = fs.readFileSync(EXPENSES_PATH, "utf8");
    expect(source).toMatch(/extraParams:\s*\{\s*title:\s*['"]Reporte de Expensas['"]/);
  });

  it("Expenses.tsx pinea mod.export = false (kill legacy IconExport)", () => {
    const source = fs.readFileSync(EXPENSES_PATH, "utf8");
    expect(source).toMatch(/export:\s*false/);
  });

  it("Expenses.tsx pinea mod.exportAsync.format = 'pdf'", () => {
    const source = fs.readFileSync(EXPENSES_PATH, "utf8");
    expect(source).toMatch(/format:\s*['"]pdf['"]/);
  });

  it("Expenses.tsx NO pinea type = 'outlays' (ese es del módulo Outlays)", () => {
    const source = fs.readFileSync(EXPENSES_PATH, "utf8");
    const exportAsyncMatch = source.match(/exportAsync:\s*\{([\s\S]*?)\}/);
    expect(exportAsyncMatch).not.toBeNull();
    if (exportAsyncMatch) {
      expect(exportAsyncMatch[1]).not.toMatch(/type:\s*['"]outlays['"]/);
    }
  });
});
