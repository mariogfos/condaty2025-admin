/**
 * S116b front — Pin de regresión para el botón "Historial" inline en
 * AsyncExportButton.
 *
 * El `AsyncExportButton` ahora pineá DOS botones side-by-side:
 * 1. "Exportar X" (el original, dispara el flow)
 * 2. "Historial" (nuevo S116b, abre el DownloadHistory modal)
 *
 * Si alguien pineá quitar el botón Historial (o pinearlo condicional
 * sin flag), el test falla con mensaje claro.
 *
 * Cross-IA: Mavis main el 2026-07-27.
 */
import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

const FRONT_ROOT = process.cwd();
const COMPONENT_PATH = path.join(
  FRONT_ROOT,
  "src/mk/components/ui/AsyncExportButton/AsyncExportButton.tsx",
);

describe("S116b front — AsyncExportButton Historial shortcut pin", () => {
  it("AsyncExportButton.tsx pinea botón 'Historial' (data-testid async-history-btn-*)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El botón pineá data-testid={`async-history-btn-${type}`} para
    // que el smoke test pueda pinear el click.
    expect(src).toMatch(/data-testid=\{`async-history-btn-\$\{type\}`\}/);
  });

  it("AsyncExportButton.tsx pinea showHistoryShortcut flag (default true)", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El parent puede pinear showHistoryShortcut={false} para deshabilitar
    // el botón inline (si quiere solo el del modal ExportProgressModal).
    expect(src).toMatch(/showHistoryShortcut\?:\s*boolean/);
    expect(src).toMatch(/showHistoryShortcut\s*=\s*true/);
  });

  it("AsyncExportButton.tsx pinea DownloadHistoryModal junto al ExportProgressModal", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // Ambos modales pineados: ExportProgressModal (progress) +
    // DownloadHistoryModal (historial). Si alguien pineá quitar el
    // DownloadHistoryModal, el "Ver historial" del ExportProgressModal
    // queda sin destino.
    expect(src).toMatch(/import\s+\{[^}]*DownloadHistoryModal[^}]*\}\s+from/);
    expect(src).toMatch(/<DownloadHistoryModal/);
    expect(src).toMatch(/<ExportProgressModal/);
  });

  it("AsyncExportButton.tsx pinea onShowHistory al ExportProgressModal", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // El ExportProgressModal pineá onShowHistory (S116b) que abre
    // el DownloadHistoryModal cuando el user hace click en
    // "Ver historial" desde el modal de progreso.
    expect(src).toMatch(/onShowHistory=\{/);
  });

  it("AsyncExportButton.tsx pinea historyOpen state independiente del modalOpen", () => {
    const src = fs.readFileSync(COMPONENT_PATH, "utf8");
    // Si el user abre el historial DESDE el modal de progreso, el
    // modal de progreso se cierra (setModalOpen(false)) y el
    // historial se abre (setHistoryOpen(true)). Son state separados.
    expect(src).toMatch(/const\s+\[historyOpen,\s*setHistoryOpen\]\s*=\s*useState/);
  });
});
