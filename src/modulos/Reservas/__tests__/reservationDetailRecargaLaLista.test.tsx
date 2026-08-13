/**
 * Después de una acción exitosa del detalle, la LISTA se recarga.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 POR QUÉ EXISTE ESTE ARCHIVO
 * ────────────────────────────────────────────────────────────────────────
 *
 * Mario reportó el 2026-08-13, probando a mano: cancelar una reserva dejaba la
 * lista mostrando el estado viejo, y había que apretar refresh del navegador
 * para verla bien. El API sí cancelaba; lo que no pasaba era la recarga.
 *
 * El test que ya medía estas acciones (`reservationDetailRequests.test.tsx`)
 * monta el modal **sin pasarle `reLoad`**, así que `reLoad?.()` es un no-op
 * silencioso ahí adentro: el bug le pasaba por al lado sin teñirlo de rojo.
 *
 * Acá se pasa `reLoad` como espía y se afirma lo único que importa para el
 * usuario: que después de aprobar, rechazar o cancelar, alguien pida la lista
 * de nuevo. Las tres acciones se miden por separado a propósito — el bug estaba
 * en UNA sola, y un test que las mezclara lo taparía.
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
  is_approved: ReservationApproval.PENDING,
  date_at: "2026-08-20",
  start_time: "10:00:00",
  end_time: "12:00:00",
  people_count: 5,
  // `is_free` es boolean en el tipo: el char "N" es de antes del flip.
  area: { id: 3, title: "Salón de eventos", is_free: false, price: 100 },
  owner: { id: 9, name: "Ana", last_name: "Quiroga" },
  dpto: { id: 4, nro: "B-12" },
};

/**
 * Monta el detalle con un `reLoad` espía. El axios de mentira responde
 * `success: true` a todo lo que no sea GET: acá no se mide qué se manda —eso ya
 * lo mide el otro archivo— sino qué pasa DESPUÉS de que el API dice que sí.
 */
const renderDetalle = (reserva: ReservationDetailItem = RESERVA) => {
  const reLoad = vi.fn();
  const onClose = vi.fn();

  const contextInstance = {
    request: vi.fn(async (config: any) => {
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
        <ReservationDetailModal
          open
          onClose={onClose}
          item={reserva}
          reLoad={reLoad}
        />
      </ImageModalProvider>
    </AxiosContext.Provider>,
  );

  return { reLoad, onClose, ...utils };
};

describe("El detalle recarga la lista después de una acción exitosa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aprobar recarga la lista", async () => {
    const { reLoad } = renderDetalle();

    fireEvent.click(await screen.findByText("Aprobar solicitud"));

    await waitFor(() => {
      expect(
        reLoad,
        "aprobar no pidió la lista de nuevo: la pantalla queda con el estado viejo",
      ).toHaveBeenCalled();
    });
  });

  it("rechazar recarga la lista", async () => {
    const { reLoad } = renderDetalle();

    fireEvent.click(await screen.findByText("Rechazar solicitud"));

    // El textarea del rechazo no tiene label (sale con `_noLabel_`), así que se
    // busca por placeholder — igual que en `reservationDetailRequests.test.tsx`.
    const motivo = await screen.findByPlaceholderText(
      /por qué se rechaza la reserva/i,
    );
    fireEvent.change(motivo, { target: { value: "El área está en obra" } });
    fireEvent.click(screen.getByText("Confirmar rechazo"));

    await waitFor(() => {
      expect(
        reLoad,
        "rechazar no pidió la lista de nuevo: la pantalla queda con el estado viejo",
      ).toHaveBeenCalled();
    });
  });

  it("cancelar recarga la lista — el caso que Mario vio roto a mano", async () => {
    const { reLoad } = renderDetalle({
      ...RESERVA,
      status: ReservationStatus.RESERVED_PAID,
    });

    fireEvent.click(await screen.findByText("Cancelar reserva"));

    const motivo = await screen.findByLabelText(/motivo/i);
    fireEvent.change(motivo, { target: { value: "El residente se arrepintió" } });

    // El botón de guardar del DataModal repite el texto "Cancelar reserva".
    const botones = screen.getAllByText("Cancelar reserva");
    fireEvent.click(botones[botones.length - 1]);

    await waitFor(() => {
      expect(
        reLoad,
        "cancelar no pidió la lista de nuevo: hay que refrescar el navegador para ver el estado real",
      ).toHaveBeenCalled();
    });
  });
});
