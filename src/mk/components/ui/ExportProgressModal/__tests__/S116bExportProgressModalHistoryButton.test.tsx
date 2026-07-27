/**
 * S116b front — Pin de regresión para el botón "Ver historial" en
 * ExportProgressModal + AsyncExportButton.
 *
 * Historia del bug (2026-07-27, Mario): "Ingresos XLS se queda pensando"
 * — el user dispara export, el modal muestra spinner, pero no tiene
 * cómo ver otros reports completed en paralelo. El user queda "atrapado"
 * esperando el botón "Descargar" que puede tardar varios minutos.
 *
 * HALLAZGO-NEW-26 (binding, cross-project, S116b): cualquier modal de
 * flow async (export, upload, etc.) debe pinear una salida explícita
 * para que el user no quede atrapado. El "Ver historial" button es
 * UNA implementación, pero el principio es universal: si el flow es
 * async, dar siempre una forma de SALIR a un estado donde el user
 * puede ver el progreso completo y otros flows en paralelo.
 *
 * Cross-IA: Mavis main el 2026-07-27.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExportProgressModal from "../ExportProgressModal";
import type { AsyncExportState } from "../../../../hooks/useAsyncExport/useAsyncExport";

vi.mock("../../../forms/Button/Button", () => ({
  default: ({
    children,
    onClick,
    "data-testid": testId,
    disabled,
  }: any) => (
    <button onClick={onClick} data-testid={testId} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("../../NewModal/NewModal", () => ({
  default: ({ children, open }: any) => (open ? <div>{children}</div> : null),
}));

const baseState: AsyncExportState = {
  isExporting: false,
  status: "idle",
  progress: 0,
  currentChunk: null,
  totalChunks: null,
  jobId: null,
  downloadUrl: null,
  errorMessage: null,
};

describe("S116b front — ExportProgressModal Ver historial button", () => {
  it("renderiza botón 'Ver historial' en estado completed cuando onShowHistory pineado", () => {
    const onShowHistory = vi.fn();
    render(
      <ExportProgressModal
        open={true}
        state={{ ...baseState, status: "completed", downloadUrl: "/api/v3/reports/abc/download" }}
        onDownload={vi.fn()}
        onClose={vi.fn()}
        onShowHistory={onShowHistory}
      />,
    );
    const btn = screen.getByTestId("export-show-history-btn");
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onShowHistory).toHaveBeenCalledTimes(1);
  });

  it("renderiza botón 'Ver historial' en estado failed cuando onShowHistory pineado", () => {
    const onShowHistory = vi.fn();
    render(
      <ExportProgressModal
        open={true}
        state={{ ...baseState, status: "failed", errorMessage: "boom" }}
        onDownload={vi.fn()}
        onClose={vi.fn()}
        onShowHistory={onShowHistory}
      />,
    );
    const btn = screen.getByTestId("export-show-history-btn");
    expect(btn).toBeTruthy();
  });

  it("NO renderiza botón 'Ver historial' cuando onShowHistory NO pineado (back-compat)", () => {
    render(
      <ExportProgressModal
        open={true}
        state={{ ...baseState, status: "completed" }}
        onDownload={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("export-show-history-btn")).toBeNull();
  });

  it("NO renderiza botón 'Ver historial' en estado processing (aún no completó)", () => {
    const onShowHistory = vi.fn();
    render(
      <ExportProgressModal
        open={true}
        state={{ ...baseState, status: "processing", progress: 30 }}
        onDownload={vi.fn()}
        onClose={vi.fn()}
        onShowHistory={onShowHistory}
      />,
    );
    expect(screen.queryByTestId("export-show-history-btn")).toBeNull();
  });

  it("renderiza botón 'Descargar' en estado completed (sin romper S33/S113)", () => {
    const onDownload = vi.fn();
    render(
      <ExportProgressModal
        open={true}
        state={{ ...baseState, status: "completed" }}
        onDownload={onDownload}
        onClose={vi.fn()}
        onShowHistory={vi.fn()}
      />,
    );
    const btn = screen.getByTestId("export-download-btn");
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});
