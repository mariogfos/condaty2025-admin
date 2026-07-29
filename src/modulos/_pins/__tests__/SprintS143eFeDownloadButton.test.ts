/**
 * S143e-fe (HALLAZGO-NEW-54, binding, cross-project) — DownloadButton + useAsyncExport.endpoint
 *
 * Pin de regresión source-parsing sobre:
 *   - `DownloadButton.tsx` (NUEVO): ícono Download + menú si multi-format.
 *   - `useAsyncExport.endpoint` opcional: dispatcha GET inline si pineado.
 *   - `DownloadHistory` botón "Limpiar historial" → solo ícono + tooltip.
 *
 * Patrón HALLAZGO-NEW-03 (binding, cross-project): source-parsing pineá
 * INTENCIÓN. Si alguien rompe el approach de S143e, el test falla con
 * mensaje claro.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = path.resolve(__dirname, "../../..");

const readFile = (relPath: string): string => {
  return fs.readFileSync(path.join(FRONT_ROOT, relPath), "utf8");
};

const stripComments = (source: string): string => {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
};

const loadSourceWithoutComments = (relPath: string): string => {
  return stripComments(readFile(relPath));
};

describe("S143e-fe — DownloadButton con ícono + menú (HALLAZGO-NEW-54)", () => {
  describe("DownloadButton.tsx — estructura del componente", () => {
    it("DownloadButton.tsx existe", () => {
      const rel = "mk/components/ui/DownloadButton/DownloadButton.tsx";
      expect(fs.existsSync(path.join(FRONT_ROOT, rel))).toBe(true);
    });

    it("DownloadButton.tsx pineá DownloadFormat type con pdf/xlsx/csv", () => {
      const src = readFile("mk/components/ui/DownloadButton/DownloadButton.tsx");
      expect(src).toMatch(/export type DownloadFormat/);
      expect(src).toMatch(/"pdf"/);
      expect(src).toMatch(/"xlsx"/);
      expect(src).toMatch(/"csv"/);
    });

    it("DownloadButton.tsx pineá supportedFormats prop con default ['pdf']", () => {
      const src = loadSourceWithoutComments(
        "mk/components/ui/DownloadButton/DownloadButton.tsx",
      );
      expect(src).toMatch(/supportedFormats\?: DownloadFormat\[\]/);
      expect(src).toMatch(/supportedFormats = \["pdf"\]/);
    });

    it("DownloadButton.tsx pineá endpoint prop opcional para inline export", () => {
      const src = loadSourceWithoutComments(
        "mk/components/ui/DownloadButton/DownloadButton.tsx",
      );
      expect(src).toMatch(/endpoint\?: string \| null/);
    });

    it("DownloadButton.tsx pineá useExtraData + requiredRelations props", () => {
      const src = loadSourceWithoutComments(
        "mk/components/ui/DownloadButton/DownloadButton.tsx",
      );
      expect(src).toMatch(/useExtraData\?: boolean/);
      expect(src).toMatch(/requiredRelations\?: string\[\]/);
    });

    it("DownloadButton.tsx pineá hasMultipleFormats helper", () => {
      const src = loadSourceWithoutComments(
        "mk/components/ui/DownloadButton/DownloadButton.tsx",
      );
      // S143e: si supportedFormats.length > 1, dropdown. Si === 1, single click.
      expect(src).toMatch(/hasMultipleFormats = supportedFormats\.length > 1/);
    });

    it("DownloadButton.tsx pineá data-testid para smoke tests", () => {
      const src = readFile("mk/components/ui/DownloadButton/DownloadButton.tsx");
      expect(src).toMatch(/data-testid=\{`download-btn-\$\{type\}`\}/);
      expect(src).toMatch(/data-testid=\{`download-menu-\$\{type\}`\}/);
      expect(src).toMatch(/data-testid=\{`download-menuitem-\$\{type\}-\$\{fmt\}`\}/);
    });

    it("DownloadButton.tsx pineá title + aria-label (tooltip a11y)", () => {
      const src = readFile("mk/components/ui/DownloadButton/DownloadButton.tsx");
      expect(src).toMatch(/title=\{title\}/);
      expect(src).toMatch(/aria-label=\{title\}/);
    });
  });

  describe("useAsyncExport — endpoint opcional (S143e HALLAZGO-NEW-54)", () => {
    it("useAsyncExport.ts pineá endpoint opcional en UseAsyncExportOptions", () => {
      const src = loadSourceWithoutComments(
        "mk/hooks/useAsyncExport/useAsyncExport.ts",
      );
      expect(src).toMatch(/endpoint\?: string \| null/);
    });

    it("useAsyncExport.ts dispatcha GET inline si endpoint pineado", () => {
      const src = loadSourceWithoutComments(
        "mk/hooks/useAsyncExport/useAsyncExport.ts",
      );
      // S143e: si endpoint está pineado, dispatcha GET {endpoint}?_export={format}.
      expect(src).toMatch(/endpoint\s*\?\s*await fetch/);
      expect(src).toMatch(/encodeURIComponent/);
    });

    it("useAsyncExport.ts mantiene BC layer legacy (POST /v3/reports/{type}/export)", () => {
      const src = loadSourceWithoutComments(
        "mk/hooks/useAsyncExport/useAsyncExport.ts",
      );
      // S143e: si endpoint NO pineado, sigue pineando el flow BC layer.
      expect(src).toMatch(/v3\/reports\/\$\{type\}\/export/);
    });
  });

  describe("DownloadHistory — botón Limpiar historial solo ícono (S143e HALLAZGO-NEW-54)", () => {
    it("DownloadHistory.tsx oculta el texto 'Limpiar historial' del botón", () => {
      const src = loadSourceWithoutComments(
        "mk/components/ui/DownloadHistory/DownloadHistory.tsx",
      );
      // El botón ya NO pinea el texto "Limpiar historial" — solo el ícono Trash2.
      // El label vive en `title` HTML para accesibilidad.
      const clearBtnBlock = src.match(
        /data-testid="download-history-clear-btn"[\s\S]*?<\/Button>/,
      );
      expect(clearBtnBlock).toBeTruthy();
      // NO debe tener texto "Limpiar historial" visible (puede tenerlo en title/aria-label).
      expect(clearBtnBlock![0]).not.toMatch(/>\s*Limpiar historial\s*</);
    });

    it("DownloadHistory.tsx pineá title='Limpiar historial' (tooltip)", () => {
      const src = readFile(
        "mk/components/ui/DownloadHistory/DownloadHistory.tsx",
      );
      expect(src).toMatch(/title="Limpiar historial"/);
    });

    it("DownloadHistory.module.css pineá clase .iconOnly (botón compacto)", () => {
      const css = readFile(
        "mk/components/ui/DownloadHistory/DownloadHistory.module.css",
      );
      expect(css).toMatch(/\.iconOnly\s*\{/);
      expect(css).toMatch(/width:\s*36px/);
      expect(css).toMatch(/height:\s*36px/);
      expect(css).toMatch(/padding:\s*0/);
    });
  });
});
