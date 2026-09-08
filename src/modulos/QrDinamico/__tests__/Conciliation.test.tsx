import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Conciliation from "../Conciliation/Conciliation";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

const summaryResponse = {
  data: {
    success: true,
    data: {
      summary: [
        { client_id: "client-1", currency: "BOB", total: "300", count: 3 },
      ],
      items: [
        {
          id: "order-visible-1",
          client_id: "client-1",
          reference: "CONDATY-1",
          pay_date: "2026-09-08",
          amount: "100",
          currency: "BOB",
        },
      ],
      pagination: { current_page: 1, last_page: 3, total: 3 },
    },
  },
};

describe("QrDinamico conciliation", () => {
  beforeEach(() => {
    executeMock.mockReset();
    executeMock.mockImplementation(async (_url: string, method: string) =>
      method === "POST"
        ? { data: { success: true, data: { updated: 3 } } }
        : summaryResponse,
    );
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    vi.stubGlobal("alert", vi.fn());
  });

  it("envia el cliente seleccionado para conciliar tambien las ordenes no visibles", async () => {
    render(<Conciliation />);

    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Marcar Depositado \(1 seleccionados\)/,
      }),
    );

    await waitFor(() =>
      expect(executeMock).toHaveBeenCalledWith(
        "qr-dynamic/conciliation/mark-deposited",
        "POST",
        { client_ids: ["client-1"] },
      ),
    );

    expect(executeMock).not.toHaveBeenCalledWith(
      "qr-dynamic/conciliation/mark-deposited",
      "POST",
      { order_ids: ["order-visible-1"] },
    );
  });
});
