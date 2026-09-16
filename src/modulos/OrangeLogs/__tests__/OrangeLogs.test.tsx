import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrangeLogs from "../OrangeLogs";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

const PAYLOAD_CRUDO = {
  transaction_id: 16479,
  property: { urb: "UruboVillage", uv: "4", mza: "7", lote: "112" },
};

const LINEA_APERTURA = {
  id: 1,
  received_at: "2026-09-10 19:41:42",
  transaction_id: "16479",
  event: "pago",
  action: "recibida",
  action_label: "Recibida",
  dpto_id: null,
  dpto_nro: null,
  debt_dpto_id: null,
  periodo: null,
  period_year: null,
  period_month: null,
  fee_code: null,
  fee_amount: null,
  overdue_amount: null,
  amount: 2477.3,
  debt_amount_before: null,
  debt_penalty_before: null,
  debt_amount_after: null,
  debt_penalty_after: null,
  debt_status_after: null,
  debt_remaining_after: null,
  payment_id: null,
  reverted: false,
  detail: "Notificacion de pago recibida con 3 cuota(s).",
  payload: PAYLOAD_CRUDO,
};

const LINEA_CUOTA = {
  ...LINEA_APERTURA,
  id: 2,
  action: "pago_total",
  action_label: "Pago total",
  dpto_id: 42,
  dpto_nro: "M4-112-Mz07",
  debt_dpto_id: 60,
  periodo: "2026-03",
  amount: 833.85,
  debt_status_after: "P",
  detail: "Salda la expensa 2026-03 por 833.85.",
  // El desglose NO repite el documento: sólo lo trae la fila que abre.
  payload: null,
};

const respuestaCon = (data: any[]) => ({
  data: {
    success: true,
    message: "Log de notificaciones de Orange",
    data: {
      data,
      meta: { total: data.length, per_page: 50, current_page: 1, last_page: 1 },
    },
  },
});

const llamadasAlLog = () =>
  executeMock.mock.calls.filter((c) => String(c[0]) === "/orange-webhook-logs");

const ACCIONES_OK = {
  data: {
    success: true,
    data: [
      { value: "recibida", label: "Recibida" },
      { value: "pago_total", label: "Pago total" },
    ],
  },
};

/**
 * El mock responde POR URL. Devolver lo mismo a las dos llamadas haria que el
 * catalogo de acciones llegue con la forma del listado, que es justo el caso
 * que el componente tiene que tolerar — pero no el que estos tests miden.
 */
const responderPorUrl = (listado: any) => (url: string) =>
  Promise.resolve(String(url).endsWith("/actions") ? ACCIONES_OK : listado);

describe("OrangeLogs — el log del webhook en el backoffice", () => {
  beforeEach(() => {
    executeMock.mockReset();
    executeMock.mockImplementation(responderPorUrl(respuestaCon([LINEA_APERTURA, LINEA_CUOTA])));
  });

  it("pide el log con los filtros en el payload y la URL sin query string", async () => {
    render(<OrangeLogs />);

    await waitFor(() => expect(llamadasAlLog().length).toBeGreaterThan(0));

    const [url, method, payload] = llamadasAlLog()[0];
    // useAxios le pega "?" + URLSearchParams a TODO GET: una URL que ya traiga
    // query string deja el último parámetro corrompido.
    expect(String(url)).not.toContain("?");
    expect(method).toBe("GET");
    expect(payload).toEqual({ per_page: "50", page: "1" });
  });

  it("muestra la unidad, el período y cómo quedó la deuda de cada línea", async () => {
    const { container } = render(<OrangeLogs />);

    await waitFor(() => expect(container.textContent).toContain("M4-112-Mz07"));

    expect(container.textContent).toContain("2026-03");
    expect(container.textContent).toContain("833.85");
    // El estado se traduce: 'P' no le dice nada a administración.
    expect(container.textContent).toContain("Cobrada");
    expect(container.textContent).toContain("Pago total");
  });

  it("el JSON crudo se ofrece sólo en la línea que abre la notificación", async () => {
    const { container } = render(<OrangeLogs />);

    await waitFor(() => expect(container.querySelector("#orange-log-payload-1")).toBeTruthy());

    expect(container.querySelector("#orange-log-payload-1")).toBeTruthy();
    expect(container.querySelector("#orange-log-payload-2")).toBeNull();
  });

  it("al abrirlo muestra el payload tal como llegó", async () => {
    const { container } = render(<OrangeLogs />);

    await waitFor(() => expect(container.querySelector("#orange-log-payload-1")).toBeTruthy());

    const boton = container.querySelector("#orange-log-payload-1") as HTMLButtonElement;
    boton.click();

    await waitFor(() => expect(container.textContent).toContain("UruboVillage"));
    expect(container.textContent).toContain("16479");
  });

  it("un rechazo del API se muestra: una lista vacía se leería como «Orange no mandó nada»", async () => {
    executeMock.mockImplementation(
      responderPorUrl({
        data: {
          success: false,
          message: "Solo administracion puede consultar el log de Orange.",
        },
      }),
    );

    const { container } = render(<OrangeLogs />);

    await waitFor(() =>
      expect(container.textContent).toContain("Solo administracion puede consultar"),
    );
    expect(container.textContent).not.toContain("No hay notificaciones de Orange registradas");
  });

  it("cambiar un filtro vuelve a la página 1", async () => {
    const { container } = render(<OrangeLogs />);
    await waitFor(() => expect(llamadasAlLog().length).toBeGreaterThan(0));

    const nro = container.querySelector("#orange-log-nro") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(nro, "M4-112");
    nro.dispatchEvent(new Event("input", { bubbles: true }));

    await waitFor(() => {
      const llamada = llamadasAlLog().find((c) => c[2]?.nro);
      expect(llamada).toBeTruthy();
      expect(llamada?.[2]).toMatchObject({ nro: "M4-112", page: "1" });
    });
  });
});
