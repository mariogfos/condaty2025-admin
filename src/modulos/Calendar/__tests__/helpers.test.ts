import { describe, expect, it } from "vitest";
import {
  buildAreaAvailabilitySnapshot,
  buildCalendarEntries,
  extractDayAvailabilityFromCalendarResponse,
  getReservationStatusMeta,
} from "../helpers";
import { shouldShowReservationPaymentTimeLimit } from "@/modulos/Reservas/utils/reservationStatus";
import { mergeResolvedPaymentIntoReservation } from "@/modulos/Reservas/utils/reservationPayment";
import { ReservationStatus } from "@/modulos/Reservas/constants/reservationConstants";
import type { ReservationListItem } from "@/modulos/Reservas/types";

describe("buildCalendarEntries", () => {
  it("muestra primero el nombre del area y luego la hora", () => {
    const reservation: ReservationListItem = {
      id: 1,
      status: ReservationStatus.RESERVED_PAID,
      date_at: "2026-05-18",
      date_end: "2026-05-18",
      start_time: "09:00",
      end_time: "10:00",
      area: {
        id: 7,
        title: "Salon social",
      },
      dpto: {
        id: 2,
        nro: "101",
      },
    };

    const entries = buildCalendarEntries(
      [reservation],
      new Date("2026-05-01T00:00:00"),
      new Date("2026-05-31T23:59:59"),
    );

    expect(entries.get("2026-05-18")?.[0]?.chipLabel).toBe(
      "Salon Social 09:00 - 10:00",
    );
  });

  it("mantiene el mismo orden tambien en reservas de todo el dia", () => {
    const reservation: ReservationListItem = {
      id: 2,
      status: ReservationStatus.CANCELLED_MANUAL,
      date_at: "2026-05-20",
      date_end: "2026-05-20",
      start_time: "00:00",
      end_time: "23:59",
      area: {
        id: 8,
        title: "Quincho",
      },
    };

    const entries = buildCalendarEntries(
      [reservation],
      new Date("2026-05-01T00:00:00"),
      new Date("2026-05-31T23:59:59"),
    );

    expect(entries.get("2026-05-20")?.[0]?.chipLabel).toBe(
      "Quincho Todo el dia",
    );
  });

  it("extrae disponibilidad diaria desde la estructura mensual del calendario", () => {
    const availability = extractDayAvailabilityFromCalendarResponse(
      {
        reserved: ["2026-05-18"],
        days: {
          18: {
            available: ["10:00-11:00", "08:00 - 09:00"],
            unavailable: ["09:00-10:00"],
            maintenance: ["12:00-13:00"],
          },
        },
      },
      "2026-05-18",
    );

    expect(availability).toEqual({
      available: ["08:00 - 09:00", "10:00 - 11:00"],
      unavailable: ["09:00 - 10:00"],
      maintenance: ["12:00 - 13:00"],
      reserved: true,
    });
  });

  // NOTA: los campos debt_dpto.status / payment.status son dominio DEUDA/PAGO.
  // Tras S6.5 slices 1-2 llegan numéricos en producción y la API ya entrega
  // reservations.status resuelto; la derivación string de estos compares es
  // DEFERRED (slice de string-stragglers). Estos casos caracterizan el code path
  // tal como está hoy (entrada string de deuda/pago) y se re-migran en ese slice.
  it("muestra por confirmar cuando una reserva pendiente ya tiene pago enviado", () => {
    const reservation: ReservationListItem = {
      id: 3,
      status: ReservationStatus.PENDING_PAYMENT,
      date_at: "2026-05-18",
      date_end: "2026-05-18",
      start_time: "09:00",
      end_time: "10:00",
      debt_dpto: {
        payment_id: 99,
        status: "A",
        payment: {
          status: "S",
        },
      },
    };

    expect(getReservationStatusMeta(reservation)).toMatchObject({
      status: ReservationStatus.PAYMENT_SUBMITTED,
      label: "Por confirmar",
    });
    expect(
      shouldShowReservationPaymentTimeLimit(ReservationStatus.PAYMENT_SUBMITTED),
    ).toBe(false);
  });

  it("muestra por confirmar cuando solo viene el identificador del pago enviado", () => {
    const reservation: ReservationListItem = {
      id: 4,
      status: ReservationStatus.PENDING_PAYMENT,
      date_at: "2026-05-18",
      date_end: "2026-05-18",
      start_time: "09:00",
      end_time: "10:00",
      debt_dpto: {
        payment_id: 100,
        status: "A",
      },
    };

    expect(getReservationStatusMeta(reservation)).toMatchObject({
      status: ReservationStatus.PAYMENT_SUBMITTED,
      label: "Por confirmar",
    });
    expect(
      shouldShowReservationPaymentTimeLimit(ReservationStatus.PAYMENT_SUBMITTED),
    ).toBe(false);
  });

  it("muestra por confirmar cuando el pago resuelto se carga despues de la lista", () => {
    const reservation: ReservationListItem = {
      id: 5,
      status: ReservationStatus.PENDING_PAYMENT,
      date_at: "2026-05-18",
      date_end: "2026-05-18",
      start_time: "09:00",
      end_time: "10:00",
      debt_dpto: {
        id: 500,
        status: "A",
      },
    };

    const resolvedReservation = mergeResolvedPaymentIntoReservation(reservation, {
      paymentId: 101,
      paymentStatus: "S",
    });

    expect(getReservationStatusMeta(resolvedReservation)).toMatchObject({
      status: ReservationStatus.PAYMENT_SUBMITTED,
      label: "Por confirmar",
    });
    expect(
      shouldShowReservationPaymentTimeLimit(ReservationStatus.PAYMENT_SUBMITTED),
    ).toBe(false);
  });

  it("mapea el estado numerico de reserva a su configuracion de display", () => {
    const maintenance: ReservationListItem = {
      id: 6,
      status: ReservationStatus.MAINTENANCE,
      date_at: "2026-05-18",
      date_end: "2026-05-18",
      start_time: "09:00",
      end_time: "10:00",
    };

    expect(getReservationStatusMeta(maintenance)).toMatchObject({
      status: ReservationStatus.MAINTENANCE,
      label: "Mantenimiento",
      color: "#FF3B30",
    });

    // El límite de pago solo aplica a "Pago pendiente" (PENDING_PAYMENT).
    expect(
      shouldShowReservationPaymentTimeLimit(ReservationStatus.PENDING_PAYMENT),
    ).toBe(true);
    expect(
      shouldShowReservationPaymentTimeLimit(ReservationStatus.RESERVED_PAID),
    ).toBe(false);
  });

  it("prioriza los turnos disponibles en tiempo real para el area", () => {
    const snapshot = buildAreaAvailabilitySnapshot(
      {
        id: 9,
        title: "Piscina",
        booking_mode: "hour",
        available_days: ["Lunes"],
        available_hours: {
          Lunes: ["08:00-09:00", "09:00-10:00"],
        },
      },
      new Date("2026-05-18T00:00:00"),
      {
        available: ["11:00-12:00", "10:00-11:00"],
        unavailable: [],
        maintenance: [],
        reserved: false,
      },
    );

    expect(snapshot).toMatchObject({
      isAvailable: true,
      source: "live",
      slots: ["10:00 - 11:00", "11:00 - 12:00"],
    });
  });

  it("usa la configuracion del area cuando no hay disponibilidad en tiempo real", () => {
    const snapshot = buildAreaAvailabilitySnapshot(
      {
        id: 10,
        title: "Terraza",
        booking_mode: "day",
        available_days: ["Lunes"],
      },
      new Date("2026-05-18T00:00:00"),
    );

    expect(snapshot).toMatchObject({
      isAvailable: true,
      source: "schedule",
      slots: ["Todo el dia"],
    });
  });
});
