/**
 * S140-fe-2 (HALLAZGO-NEW-39 variant) — front pin
 *
 * Fixes 2 bugs del backlog Mario 2026-07-28 (PRIORIDAD 2):
 *
 * **Bug #3 — Egresos "Estado Desconocido" en lista** (Outlays.tsx):
 * el front pineá `statusConfig` con keys CHAR legacy ('A', 'X') pero
 * el back pinea `ExpenseStatus` enum numérico (0=CANCELLED, 1=ACTIVE)
 * post-S2-T2. Mismatch → todo caía en "Desconocido".
 *
 * **Bug #13 — Residentes "Tipo/estado Desconocido"** (Owners.tsx +
 * utils.tsx lStatusActive): el front pineá `lStatusActive` con keys
 * CHAR legacy ('A', 'X', 'W', 'P') pero el back pinea `OwnerStatus`
 * enum numérico (1-4) post-S132. Mismatch → todo caía en "Desconocido".
 *
 * Fix: cambiar las keys de ambos maps a numéricas para que matcheen
 * los enums del back. Defense in depth: el front coerce string→int
 * para tolerar respuestas JSON que vienen como string.
 *
 * Patrón source-parsing: HALLAZGO-NEW-03 (binding, cross-project).
 * Diff in scope: 0 BC break (S139 displayName pineado, S140-bk #12 MERGED).
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const FRONT_ROOT = path.resolve(__dirname, "../../..");

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

describe("S140-fe-2 — fix mismatch status enum numérico", () => {
  // ────────────────────────────────────────────────────────────────────
  // Bug #3 — Outlays statusConfig con keys numeric
  // ────────────────────────────────────────────────────────────────────

  describe("Outlays.tsx statusConfig con keys numéricas (ExpenseStatus enum)", () => {
    it("statusConfig tiene keys numéricas 0 y 1 (no CHAR 'A'/'X')", () => {
      const src = loadSourceWithoutComments(
        "modulos/Outlays/Outlays.tsx"
      );
      // Post-S140: pineá keys numéricas que matchean el enum del back.
      expect(src).toMatch(/0:\s*\{\s*label:\s*["']Anulado["']/);
      expect(src).toMatch(/1:\s*\{\s*label:\s*["']Pagado["']/);
      // Regression pin: NO debe tener keys CHAR 'A' ni 'X' en este statusConfig.
      // (Los comments pueden mencionarlas, pero el código no debe pinearlas).
      const statusConfigMatch = src.match(
        /const statusConfig[^=]*=\s*\{([\s\S]*?)\n\s*\};/,
      );
      expect(statusConfigMatch).not.toBeNull();
      const statusConfigBody = statusConfigMatch![1];
      // El body del statusConfig no debe tener keys 'A' o 'X' con el formato `A: {`
      expect(statusConfigBody).not.toMatch(/^\s*A:\s*\{/m);
      expect(statusConfigBody).not.toMatch(/^\s*X:\s*\{/m);
    });

    it("Outlays.tsx pineá HALLAZGO-NEW-39 variant comment", () => {
      const src = readFile("modulos/Outlays/Outlays.tsx");
      expect(src).toMatch(/S140/);
      expect(src).toMatch(/HALLAZGO-NEW-39 variant/);
    });

    it("Outlays.tsx coerce string→int (defense in depth)", () => {
      const src = loadSourceWithoutComments(
        "modulos/Outlays/Outlays.tsx"
      );
      // El cast pineá coerción explícita: typeof string → parseInt.
      expect(src).toMatch(/parseInt\(rawStatus,\s*10\)/);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Bug #13 — lStatusActive con keys numéricas
  // ────────────────────────────────────────────────────────────────────

  describe("utils.tsx lStatusActive con keys numéricas (OwnerStatus enum)", () => {
    it("lStatusActive tiene keys numéricas 1-4 (no CHAR 'A'/'X'/'W'/'P')", () => {
      const src = loadSourceWithoutComments("mk/utils/utils.tsx");
      // Post-S140: pineá keys numéricas que matchean el enum del back.
      expect(src).toMatch(/1:\s*\{\s*name:\s*["']Activo["']/);
      expect(src).toMatch(/2:\s*\{\s*name:\s*["']Por activar["']/);
      expect(src).toMatch(/3:\s*\{\s*name:\s*["']Debe cambiar contraseña["']/);
      expect(src).toMatch(/4:\s*\{\s*name:\s*["']Inactivo["']/);

      // Regression pin: el lStatusActive NO debe tener keys CHAR.
      // Match el bloque exacto `{ ... }` después de `lStatusActive: any = {`.
      const lStatusMatch = src.match(
        /lStatusActive:\s*any\s*=\s*\{([\s\S]*?)\n\};/,
      );
      expect(lStatusMatch).not.toBeNull();
      const body = lStatusMatch![1];
      expect(body).not.toMatch(/^\s*A:\s*\{/m);
      expect(body).not.toMatch(/^\s*X:\s*\{/m);
      expect(body).not.toMatch(/^\s*W:\s*\{/m);
      expect(body).not.toMatch(/^\s*P:\s*\{/m);
    });

    it("utils.tsx pineá S140 docblock con contexto del fix", () => {
      const src = readFile("mk/utils/utils.tsx");
      expect(src).toMatch(/S140/);
      expect(src).toMatch(/HALLAZGO-NEW-39 variant/);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Cross-check: lStatusActive no se usa con keys CHAR en otros consumers
  // ────────────────────────────────────────────────────────────────────

  describe("Regresión: lStatusActive pineá enum numérico en todos los consumers", () => {
    it("Owners.tsx pinea `lStatusActive[item?.status]` con status numérico (sin cambios)", () => {
      // Owners.tsx ya importaba OwnerStatus enum. El cambio está en lStatusActive.
      // Acá pineamos que el consumer pineá el map directo.
      const src = loadSourceWithoutComments("modulos/Owners/Owners.tsx");
      expect(src).toMatch(/lStatusActive\[item\?\.status\]/);
      // El OwnerStatus enum se importa (sanity).
      expect(src).toMatch(/import\s*\{[^}]*OwnerStatus[^}]*\}\s*from/);
    });
  });
});
