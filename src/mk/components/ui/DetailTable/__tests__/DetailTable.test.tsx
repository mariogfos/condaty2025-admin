import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DetailTable, { type DetailTableColumn } from "../DetailTable";

type Payment = { id: string; name: string; amount: number };
const payment: Payment = { id: "payment-1", name: "Pagador con nombre completo", amount: 0 };
const columns: DetailTableColumn<Payment>[] = [
  { key: "name", label: "Pagado por" },
  { key: "amount", label: "Monto", align: "end" },
];

describe("DetailTable", () => {
  it("keeps the complete data, including zero, in one semantic table", () => {
    render(<DetailTable label="Pagos aplicados" columns={columns} data={[payment]} />);
    const table = screen.getByRole("table", { name: "Pagos aplicados" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    expect(within(table).getByText(payment.name)).toBeInTheDocument();
    expect(within(table).getByText("0")).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(2);
  });

  it("opens the selected record by click, Enter and Space", () => {
    const open = vi.fn();
    render(<DetailTable label="Pagos" columns={columns} data={[payment]} onRowClick={open} rowLabel={() => "Ver pago 1"} />);
    const row = screen.getByRole("row", { name: "Ver pago 1" });
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    expect(open).toHaveBeenCalledTimes(3);
    expect(open).toHaveBeenLastCalledWith(payment);
  });

  it("does not open a second detail when a receipt action is used", () => {
    const open = vi.fn();
    const download = vi.fn();
    render(<DetailTable label="Pagos" data={[payment]} onRowClick={open} columns={[
      ...columns,
      { key: "receipt", label: "Comprobante", onRender: () => <button onClick={download}>Ver comprobante</button> },
    ]} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver comprobante" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Ver comprobante" }), { key: "Enter" });
    expect(download).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
  });

  it("shows an empty state without artificial rows", () => {
    render(<DetailTable label="Pagos" columns={columns} data={[]} />);
    expect(screen.getByRole("cell", { name: "No hay registros para mostrar." })).toHaveAttribute("colspan", "2");
  });
});
