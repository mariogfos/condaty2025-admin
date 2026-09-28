import { describe, expect, it } from "vitest";
import { buildCalendarMaintenancePayload } from "../maintenance";

const now = new Date(2026, 8, 28, 13, 15, 0);

describe("buildCalendarMaintenancePayload", () => {
  it("bloquea solo lo que queda del día actual y limpia el motivo", () => {
    expect(
      buildCalendarMaintenancePayload(
        { areaId: "area-1", scope: "day", endDate: "", reason: "  Pintura  " },
        "2026-09-28",
        now,
      ),
    ).toEqual({
      area_id: "area-1",
      date_at: "2026-09-28 13:15:00",
      date_end: "2026-09-28 23:59:59",
      reason: "Pintura",
    });
  });

  it("envía un rango futuro completo al contrato de Áreas sociales", () => {
    expect(
      buildCalendarMaintenancePayload(
        {
          areaId: "area-2",
          scope: "range",
          endDate: "2026-10-03",
          reason: "Limpieza",
        },
        "2026-10-01",
        now,
      ),
    ).toEqual({
      area_id: "area-2",
      date_at: "2026-10-01 00:00:00",
      date_end: "2026-10-03 23:59:59",
      reason: "Limpieza",
    });
  });

  it("no permite rango invertido ni fecha pasada", () => {
    const draft = {
      areaId: "area-1",
      scope: "range" as const,
      endDate: "2026-09-28",
      reason: "Pintura",
    };
    expect(() => buildCalendarMaintenancePayload(draft, "2026-09-29", now)).toThrow(
      "fecha final",
    );
    expect(() => buildCalendarMaintenancePayload(draft, "2026-09-27", now)).toThrow(
      "fecha de inicio",
    );
  });

  it("exige motivo y área antes de enviar", () => {
    expect(() =>
      buildCalendarMaintenancePayload(
        { areaId: "area-1", scope: "day", endDate: "", reason: "  " },
        "2026-09-28",
        now,
      ),
    ).toThrow("motivo");
    expect(() =>
      buildCalendarMaintenancePayload(
        { areaId: "", scope: "day", endDate: "", reason: "Pintura" },
        "2026-09-28",
        now,
      ),
    ).toThrow("área");
  });
});
