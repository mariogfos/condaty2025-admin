import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Conciliation from "../Conciliation/Conciliation";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

const SUMMARY = {
  summary: [
    { client_id: "c1", currency: "BOB", total: "350.00", count: 2 },
    { client_id: "c2", currency: "BOB", total: "120.00", count: 1 },
  ],
  items: [
    {
      id: "o1",
      client_id: "c1",
      reference: "REF-1",
      pay_date: "2026-09-01",
      amount: "200.00",
      currency: "BOB",
    },
  ],
  pagination: { current_page: 1, per_page: 20, total: 3, last_page: 1 },
};

/** Faithful double: a 2xx body lives in res.data, a non-2xx in res.error.data. */
const ok = (data: any, message = "") => ({
  data: { success: true, data, message },
  error: null,
});
const fail = (status: number, message: string) => ({
  data: null,
  error: { status, message: "Request failed", data: { success: false, message } },
});

describe("Conciliation", () => {
  beforeEach(() => executeMock.mockReset());

  it("renderiza el resumen leyendo el cuerpo real de useAxios", async () => {
    executeMock.mockResolvedValue(ok(SUMMARY));
    render(<Conciliation />);

    await waitFor(() => expect(screen.getByText(/Condominio: c1/)).toBeInTheDocument());
    expect(screen.getByText("350.00 BOB")).toBeInTheDocument();
    expect(screen.getByText("REF-1")).toBeInTheDocument();
  });

  it("muestra el mensaje del backend cuando el resumen es rechazado", async () => {
    executeMock.mockResolvedValue(fail(403, "No autorizado"));
    render(<Conciliation />);

    await waitFor(() => expect(screen.getByText("No autorizado")).toBeInTheDocument());
    expect(screen.queryByText(/Condominio: c1/)).not.toBeInTheDocument();
  });

  it("concilia todo el alcance del condominio elegido, no solo la pagina visible", async () => {
    executeMock.mockImplementation(async (url?: string) =>
      String(url ?? "").includes("mark-deposited") ? ok({ updated: 3, skipped: 0 }) : ok(SUMMARY),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Conciliation />);

    await waitFor(() => expect(screen.getByText(/Condominio: c1/)).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByRole("button", { name: /Marcar Depositado/ }));

    await waitFor(() =>
      expect(executeMock).toHaveBeenCalledWith(
        "qr-dynamic/conciliation/mark-deposited",
        "POST",
        { all: true, client_id: "c1" },
      ),
    );
  });

  it("informa el rechazo del backend al conciliar", async () => {
    executeMock.mockImplementation(async (url?: string) =>
      String(url ?? "").includes("mark-deposited")
        ? fail(422, "No se encontraron ordenes pendientes de conciliacion.")
        : ok(SUMMARY),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Conciliation />);

    await waitFor(() => expect(screen.getByText(/Condominio: c1/)).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByRole("button", { name: /Marcar Depositado/ }));

    await waitFor(() =>
      expect(
        screen.getByText("No se encontraron ordenes pendientes de conciliacion."),
      ).toBeInTheDocument(),
    );
  });
});
