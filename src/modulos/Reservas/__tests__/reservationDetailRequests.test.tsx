/**
 * Lo que el detalle de una reserva le PIDE al API, medido en el borde real.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 POR QUÉ ESTE TEST MIDE ACÁ Y NO EN EL CÓDIGO FUENTE
 * ────────────────────────────────────────────────────────────────────────
 *
 * Los dos bugs que cierra este archivo se escaparon de los pines que ya
 * existían (`Sprint128AxiosApiPrefixPin`) porque esos pines leen el fuente
 * buscando DOS formas concretas de escribir una llamada: la clave `url:` de un
 * objeto de config de axios, y un `execute(` con el path pegado.
 *
 * El detalle no usaba ninguna de las dos: pasaba el path como PRIMER ARGUMENTO
 * de `useAxios(…)`. Los pines quedaron VERDES con el 404 puesto.
 *
 * Así que este test no mira el fuente: monta el componente con una instancia de
 * axios de mentira metida por el `AxiosContext` real, deja que el código haga
 * lo que hace, y ANOTA CADA PETICIÓN QUE SALE. No importa cómo esté escrita la
 * llamada —`useAxios(url)`, `execute(url)`, `instance.request({url})`, o la
 * forma que se invente mañana—: todas terminan en el mismo `request`, y todas
 * quedan registradas.
 *
 * ## Reinyección, medida el 2026-08-12 (7 casos en total)
 *
 * | bug puesto de vuelta                                    | rojos |
 * |---------------------------------------------------------|------|
 * | el `useAxios(…)` del detalle con `/api/v3/reservations`  | 2/7  |
 * | `RESERVATIONS_V3_BASE` entera con el prefijo `/api`      | 5/7  |
 * | `is_approved: "Y"` al aprobar                            | 1/7  |
 * | la ruta de aprobar sin `/v3`                             | 1/7  |
 *
 * La primera fila es el bug EXACTO tal como estaba en producción, y es la que
 * importa: dos rojos, no cero como daban los pines de fuente.
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { ImageModalProvider } from "@/contexts/ImageModalContext";
import ReservationDetailModal from "../RenderView/RenderView";
import {
  ReservationApproval,
  ReservationStatus,
  type ReservationDetailItem,
} from "../Type/ReservaType";

// El modal de pago sólo se monta al apretar "Ver pago"; se corta acá para no
// arrastrar el módulo de Pagos entero adentro de este test.
vi.mock("@/modulos/Payments/RenderView/RenderView", () => ({
  default: () => <div data-testid="payment-modal" />,
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast: vi.fn(),
  }),
}));

type RecordedRequest = {
  url: string;
  method: string;
  data?: any;
};

const RESERVA_ESPERANDO: ReservationDetailItem = {
  id: 77,
  status: ReservationStatus.AWAITING_APPROVAL,
  date_at: "2026-09-04",
  date_end: "2026-09-04",
  start_time: "18:00:00",
  end_time: "22:00:00",
  people_count: 12,
  amount: "350.00",
  created_at: "2026-08-30T14:05:00",
  area: { id: 3, title: "Salón de eventos", price: "350.00" },
  owner: { id: 9, name: "Ana", last_name: "Quiroga" },
  dpto: { id: 4, nro: "B-12" },
};

/**
 * Monta el detalle con una instancia de axios que anota todo lo que sale.
 */
const renderDetalle = (
  reserva: ReservationDetailItem = RESERVA_ESPERANDO,
  onClose = vi.fn(),
) => {
  const requests: RecordedRequest[] = [];

  const contextInstance = {
    request: vi.fn(async (config: RecordedRequest) => {
      requests.push({
        url: String(config.url),
        method: config.method,
        data: config.data,
      });

      if (config.method === "GET") {
        return { data: { data: { reservation: reserva } } };
      }

      return { data: { success: true, message: "listo" } };
    }),
  };

  const utils = render(
    <AxiosContext.Provider
      value={{ contextInstance, waiting: 0, setWaiting: vi.fn() }}
    >
      <ImageModalProvider>
        <ReservationDetailModal open onClose={onClose} item={reserva} />
      </ImageModalProvider>
    </AxiosContext.Provider>,
  );

  return { requests, contextInstance, onClose, ...utils };
};

/** La primera petición que matchea, o undefined. */
const buscarRequest = (
  requests: RecordedRequest[],
  predicate: (request: RecordedRequest) => boolean,
) => requests.find(predicate);

describe("Detalle de reserva — lo que le pide al API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("NINGUNA petición sale con el prefijo /api: el baseURL ya lo trae", async () => {
    const { requests } = renderDetalle();

    await waitFor(() => expect(requests.length).toBeGreaterThan(0));

    const conPrefijo = requests.filter((request) =>
      request.url.startsWith("/api/"),
    );

    expect(
      conPrefijo.map((request) => `${request.method} ${request.url}`),
      "axios concatena baseURL + url y el baseURL ya termina en /api. " +
        "Un path que arranca con /api/ sale a /api/api/... → 404.",
    ).toEqual([]);
  });

  it("pide el detalle a /v3/reservations con fullType=DET", async () => {
    const { requests } = renderDetalle();

    await waitFor(() => {
      const detalle = buscarRequest(
        requests,
        (request) => request.method === "GET",
      );
      expect(detalle).toBeDefined();
      expect(detalle?.url.split("?")[0]).toBe("/v3/reservations");
      expect(detalle?.url).toContain("fullType=DET");
      expect(detalle?.url).toContain("searchBy=77");
    });
  });

  it("Aprobar manda is_approved NUMÉRICO (2) a /v3/reservations/{id}", async () => {
    const { requests, onClose } = renderDetalle();

    fireEvent.click(await screen.findByText("Aprobar solicitud"));

    await waitFor(() => {
      const put = buscarRequest(requests, (request) => request.method === "PUT");
      expect(put, "el botón Aprobar no disparó ninguna petición").toBeDefined();
      expect(put?.url).toBe("/v3/reservations/77");
      expect(put?.data?.is_approved).toBe(ReservationApproval.APPROVED);
      expect(put?.data?.is_approved).toBe(2);
      // El char de antes del flip: `ReservationUpdateRequest` responde 422.
      expect(put?.data?.is_approved).not.toBe("Y");
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("Rechazar manda is_approved NUMÉRICO (3) con el motivo", async () => {
    const { requests } = renderDetalle();

    fireEvent.click(await screen.findByText("Rechazar solicitud"));

    const motivo = await screen.findByPlaceholderText(
      /por qué se rechaza la reserva/i,
    );
    fireEvent.change(motivo, { target: { value: "El área está en obra" } });
    fireEvent.click(screen.getByText("Confirmar rechazo"));

    await waitFor(() => {
      const put = buscarRequest(requests, (request) => request.method === "PUT");
      expect(put).toBeDefined();
      expect(put?.url).toBe("/v3/reservations/77");
      expect(put?.data?.is_approved).toBe(ReservationApproval.REJECTED);
      expect(put?.data?.is_approved).toBe(3);
      expect(put?.data?.is_approved).not.toBe("N");
      expect(put?.data?.reason).toBe("El área está en obra");
    });
  });

  it("Rechazar sin motivo NO llama al API y muestra el error", async () => {
    const { requests } = renderDetalle();

    fireEvent.click(await screen.findByText("Rechazar solicitud"));
    fireEvent.click(await screen.findByText("Confirmar rechazo"));

    expect(
      await screen.findByText("Debe ingresar un motivo para el rechazo."),
    ).toBeInTheDocument();

    expect(
      requests.filter((request) => request.method === "PUT"),
    ).toHaveLength(0);
  });

  it("una reserva ya reservada no ofrece Aprobar ni Rechazar", async () => {
    renderDetalle({
      ...RESERVA_ESPERANDO,
      status: ReservationStatus.RESERVED_PAID,
    });

    // ⚠️ El nombre del área sale DOS veces (el título del bloque y la fila
    // "Área social" del cuadro), así que no sirve de ancla con `findByText`.
    await screen.findByText("Cancelar reserva");

    expect(screen.queryByText("Aprobar solicitud")).not.toBeInTheDocument();
    expect(screen.queryByText("Rechazar solicitud")).not.toBeInTheDocument();
    expect(screen.getByText("Cancelar reserva")).toBeInTheDocument();
  });

  it("Cancelar manda el status NUMÉRICO 7 (CANCELLED_MANUAL)", async () => {
    const { requests } = renderDetalle({
      ...RESERVA_ESPERANDO,
      status: ReservationStatus.RESERVED_PAID,
    });

    fireEvent.click(await screen.findByText("Cancelar reserva"));

    const motivo = await screen.findByLabelText(/motivo/i);
    fireEvent.change(motivo, { target: { value: "El residente se arrepintió" } });

    // El botón de guardar del DataModal repite el texto "Cancelar reserva".
    const botones = screen.getAllByText("Cancelar reserva");
    fireEvent.click(botones[botones.length - 1]);

    await waitFor(() => {
      const put = buscarRequest(requests, (request) => request.method === "PUT");
      expect(put).toBeDefined();
      expect(put?.url).toBe("/v3/reservations/77");
      expect(put?.data?.status).toBe(ReservationStatus.CANCELLED_MANUAL);
      expect(put?.data?.status).toBe(7);
      expect(put?.data?.reason).toBe("El residente se arrepintió");
    });
  });
});
