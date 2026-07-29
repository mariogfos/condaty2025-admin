/**
 * S139 (HALLAZGO-NEW-48 + HALLAZGO-NEW-49) — front pin
 *
 * Cubre los fixes de 2 bugs reportados por Mario post-S137 (2026-07-29):
 *
 * **Bug #1 (deuda_individual label)**: el select del histórico de
 * descargas y el filename del download mostraban "debt-dptos" (type
 * técnico) para los 4 vistas distintas que pinean este type (Individual,
 * Compartidas, Condonaciones, Todas). Fix: el back ahora retorna
 * `name` (displayName del ReportType según params) en cada item del
 * `GET /api/v3/reports`. El front pineá `item.name` en el render del
 * item y en el filename del download.
 *
 * **Bug #2 (Deudas Compartidas vs Expensas)**: SharedDebts (lista)
 * pineá `type: "debt-groups"` → DebtGroupReportType EXPENSE branch
 * ("Listado de EXPENSAS", 7 cols agregado). Debería pinear
 * `type: "debt-dptos"` con `extraParams: { type: 4 }` →
 * DebtDptoReportType NORMAL branch ("TODAS LAS DEUDAS COMPARTIDAS",
 * 6 cols por deuda individual). DetailSharedDebts (click en fila)
 * pineá el reporte equivocado. Fix: cambiar el `mod.exportAsync.type`
 * + `extraParams` de SharedDebts y DetailSharedDebts.
 *
 * **Bug #3 (XLSX unidades → PDF malformado)**: el back normaliza
 * 'excel' → 'xlsx' (HALLAZGO-NEW-49). El download pinea
 * `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
 * y filename con extensión `.xlsx`. El front hace defense-in-depth
 * normalizando format en el default download flow.
 *
 * Patrón source-parsing + render: HALLAZGO-NEW-03 (binding, cross-project).
 * Diff in scope: 0 BC break (S138 fix de login pineado).
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const FRONT_ROOT = path.resolve(__dirname, "../../..");
const BACK_TS_ROOT = path.resolve(__dirname, "..");

const readFile = (relPath: string): string => {
  const abs = path.join(FRONT_ROOT, relPath);
  return fs.readFileSync(abs, "utf8");
};

const stripComments = (source: string): string => {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
};

const loadSourceWithoutComments = (relPath: string): string => {
  return stripComments(readFile(relPath));
};

describe("S139-fe — displayName dinámico + SharedDebts/DetailSharedDebts fix", () => {
  // ────────────────────────────────────────────────────────────────────
  // Bug #1 — displayName en DownloadHistory
  // ────────────────────────────────────────────────────────────────────

  describe("DownloadHistory pinea `name` (displayName) del back", () => {
    it("DownloadHistoryItem type incluye `name` opcional", () => {
      const src = readFile(
        "mk/components/ui/DownloadHistory/DownloadHistory.tsx"
      );
      // El type DownloadHistoryItem pineá `name` opcional.
      expect(src).toMatch(/name\?:\s*string\s*\|\s*null/);
      // HALLAZGO-NEW-48 pineado en el docblock.
      expect(src).toMatch(/S139 \(HALLAZGO-NEW-48\)/);
    });

    it("DownloadHistory pinea `item.name` cuando está pineado, fallback a `humanizeType(item.type)`", () => {
      const src = readFile(
        "mk/components/ui/DownloadHistory/DownloadHistory.tsx"
      );
      // El render del item pineá `item.name` si está disponible.
      expect(src).toMatch(/item\.name\s*\|\|\s*humanizeType\(item\.type\)/);
      // El displayName pineá en `itemTitle` con data-testid.
      expect(src).toMatch(/data-testid="download-history-item-title"/);
    });

    it("DownloadHistory filename pinea name sanitizado + format normalizado (excel→xlsx)", () => {
      const src = readFile(
        "mk/components/ui/DownloadHistory/DownloadHistory.tsx"
      );
      // Format pineá 'excel' → 'xlsx' (defense in depth — el back ya normaliza).
      expect(src).toMatch(/item\.format === "excel"\s*\?\s*"xlsx"/);
      // Filename pineá `sanitizedName` (displayName) en lugar de `item.type`.
      expect(src).toMatch(/sanitizedName\s*\|\|\s*"reporte"/);
      // El filename format pineá 'xlsx'|'pdf' (no 'excel').
      expect(src).toMatch(/\$\{downloadFormat\}/);
      // No debe pinear `item.type.includes("excel")` legacy (post-S139).
      expect(src).not.toMatch(/item\.type\.includes\(['"]excel['"]\)/);
    });

    it("KNOWN_TYPES pineá `debt-dptos` con label distinto a `dpto-deudas` (no duplicado)", () => {
      // S140: el `debt-dptos` pineá 4 vistas multi-branch (Individual,
      // Compartidas, Condonaciones, Todas). El `dpto-deudas` pineá el
      // reporte de Unidades (XLSX estado de cuentas). Pre-S140 ambos
      // pinean "Deudas por Dpto" → duplicado en el dropdown. Post-S140
      // pinean labels distintos.
      const src = readFile(
        "mk/components/ui/DownloadHistory/DownloadHistory.tsx"
      );
      // Compat: el dropdown pineá KNOWN_TYPES como label fallback. El
      // `debt-dptos` debe tener un label humanizado.
      expect(src).toMatch(/value:\s*["']debt-dptos["']/);
      // El label pineá algo distinto a "Deudas por Dpto" (que es
      // de dpto-deudas). Default: "Deudas — Detalles" o "Deudas Individuales
      // y Compartidas". Pin genérico: NO debe contener "Deudas por Dpto".
      const debtDptosMatch = src.match(
        /value:\s*["']debt-dptos["'],\s*label:\s*["']([^"']+)["']/,
      );
      expect(debtDptosMatch).not.toBeNull();
      expect(debtDptosMatch![1]).not.toBe("Deudas por Dpto");
      expect(debtDptosMatch![1]).not.toMatch(/Deudas por Dpto/);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Bug #2 — SharedDebts pinea `debt-dptos` (no `debt-groups`)
  // ────────────────────────────────────────────────────────────────────

  describe("SharedDebts lista pinea `debt-dptos` + type=4 (no `debt-groups`)", () => {
    it("SharedDebts.tsx pineá modulo: 'v3/debt-dptos' + exportAsync.type: 'debt-dptos'", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/SharedDebts/SharedDebts.tsx"
      );
      // modulo pineá 'v3/debt-dptos' (no 'debt-groups').
      expect(src).toMatch(/modulo:\s*["']v3\/debt-dptos["']/);
      // exportAsync.type pineá 'debt-dptos' (no 'debt-groups').
      expect(src).toMatch(/type:\s*["']debt-dptos["']/);
      // extraParams.type = 4 (SHARED) para DebtDptoReportType NORMAL branch.
      expect(src).toMatch(/extraParams:\s*\{\s*type:\s*4\s*\}/);
    });

    it("SharedDebts NO pineá `debt-groups` (regression pin)", () => {
      // loadSourceWithoutComments ya pineó comentarios. Pero el `modulo: "debt-groups"`
      // NO debe estar en el archivo (regression pin).
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/SharedDebts/SharedDebts.tsx"
      );
      // El modulo pineá 'v3/debt-dptos', no 'debt-groups'.
      expect(src).not.toMatch(/modulo:\s*["']debt-groups["']/);
      // El exportAsync.type NO pineá 'debt-groups' tampoco.
      expect(src).not.toMatch(/type:\s*["']debt-groups["']/);
    });

    it("SharedDebts.tsx pineá docblock S139 con contexto del fix", () => {
      const src = readFile(
        "modulos/DebtsManager/TabComponents/SharedDebts/SharedDebts.tsx"
      );
      // El docblock explica el cambio S139 + HALLAZGO-NEW-48.
      expect(src).toMatch(/S139/);
      expect(src).toMatch(/HALLAZGO-NEW-48/);
      expect(src).toMatch(/Deuda Compartida/);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Bug #2 — DetailSharedDebts pinea `debt-groups` (no `debt-dptos`)
  // ────────────────────────────────────────────────────────────────────

  describe("DetailSharedDebts pinea `debt-groups` + type=1 (no `debt-dptos`)", () => {
    it("DetailSharedDebts.tsx pineá modulo: 'v3/debt-groups' + exportAsync.type: 'debt-groups'", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/SharedDebts/DetalleDeudaCompartida/DetailSharedDebts.tsx"
      );
      // modulo pineá 'v3/debt-groups' (no 'v3/debt-dptos').
      expect(src).toMatch(/modulo:\s*["']v3\/debt-groups["']/);
      // exportAsync.type pineá 'debt-groups' (no 'debt-dptos').
      expect(src).toMatch(/type:\s*["']debt-groups["']/);
      // extraParams.type = 1 (EXPENSE) + debt_id dinámico.
      expect(src).toMatch(/extraParams:\s*\{\s*type:\s*1,\s*debt_id:\s*debtId\s*\}/);
    });

    it("DetailSharedDebts NO pineá `debt-dptos` (regression pin)", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/SharedDebts/DetalleDeudaCompartida/DetailSharedDebts.tsx"
      );
      // El modulo pineá 'v3/debt-groups', no 'v3/debt-dptos'.
      expect(src).not.toMatch(/modulo:\s*["']v3\/debt-dptos["']/);
      // El exportAsync.type NO pineá 'debt-dptos' tampoco.
      expect(src).not.toMatch(/type:\s*["']debt-dptos["']/);
    });

    it("DetailSharedDebts.tsx pineá docblock S139 con contexto del fix", () => {
      const src = readFile(
        "modulos/DebtsManager/TabComponents/SharedDebts/DetalleDeudaCompartida/DetailSharedDebts.tsx"
      );
      expect(src).toMatch(/S139/);
      expect(src).toMatch(/HALLAZGO-NEW-48/);
      // Explica que pineá DebtGroupReportType (7 cols agregado por periodo).
      expect(src).toMatch(/agrupado/i);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Cross-check: las 4 vistas de `debt-dptos` no pinean type=1 (EXPENSE)
  // ────────────────────────────────────────────────────────────────────

  describe("Las 4 vistas de `debt-dptos` pinean tipos distintos (no EXPENSE)", () => {
    it("IndividualDebts pineá type=0 (NORMAL)", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/IndividualDebts/IndividualDebts.tsx"
      );
      expect(src).toMatch(/extraParams:\s*\{\s*type:\s*0\s*\}/);
    });

    it("SharedDebts pineá type=4 (SHARED) — verificado arriba", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/SharedDebts/SharedDebts.tsx"
      );
      expect(src).toMatch(/extraParams:\s*\{\s*type:\s*4\s*\}/);
    });

    it("Forgiveness pineá type=5 (FORGIVENESS)", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/Forgiveness/Forgiveness.tsx"
      );
      expect(src).toMatch(/extraParams:\s*\{\s*type:\s*5\s*\}/);
    });

    it("AllDebts NO pineá extraParams.type (default 'TODAS LAS DEUDAS')", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/AllDebts/AllDebts.tsx"
      );
      // AllDebts NO pineá `extraParams.type` (el back detecta branch NORMAL
      // con $isAllDebts = true).
      expect(src).not.toMatch(/extraParams:\s*\{\s*type:/);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Cross-check: ninguna vista pineá modulo: 'v3/debt-groups' para
  // deudas individuales (regression pin).
  // ────────────────────────────────────────────────────────────────────

  describe("Regresión: vistas de deudas individuales pinean 'v3/debt-dptos', no 'v3/debt-groups'", () => {
    it("IndividualDebts NO pineá modulo: 'v3/debt-groups'", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/IndividualDebts/IndividualDebts.tsx"
      );
      expect(src).toMatch(/modulo:\s*["']v3\/debt-dptos["']/);
      expect(src).not.toMatch(/modulo:\s*["']v3\/debt-groups["']/);
    });

    it("Forgiveness NO pineá modulo: 'v3/debt-groups'", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/Forgiveness/Forgiveness.tsx"
      );
      expect(src).toMatch(/modulo:\s*["']v3\/debt-dptos["']/);
      expect(src).not.toMatch(/modulo:\s*["']v3\/debt-groups["']/);
    });

    it("AllDebts NO pineá modulo: 'v3/debt-groups'", () => {
      const src = loadSourceWithoutComments(
        "modulos/DebtsManager/TabComponents/AllDebts/AllDebts.tsx"
      );
      expect(src).toMatch(/modulo:\s*["']v3\/debt-dptos["']/);
      expect(src).not.toMatch(/modulo:\s*["']v3\/debt-groups["']/);
    });
  });
});
