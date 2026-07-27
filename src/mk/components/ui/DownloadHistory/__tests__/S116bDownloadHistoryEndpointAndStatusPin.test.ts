/**
 * S116b front — Pin de regresión para el endpoint + filtros del DownloadHistory.
 *
 * HALLAZGO-NEW-03 (binding, cross-project): source-parsing pinea INTENCIÓN.
 * Si alguien pineá cambiar el path del endpoint, los query params, o
 * rompe el contract con el back (S116b PR #204), los tests fallan con
 * mensaje claro.
 *
 * Cross-IA: Mavis main el 2026-07-27.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = process.cwd();
const COMPONENT_PATH = path.join(
  FRONT_ROOT,
  "src/mk/components/ui/DownloadHistory/DownloadHistory.tsx",
);

describe("S116b front — DownloadHistory endpoint + status + pagination", () => {
  it("DownloadHistory.tsx pinea status query param (default completed)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // S116b back (PR #204) acepta ?status=completed|failed|pending|processing|all.
    // Default: completed (lo que el user normalmente quiere ver).
    expect(src).toMatch(/status=\$\{status\}/);
    // El default de initialStatus es "completed"
    expect(src).toMatch(/DEFAULT_STATUS[^;]*=\s*["']completed["']/);
  });

  it("DownloadHistory.tsx pinea page + perPage query params (S116b back pagination)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El back pinea ?page=...&perPage=... (clamp 1-100, default 20).
    expect(src).toMatch(/page=\$\{page\}/);
    expect(src).toMatch(/perPage=\$\{perPage\}/);
  });

  it("DownloadHistory.tsx pinea anti IDOR (NO acepta user_id en query)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El back (S116b) filtra por user_id del token y NO acepta user_id
    // en query. El front NO debe pinear `user_id=` ni pasarlo.
    expect(src).not.toMatch(/user_id=/);
  });

  it("DownloadHistory.tsx pinea polling opt-in (no se ejecuta si no hay pending)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El componente pinea un setInterval que SOLO corre si hay items
    // con status pending|processing. Si no, no pineá requests extra.
    expect(src).toMatch(/setInterval/);
    expect(src).toMatch(/i\.status === ["']pending["']\s*\|\|\s*i\.status === ["']processing["']/);
  });

  it("DownloadHistory.tsx pinea onDownload callback override (parent decide cómo descargar)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // Si el parent pineá onDownload, se pineá ese. Si no, default
    // flow con buildBackendUrl + Bearer + Blob.
    expect(src).toMatch(/onDownload\?/);
    expect(src).toMatch(/onDownload\(item\)/);
  });

  it("DownloadHistory.tsx pinea type=... mapping conocido (ReportTypeRegistry)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // Mapeo humanizado para los tipos conocidos de reports
    // (S32-S45). Si el back agrega uno nuevo, pinear acá.
    expect(src).toMatch(/payments:\s*["']Pagos["']/);
    expect(src).toMatch(/expenses:\s*["']Expensas["']/);
    expect(src).toMatch(/defaulters:\s*["']Morosos["']/);
    expect(src).toMatch(/accesses:\s*["']Accesos["']/);
  });

  it("DownloadHistory.tsx pinea download button disabled cuando !isCompleted", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El botón "Descargar" solo se habilita si el item está completed.
    // Para pending/processing/failed: botón deshabilitado con "—".
    expect(src).toMatch(/disabled=\{!isCompleted/);
  });
});
