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
    // S119: el URL building se refactorizó a URLSearchParams en vez de
    // template literal inline. La intención es la misma: pinear status
    // en el query string. Test actualizado al nuevo patrón.
    expect(src).toMatch(/params\.set\(\s*["']status["']\s*,\s*status\s*\)/);
    // El default de initialStatus es "completed"
    expect(src).toMatch(/DEFAULT_STATUS[^;]*=\s*["']completed["']/);
  });

  it("DownloadHistory.tsx pinea page + perPage query params (S116b back pagination)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El back pinea ?page=...&perPage=... (clamp 1-100, default 20).
    // S119: refactor a URLSearchParams — pinear el patrón nuevo.
    expect(src).toMatch(/params\.set\(\s*["']page["']\s*,\s*String\(page\)\s*\)/);
    expect(src).toMatch(/params\.set\(\s*["']perPage["']\s*,\s*String\(perPage\)\s*\)/);
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
    // S119: el mapping se refactorizó de `Record<string,string>` (objeto)
    // a `KNOWN_TYPES: { value, label }[]` (array) para pinear la
    // estructura del dropdown. El test se actualiza para matchear
    // la nueva forma pero pinea LA MISMA INTENCIÓN: que los types
    // principales estén mapeados a labels humanizados.
    expect(src).toMatch(/value:\s*["']payments["']\s*,\s*label:\s*["']Pagos["']/);
    expect(src).toMatch(/value:\s*["']expenses["']\s*,\s*label:\s*["']Expensas["']/);
    expect(src).toMatch(/value:\s*["']defaulters["']\s*,\s*label:\s*["']Morosos["']/);
    expect(src).toMatch(/value:\s*["']accesses["']\s*,\s*label:\s*["']Accesos["']/);
  });

  it("DownloadHistory.tsx pinea download button disabled cuando !isCompleted", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El botón "Descargar" solo se habilita si el item está completed.
    // Para pending/processing/failed: botón deshabilitado con "—".
    expect(src).toMatch(/disabled=\{!isCompleted/);
  });
});
