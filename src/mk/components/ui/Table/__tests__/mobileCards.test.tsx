import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Table from "../Table";

vi.mock("@/mk/hooks/useScrollbarWidth", () => ({
  default: () => 0,
}));

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

const renderReservationTable = (mobile: boolean) => {
  vi.stubGlobal("matchMedia", () => ({
    matches: mobile,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  const onRowClick = vi.fn();
  render(
    <Table
      header={[{ key: "area", label: "Área social", responsive: "" }]}
      data={[{ id: 1, area: "Quincho" }]}
      onRowClick={onRowClick}
      onTabletRow={(item, _index, onClick) => (
        <button type="button" onClick={() => onClick(item)}>
          Tarjeta {item.area}
        </button>
      )}
      enableMobileCards
      height="100%"
    />,
  );
  return onRowClick;
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Table mobile cards opt-in", () => {
  it("muestra tarjeta táctil sin cabecera en móvil y conserva el clic de detalle", async () => {
    const onRowClick = renderReservationTable(true);

    const card = await screen.findByRole("button", { name: "Tarjeta Quincho" });
    expect(screen.queryByText("Área social")).not.toBeInTheDocument();
    fireEvent.click(card);
    expect(onRowClick).toHaveBeenCalledWith({ id: 1, area: "Quincho" });
  });

  it("conserva la tabla original en escritorio", async () => {
    renderReservationTable(false);

    await waitFor(() => expect(screen.getByText("Área social")).toBeInTheDocument());
    expect(screen.getByText("Quincho")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tarjeta Quincho" })).not.toBeInTheDocument();
  });
});
