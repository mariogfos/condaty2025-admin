/**
 * ExportProgressModal tests (S33 — NEW-NEW-43 PDF Reports Async + Chunking)
 *
 * Smoke tests del modal que pineé el flow de useAsyncExport.
 * - Renderiza "Generando reporte..." en estado pending/processing
 * - Renderiza "Reporte listo" + botón Descargar en estado completed
 * - Renderiza error + botón Cerrar en estado failed
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExportProgressModal from "../ExportProgressModal";
import type { AsyncExportState } from "../../../../hooks/useAsyncExport/useAsyncExport";

// Mock NewModal to avoid pulling in its full dependency tree
vi.mock("../../NewModal/NewModal", () => ({
  default: ({ open, children, title }: any) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

// Mock Button
vi.mock("../../../forms/Button/Button", () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
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

describe("ExportProgressModal", () => {
  it("renders nothing when open=false", () => {
    const { container } = render(
      <ExportProgressModal
        open={false}
        state={baseState}
        onDownload={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-testid="modal"]')).toBeNull();
  });

  it("renders 'Generando' title + spinner when status=pending", () => {
    render(
      <ExportProgressModal
        open
        state={{ ...baseState, status: "pending", isExporting: true }}
        reportTypeLabel="Pagos"
        onDownload={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Generando Pagos…")).toBeTruthy();
    expect(screen.getByText(/Encolando reporte/i)).toBeTruthy();
  });

  it("renders 'Generando' title + progress + chunks when status=processing", () => {
    render(
      <ExportProgressModal
        open
        state={{
          ...baseState,
          status: "processing",
          isExporting: true,
          progress: 60,
          currentChunk: 3,
          totalChunks: 5,
        }}
        onDownload={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Generando reporte…")).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.getByText("Chunk 3 de 5")).toBeTruthy();
  });

  it("renders 'Reporte listo' + Descargar button when status=completed", () => {
    const onDownload = vi.fn();
    render(
      <ExportProgressModal
        open
        state={{
          ...baseState,
          status: "completed",
          progress: 100,
          totalChunks: 5,
        }}
        onDownload={onDownload}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Reporte listo")).toBeTruthy();
    const downloadBtn = screen.getByTestId("export-download-btn");
    fireEvent.click(downloadBtn);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("renders error message + Cerrar button when status=failed", () => {
    const onClose = vi.fn();
    render(
      <ExportProgressModal
        open
        state={{
          ...baseState,
          status: "failed",
          errorMessage: "Reporte no encontrado",
        }}
        onDownload={vi.fn()}
        onClose={onClose}
      />,
    );
    expect(screen.getByText("Error al generar el reporte")).toBeTruthy();
    expect(screen.getByText("Reporte no encontrado")).toBeTruthy();
    const closeBtn = screen.getByText("Cerrar");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses 'reporte' as default label when reportTypeLabel not provided", () => {
    render(
      <ExportProgressModal
        open
        state={{ ...baseState, status: "pending", isExporting: true }}
        onDownload={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Generando reporte…")).toBeTruthy();
  });
});
