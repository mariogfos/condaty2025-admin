import { describe, expect, it } from "vitest";
import {
  buildAreaAvailabilitySnapshot,
  buildCalendarEntries,
  extractDayAvailabilityFromCalendarResponse,
} from "../helpers";
import type { ReservationListItem } from "@/modulos/Reservas/types";

describe("buildCalendarEntries", () => {
  it("muestra primero el nombre del area y luego la hora", () => {
    const reservation: ReservationListItem = {
      id: 1,
      status: "L",
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
      status: "C",
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
