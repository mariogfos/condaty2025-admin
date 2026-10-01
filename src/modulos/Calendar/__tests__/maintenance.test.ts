import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMaintenancePayload, type MaintenanceDraft } from "../maintenance";

const draft = (overrides: Partial<MaintenanceDraft> = {}): MaintenanceDraft => ({
  areaId: "7",
  scope: "day",
  endDate: "",
  reason: "  Pintura  ",
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
});

describe("el mantenimiento que manda el Calendario", () => {
  it("bloquea el dia entero y limpia el motivo", () => {
    expect(buildMaintenancePayload(draft(), "2026-10-05")).toEqual({
      area_id: "7",
      date_at: "2026-10-05 00:00:00",
      date_end: "2026-10-05 23:59:59",
      reason: "Pintura",
    });
  });

  it("con varios dias, va del primero al ultimo", () => {
    expect(
      buildMaintenancePayload(
        draft({ scope: "range", endDate: "2026-10-08" }),
        "2026-10-05",
      ),
    ).toMatchObject({ date_at: "2026-10-05 00:00:00", date_end: "2026-10-08 23:59:59" });
  });

  it("no lee el reloj: la misma entrada da lo mismo a cualquier hora", () => {
    // El "ahora" lo pone el API con la zona del condominio, no el navegador.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 5, 0, 1, 0));
    const earlyMorning = buildMaintenancePayload(draft(), "2026-10-05");
    vi.setSystemTime(new Date(2026, 9, 5, 15, 42, 17));
    const afternoon = buildMaintenancePayload(draft(), "2026-10-05");

    expect(afternoon).toEqual(earlyMorning);
    expect(afternoon.date_at).toBe("2026-10-05 00:00:00");
  });

  it("rechaza un rango invertido", () => {
    expect(() =>
      buildMaintenancePayload(draft({ scope: "range", endDate: "2026-10-04" }), "2026-10-05"),
    ).toThrow("fecha final");
  });

  it("rechaza una fecha que no existe", () => {
    expect(() =>
      buildMaintenancePayload(draft({ scope: "range", endDate: "2026-02-30" }), "2026-02-01"),
    ).toThrow("fecha final");
    expect(() => buildMaintenancePayload(draft(), "05/10/2026")).toThrow("inicio");
  });

  it("exige motivo y area", () => {
    expect(() => buildMaintenancePayload(draft({ reason: "   " }), "2026-10-05")).toThrow(
      "motivo",
    );
    expect(() => buildMaintenancePayload(draft({ areaId: "" }), "2026-10-05")).toThrow(
      "área",
    );
  });
});
