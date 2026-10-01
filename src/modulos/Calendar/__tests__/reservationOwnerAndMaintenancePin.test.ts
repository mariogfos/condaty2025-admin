import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Pin de fuente del Calendario: la reserva va a nombre de la persona ELEGIDA y
 * el mantenimiento se guarda contra la ruta de dev.
 *
 * ⚠️ Por qué un pin y no un render: `CalendarPage.tsx` son ~2.900 líneas que
 * al montarse piden áreas, el listado del mes y la disponibilidad de cada área
 * por separado, y el alta exige recorrer el menú contextual del día y un modal
 * de dos pasos. `/create-reservas` sí se mide renderizando
 * (`CreateReserva/__tests__/createReservationSendsChosenPerson.test.tsx`).
 *
 * Para que el pin no se conforme con nombres sueltos, afirma la expresión
 * EXACTA de cada `owner_id` que sale (el GET del calendario y el POST) y de
 * dónde sale ese valor. Se lee SIN comentarios: un pin que se satisface con su
 * propio comentario no mide nada.
 */
const stripComments = (filePath: string): string =>
  fs
    .readFileSync(filePath, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");

const CALENDAR_SOURCE = stripComments(path.resolve(__dirname, "../CalendarPage.tsx"));

describe("el Calendario reserva a nombre de la persona ELEGIDA", () => {
  it("el owner_id sale de la opcion elegida, no del titular", () => {
    expect(CALENDAR_SOURCE).toMatch(
      /const selectedReservationOwnerId\s*=\s*getChoiceOwnerId\(\s*selectedReservationUnitChoice\s*\);/,
    );
    expect(CALENDAR_SOURCE).not.toMatch(/titular/);
  });

  it("el GET del calendario y el POST mandan exactamente ese owner_id", () => {
    // Son dos: los params de la disponibilidad y el cuerpo del alta. Un
    // `owner_id: selectedReservationUnit.homeowner?.id` en cualquiera de los
    // dos rompe este pin.
    const ownerIdLines = CALENDAR_SOURCE.match(/owner_id\s*:[^,\n]*/g) ?? [];
    expect(ownerIdLines).toEqual([
      "owner_id: selectedReservationOwnerId",
      "owner_id: selectedReservationOwnerId",
    ]);
  });
});

describe("el mantenimiento desde el Calendario", () => {
  it("se guarda contra la ruta de dev con el cuerpo armado sin reloj", () => {
    expect(CALENDAR_SOURCE).toContain('url: "/v3/reservations/area-blocked"');
    expect(CALENDAR_SOURCE).toMatch(/buildMaintenancePayload\(\s*maintenanceDraft/);
    expect(CALENDAR_SOURCE).not.toContain("próximamente");
  });

  it("se habilita con la misma habilidad que pide el API (areas:U)", () => {
    expect(CALENDAR_SOURCE).toMatch(/userCan\(\s*"areas",\s*"U"\s*\)/);
    expect(CALENDAR_SOURCE).toMatch(
      /label:\s*"Poner en mantenimiento",[\s\S]{0,80}disabled:\s*!canBlockAreas/,
    );
  });
});
