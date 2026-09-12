import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrDinamico from "../QrDinamico";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

// Las otras pestañas no participan de este corte
vi.mock("../QrMetrics/QrMetrics", () => ({ default: () => null }));

const ORDERS_OK = {
  data: {
    success: true,
    data: {
      items: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
    },
  },
};

const ordersCalls = () =>
  executeMock.mock.calls.filter((c) => String(c[0]).includes("qr-dynamic/orders"));

describe("QrDinamico — órdenes (QR-13)", () => {
  beforeEach(() => {
    executeMock.mockReset();
    executeMock.mockResolvedValue(ORDERS_OK);
  });

  it("muestra las fechas que manda el API, no Invalid Date", async () => {
    // El API castea las fechas, así que viajan en ISO CON hora. El
    // formateador le pegaba "T00:00:00" al string entero y la tabla mostraba
    // "Invalid Date" en Fecha orden y en Vencimiento.
    executeMock.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              id: "o-1",
              reference: "CONDATY-ABC",
              amount: "600.00",
              currency: "BOB",
              order_state: 1,
              payment_type: "2",
              order_date: "2026-09-10T00:00:00.000000Z",
              pay_date: null,
              expiration_date: "2026-09-25T00:00:00.000000Z",
            },
          ],
          pagination: { current_page: 1, last_page: 1, total: 1 },
        },
      },
    });

    const { container } = render(<QrDinamico />);

    await waitFor(() =>
      expect(container.textContent).toContain("CONDATY-ABC"),
    );
    expect(container.textContent).not.toContain("Invalid Date");
    expect(container.textContent).toContain("2026");
  });

  it("muestra a qué unidad y concepto pertenece cada QR", async () => {
    // La referencia y el monto no dicen de quién es el cobro. El servidor
    // resuelve las dos cosas: el front no tiene con qué distinguir una
    // expensa de una reserva.
    executeMock.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              id: "o-1",
              reference: "CONDATY-ABC",
              amount: "600.00",
              currency: "BOB",
              order_state: 1,
              payment_type: "2",
              order_date: "2026-09-10T00:00:00.000000Z",
              pay_date: null,
              expiration_date: "2026-09-25T00:00:00.000000Z",
              unit: "A-101",
              concept: "09/2026",
            },
            {
              id: "o-2",
              reference: "CONDATY-XYZ",
              amount: "300.00",
              currency: "BOB",
              order_state: 1,
              payment_type: "3",
              order_date: "2026-09-10T00:00:00.000000Z",
              pay_date: null,
              expiration_date: "2026-09-25T00:00:00.000000Z",
              unit: "B-202",
              concept: "Salón de eventos",
            },
          ],
          pagination: { current_page: 1, last_page: 1, total: 2 },
        },
      },
    });

    const { container } = render(<QrDinamico />);

    await waitFor(() =>
      expect(container.textContent).toContain("CONDATY-ABC"),
    );
    expect(container.textContent).toContain("A-101");
    expect(container.textContent).toContain("09/2026");
    // La reserva muestra el área en lugar del período
    expect(container.textContent).toContain("B-202");
    expect(container.textContent).toContain("Salón de eventos");
  });

  it("una orden sin unidad ni concepto no rompe la fila", async () => {
    executeMock.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [
            {
              id: "o-3",
              reference: "CONDATY-SIN",
              amount: "100.00",
              currency: "BOB",
              order_state: 1,
              payment_type: null,
              order_date: "2026-09-10T00:00:00.000000Z",
              pay_date: null,
              expiration_date: null,
            },
          ],
          pagination: { current_page: 1, last_page: 1, total: 1 },
        },
      },
    });

    const { container } = render(<QrDinamico />);

    await waitFor(() =>
      expect(container.textContent).toContain("CONDATY-SIN"),
    );
    expect(container.textContent).not.toContain("undefined");
    expect(container.textContent).not.toMatch(/Invalid/i);
  });

  it("los filtros viajan como payload y la URL queda sin query string", async () => {
    render(<QrDinamico />);

    await waitFor(() => expect(ordersCalls().length).toBeGreaterThan(0));

    const [url, method, payload] = ordersCalls()[0];
    // useAxios concatena "?" + URLSearchParams en TODO GET: si la URL ya
    // trae query string, el último parámetro queda corrompido
    expect(url).toBe("qr-dynamic/orders");
    expect(String(url)).not.toContain("?");
    expect(method).toBe("GET");
    expect(payload).toEqual({ per_page: "40", page: "1" });
  });

  it("un filtro nuevo viaja en el payload, no pegado a la URL", async () => {
    const { container } = render(<QrDinamico />);
    await waitFor(() => expect(ordersCalls().length).toBeGreaterThan(0));

    const stateSelect = container.querySelector(
      "#filter-state",
    ) as HTMLSelectElement;
    stateSelect.value = "2";
    stateSelect.dispatchEvent(new Event("change", { bubbles: true }));

    await waitFor(() => {
      const call = ordersCalls().find((c) => c[2]?.order_state);
      expect(call).toBeTruthy();
      expect(call?.[0]).toBe("qr-dynamic/orders");
      expect(call?.[2]).toEqual({
        order_state: "2",
        per_page: "40",
        page: "1",
      });
    });
  });
});
