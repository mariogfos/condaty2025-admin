import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrDinamico from "../QrDinamico";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

// Las otras pestañas no participan de este corte
vi.mock("../Conciliation/Conciliation", () => ({ default: () => null }));
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
