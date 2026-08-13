/**
 * El detalle abierto SOLO con `reservationId` (Notifications y DebtsManager lo
 * abren así, sin `item`) tiene que distinguir TRES estados: cargando, error y
 * no-encontrada.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 EL BUG QUE ESTE ARCHIVO PINEA (review 4R del 2026-08-12)
 * ────────────────────────────────────────────────────────────────────────
 *
 * `RenderView.tsx` usaba UNA sola condición para dos cosas distintas:
 *
 * ```tsx
 * <LoadingScreen onlyLoading={detail.isEmpty && open}>
 *   {detail.isEmpty ? noEncontrada : contenido}
 * ```
 *
 * `isEmpty` gobernaba el esqueleto Y el branch de "Reserva no encontrada" a la
 * vez, así que el texto de no-encontrada era código MUERTO: cuando `isEmpty`
 * era true, el `LoadingScreen` mostraba el esqueleto y los children ni se
 * montaban. Si el DET fallaba (red caída, 404), `data` quedaba null →
 * `isEmpty` true → **esqueleto para siempre**, sin mensaje y sin reintento.
 *
 * `useReservationDetail` DESCARTABA el `loaded` y el `error` que `useAxios` ya
 * devuelve: la información para distinguir "todavía no respondió" de "falló"
 * estaba ahí y no se usaba.
 *
 * ## Reinyección, medida el 2026-08-13
 *
 * Con el bug puesto de vuelta (esqueleto condicionado a `isEmpty` y sin el
 * branch de error): **3/4 rojos** — sólo el caso "mientras espera" quedaba
 * verde. Con el fix: 4/4 verdes.
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { ImageModalProvider } from "@/contexts/ImageModalContext";
import ReservationDetailModal from "../RenderView/RenderView";
import { RESERVATION_DETAIL_COPY } from "../config/reservas.constants";
import {
  ReservationStatus,
  type ReservationDetailItem,
} from "../Type/ReservaType";

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

const RESERVA: ReservationDetailItem = {
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
 * Monta el detalle SIN `item`, sólo con el id — el camino de Notifications.
 * `respond` decide qué contesta el API en cada GET (por número de llamada).
 */
const renderSoloConId = (respond: (getCall: number) => Promise<any>) => {
  let getCalls = 0;

  const contextInstance = {
    request: vi.fn(async (config: { url: string; method: string }) => {
      if (config.method === "GET") {
        getCalls += 1;
        return respond(getCalls);
      }
      return { data: { success: true } };
    }),
  };

  const utils = render(
    <AxiosContext.Provider
      value={{ contextInstance, waiting: 0, setWaiting: vi.fn() }}
    >
      <ImageModalProvider>
        <ReservationDetailModal open onClose={vi.fn()} reservationId={77} />
      </ImageModalProvider>
    </AxiosContext.Provider>,
  );

  return { ...utils, contextInstance, getGetCalls: () => getCalls };
};

describe("Detalle de reserva — cargando, error y no-encontrada son TRES estados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mientras el DET no respondió: ni 'no encontrada', ni error, ni contenido", async () => {
    // Una promesa que no se resuelve nunca: el request queda EN VUELO.
    renderSoloConId(() => new Promise(() => {}));

    // Deja correr el efecto de montaje de useAxios.
    await waitFor(() => expect(screen.queryByText("Detalle de la reserva")).toBeTruthy());

    expect(
      screen.queryByText(RESERVATION_DETAIL_COPY.notFound),
      "con el request en vuelo no puede afirmar que la reserva no existe",
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(RESERVATION_DETAIL_COPY.loadError),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Aprobar solicitud")).not.toBeInTheDocument();
  });

  it("si el DET FALLA no queda el esqueleto eterno: muestra el error con Reintentar", async () => {
    renderSoloConId(() => Promise.reject(new Error("Network Error")));

    // 🔴 Acá se colgaba: con `data` null, `isEmpty` era true y el esqueleto
    // quedaba para siempre. Ni mensaje, ni botón, ni forma de salir.
    expect(
      await screen.findByText(RESERVATION_DETAIL_COPY.loadError),
    ).toBeInTheDocument();
    expect(
      screen.getByText(RESERVATION_DETAIL_COPY.retry),
    ).toBeInTheDocument();
  });

  it("Reintentar vuelve a pedir el DET y, si ahora responde, muestra la reserva", async () => {
    const { getGetCalls } = renderSoloConId((getCall) =>
      getCall === 1
        ? Promise.reject(new Error("Network Error"))
        : Promise.resolve({ data: { data: { reservation: RESERVA } } }),
    );

    fireEvent.click(await screen.findByText(RESERVATION_DETAIL_COPY.retry));

    // El reintento sale de verdad (2º GET) y el contenido reemplaza al error.
    expect(await screen.findByText("Aprobar solicitud")).toBeInTheDocument();
    expect(getGetCalls()).toBe(2);
    expect(
      screen.queryByText(RESERVATION_DETAIL_COPY.loadError),
    ).not.toBeInTheDocument();
  });

  it("si el API respondió pero SIN reserva, dice 'no encontrada' (era código muerto)", async () => {
    renderSoloConId(() => Promise.resolve({ data: { data: {} } }));

    // 🔴 Este texto existía en el JSX y era INALCANZABLE: la misma condición
    // que lo elegía prendía el esqueleto que lo tapaba.
    expect(
      await screen.findByText(RESERVATION_DETAIL_COPY.notFound),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(RESERVATION_DETAIL_COPY.retry),
      "no-encontrada no es un fallo de red: reintentar no aplica",
    ).not.toBeInTheDocument();
  });
});
