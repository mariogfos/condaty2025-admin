import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReportPdfPartsDialog, { type ReportPdfParts } from "../ReportPdfPartsDialog";

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, title, onSave, onClose }: any) => (
    <div role="dialog" aria-label={title}>
      {children}
      <button onClick={onSave}>Generar PDF</button>
      <button onClick={onClose}>Cancelar</button>
    </div>
  ),
}));

vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ options, value, onChange, label }: any) => (
    <select aria-label={label} value={value} onChange={onChange}>
      {options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  ),
}));

describe("PDF de accesos por partes", () => {
  it("ofrece días y diferencia las partes de un día que supera el límite", () => {
    const download = vi.fn();
    const plan: ReportPdfParts = {
      pageLimit: 120, snapshotId: "9999", mode: "daily", items: [
        { id: "day1", startDate: "2026-10-01", endDate: "2026-10-01", startPage: 1, pageCount: 100, totalPages: 100, rowCount: 1300 },
        { id: "day2-part1", startDate: "2026-10-02", endDate: "2026-10-02", startPage: 1, pageCount: 120, totalPages: 154, rowCount: 1560 },
        { id: "day2-part2", startDate: "2026-10-02", endDate: "2026-10-02", startPage: 121, pageCount: 34, totalPages: 154, rowCount: 440 },
      ],
    };
    render(<ReportPdfPartsDialog plan={plan} onClose={vi.fn()} onDownload={download} />);
    expect(screen.getByRole("dialog", { name: "Descargar PDF por días" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Generar PDF" }));
    expect(download).toHaveBeenLastCalledWith(plan.items![0]);
    fireEvent.change(screen.getByLabelText("Período del PDF"), { target: { value: "day2-part2" } });
    expect(screen.getByRole("option", { name: /02\/10\/2026 · parte 2 de 2/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generar PDF" }));
    expect(download).toHaveBeenLastCalledWith(plan.items![2]);
  });

  it("ofrece semanas con sus fechas y cancelar no inicia una descarga", () => {
    const download = vi.fn();
    const close = vi.fn();
    const plan: ReportPdfParts = {
      pageLimit: 40, snapshotId: "9999", mode: "weekly", items: [
        { id: "week1", startDate: "2026-10-01", endDate: "2026-10-04", startPage: 1, pageCount: 30, totalPages: 30, rowCount: 380 },
        { id: "week2", startDate: "2026-10-05", endDate: "2026-10-11", startPage: 1, pageCount: 16, totalPages: 16, rowCount: 200 },
      ],
    };
    render(<ReportPdfPartsDialog plan={plan} onClose={close} onDownload={download} />);
    expect(screen.getByRole("dialog", { name: "Descargar PDF por semanas" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /05\/10\/2026 a 11\/10\/2026/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Período del PDF"), { target: { value: "week2" } });
    fireEvent.click(screen.getByRole("button", { name: "Generar PDF" }));
    expect(download).toHaveBeenCalledWith(plan.items![1]);
    download.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(close).toHaveBeenCalledOnce();
    expect(download).not.toHaveBeenCalled();
  });
});
