import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import Discounts from "../Discounts";

vi.mock("@/modulos/DebtsManager/TabComponents/AllDebts/RenderView/RenderView", () => ({
  default: () => null,
}));
vi.mock("@/modulos/PartialPayments/RenderView/RenderView", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ name, label, value, options, onChange }: any) => (
    <select aria-label={label} name={name} value={value} onChange={onChange}>
      {options.map((option: any) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  ),
}));

const instance = axios.create();
const adapter = new MockAdapter(instance);
const emptyPage = { success: true, data: { data: [], current_page: 1, last_page: 1, total: 0 } };

function renderDiscounts() {
  render(
    <AxiosContext.Provider value={{ contextInstance: instance, waiting: 0, setWaiting: vi.fn() }}>
      <Discounts />
    </AxiosContext.Provider>,
  );
}

function lastQuery() {
  return new URL(adapter.history.get.at(-1)!.url!, "https://api.test").searchParams;
}

describe("Listado de descuentos", () => {
  beforeEach(() => {
    adapter.reset();
    adapter.onGet(/\/financial-records\/discounts\?/).reply(config => {
      const query = new URL(config.url!, "https://api.test").searchParams;
      if ([query.get("status"), query.get("type")].includes("undefined")) {
        return [422, { success: false, message: "Los filtros no son válidos." }];
      }
      return [200, emptyPage];
    });
  });

  it("carga todos los descuentos sin serializar filtros ausentes como undefined", async () => {
    renderDiscounts();
    expect(await screen.findByText("No se encontraron deudas con descuento.")).toBeInTheDocument();
    expect(lastQuery().get("page")).toBe("1");
    expect(lastQuery().has("status")).toBe(false);
    expect(lastQuery().has("type")).toBe(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("envía los filtros seleccionados y los elimina al volver a Todos", async () => {
    renderDiscounts();
    await screen.findByText("No se encontraron deudas con descuento.");
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "P" } });
    await waitFor(() => expect(lastQuery().get("status")).toBe("P"));
    expect(lastQuery().has("type")).toBe(false);
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "percent" } });
    await waitFor(() => expect(lastQuery().get("type")).toBe("percent"));
    expect(lastQuery().get("status")).toBe("P");
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "all" } });
    await waitFor(() => expect(lastQuery().has("status")).toBe(false));
    expect(lastQuery().get("type")).toBe("percent");
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "all" } });
    await waitFor(() => expect(lastQuery().has("type")).toBe(false));
    expect(lastQuery().has("status")).toBe(false);
    expect(await screen.findByText("No se encontraron deudas con descuento.")).toBeInTheDocument();
  });

  it("conserva la búsqueda al cambiar un filtro y siempre consulta la primera página", async () => {
    renderDiscounts();
    await screen.findByText("No se encontraron deudas con descuento.");
    const search = screen.getByPlaceholderText("Buscar unidad o concepto");
    fireEvent.change(search, { target: { value: "  Unidad de prueba  " } });
    fireEvent.keyDown(search, { key: "Enter" });
    await waitFor(() => expect(lastQuery().get("search")).toBe("Unidad de prueba"));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "M" } });
    await waitFor(() => expect(lastQuery().get("status")).toBe("M"));
    expect(lastQuery().get("search")).toBe("Unidad de prueba");
    expect(lastQuery().get("page")).toBe("1");
    expect(lastQuery().has("type")).toBe(false);
  });

  it("no ofrece el estado en desuso E en el filtro", async () => {
    renderDiscounts();
    await screen.findByText("No se encontraron deudas con descuento.");
    expect(screen.queryByRole("option", { name: "E", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Por subir comprobante" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("option").map(option => option.getAttribute("value"))).not.toContain("E");
  });
});
