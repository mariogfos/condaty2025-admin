import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Pin de fuente de las dos pantallas que crean reservas desde el admin.
 *
 * Se lee SIN comentarios: el docblock que explica el defecto nombra al
 * titular, y un pin que se satisface con su propio comentario no mide nada.
 */
const sinComentarios = (ruta: string): string =>
  fs
    .readFileSync(ruta, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");

const CALENDAR = sinComentarios(path.resolve(__dirname, "../CalendarPage.tsx"));
const CREATE = sinComentarios(
  path.resolve(__dirname, "../../CreateReserva/CreateReserva.tsx"),
);

describe("la reserva va a nombre de la persona ELEGIDA", () => {
  it("el Calendario manda la persona del select, no el titular", () => {
    // Antes: `selectedReservationUnit?.titular?.id` — mostraba una persona y
    // reservaba para otra, en la disponibilidad y en el POST.
    expect(CALENDAR).toMatch(
      /selectedReservationOwnerId\s*=\s*getChoiceOwnerId\(\s*selectedReservationUnitChoice\s*\)/,
    );
    expect(CALENDAR).not.toMatch(/titular/);
  });

  it("/create-reservas manda la persona del select, no el titular", () => {
    expect(CREATE).toMatch(/getChoiceOwnerId\(\s*selectedChoice\s*\)/);
    expect(CREATE).not.toMatch(/titular/);
  });
});

describe("el mantenimiento desde el Calendario", () => {
  it("se guarda contra la ruta de dev con el cuerpo armado sin reloj", () => {
    expect(CALENDAR).toContain('url: "/v3/reservations/area-blocked"');
    expect(CALENDAR).toMatch(/buildMaintenancePayload\(\s*maintenanceDraft/);
    expect(CALENDAR).not.toContain("próximamente");
  });

  it("se ofrece con la misma habilidad que pide el API (areas:U)", () => {
    expect(CALENDAR).toMatch(/userCan\(\s*"areas",\s*"U"\s*\)/);
    expect(CALENDAR).toMatch(
      /label:\s*"Poner en mantenimiento",[\s\S]{0,80}disabled:\s*!canBlockAreas/,
    );
  });
});
