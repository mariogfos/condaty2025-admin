import { describe, expect, it } from "vitest";

import {
  AREA_BOOKING_MODE_LABEL,
  AREA_STATUS_LABEL,
  AreaApproval,
  AreaAutoApproval,
  AreaBookingMode,
  AreaCalendarVisibility,
  AreaCancellation,
  AreaDebtRestriction,
  AreaLateCancellationPenalty,
  AreaMembership,
  AreaPricing,
  AreaRealTimeAvailability,
  AreaStatus,
  AreaSurvey,
  bloqueaConDeuda,
  esGratis,
  esPorDia,
  esPorHora,
  requiereAprobacion,
} from "../Type/AreaEnums";

/**
 * 🔴 Los números de los enums de un área son un CONTRATO con el API.
 *
 * Los dos repos no se compilan juntos: si alguien reordena un case acá, o el
 * API cambia el suyo, nada avisa. Este test no puede verificar el lado PHP
 * —para eso está la colección de Postman— pero sí fija los números de este
 * lado, para que un cambio accidental salga rojo antes de llegar a una
 * pantalla.
 *
 * La fuente de verdad es `app/Modules/Areas/Enums/` de `condaty-api`.
 */
describe("los enums de un área", () => {
  it("tienen exactamente los valores que declara el API", () => {
    expect(AreaPricing.PAID).toBe(1);
    expect(AreaPricing.FREE).toBe(2);

    expect(AreaApproval.AUTOMATIC).toBe(1);
    expect(AreaApproval.REQUIRED).toBe(2);

    expect(AreaBookingMode.HOUR).toBe(1);
    expect(AreaBookingMode.DAY).toBe(2);

    expect(AreaDebtRestriction.NONE).toBe(1);
    expect(AreaDebtRestriction.BLOCKS).toBe(2);

    expect(AreaAutoApproval.DISABLED).toBe(1);
    expect(AreaAutoApproval.ENABLED).toBe(2);

    expect(AreaCancellation.NOT_ALLOWED).toBe(1);
    expect(AreaCancellation.ALLOWED).toBe(2);

    expect(AreaLateCancellationPenalty.NONE).toBe(1);
    expect(AreaLateCancellationPenalty.APPLIES).toBe(2);

    expect(AreaSurvey.DISABLED).toBe(1);
    expect(AreaSurvey.ENABLED).toBe(2);

    expect(AreaCalendarVisibility.HIDDEN).toBe(1);
    expect(AreaCalendarVisibility.VISIBLE).toBe(2);

    expect(AreaRealTimeAvailability.HIDDEN).toBe(1);
    expect(AreaRealTimeAvailability.VISIBLE).toBe(2);

    expect(AreaMembership.OPEN).toBe(1);
    expect(AreaMembership.REQUIRED).toBe(2);

    expect(AreaStatus.ACTIVE).toBe(1);
    expect(AreaStatus.MAINTENANCE).toBe(2);
    expect(AreaStatus.ARCHIVED).toBe(3);
  });

  /**
   * 🔴 Ninguno arranca en 0, y eso no es estética.
   *
   * `0` es falsy en JavaScript: un `if (area.is_free)` sobre un enum que
   * empezara en 0 se lee como "no" para el primer case. Es el mismo mecanismo
   * que hizo que un `Select` compartido auto-eligiera la opción con `id: 0`
   * porque `0 == ""` es `true`.
   */
  it("ninguno arranca en 0", () => {
    const todos = [
      AreaPricing,
      AreaApproval,
      AreaBookingMode,
      AreaDebtRestriction,
      AreaAutoApproval,
      AreaCancellation,
      AreaLateCancellationPenalty,
      AreaSurvey,
      AreaCalendarVisibility,
      AreaRealTimeAvailability,
      AreaMembership,
      AreaStatus,
    ];

    for (const enumerado of todos) {
      const valores = Object.values(enumerado).filter(
        (v): v is number => typeof v === "number",
      );

      expect(valores.length).toBeGreaterThan(0);
      expect(valores).not.toContain(0);
    }
  });
});

/**
 * ⚠️ `is_free` es la trampa del módulo: la columna se llama "es gratis" pero
 * el valor 1 significa CON COSTO. Leerla directo da lo contrario de lo que
 * dice el nombre.
 */
describe("las lecturas con nombre", () => {
  it("esGratis dice que sí sólo con FREE, que es 2 y no 1", () => {
    expect(esGratis(AreaPricing.FREE)).toBe(true);
    expect(esGratis(AreaPricing.PAID)).toBe(false);
    expect(esGratis(1)).toBe(false);
    expect(esGratis(null)).toBe(false);
    expect(esGratis(undefined)).toBe(false);
  });

  it("requiereAprobacion dice que sí sólo con REQUIRED", () => {
    expect(requiereAprobacion(AreaApproval.REQUIRED)).toBe(true);
    expect(requiereAprobacion(AreaApproval.AUTOMATIC)).toBe(false);
    expect(requiereAprobacion(undefined)).toBe(false);
  });

  it("esPorDia y esPorHora se excluyen", () => {
    expect(esPorDia(AreaBookingMode.DAY)).toBe(true);
    expect(esPorHora(AreaBookingMode.DAY)).toBe(false);
    expect(esPorHora(AreaBookingMode.HOUR)).toBe(true);
    expect(esPorDia(AreaBookingMode.HOUR)).toBe(false);
  });

  it("bloqueaConDeuda dice que sí sólo con BLOCKS", () => {
    expect(bloqueaConDeuda(AreaDebtRestriction.BLOCKS)).toBe(true);
    expect(bloqueaConDeuda(AreaDebtRestriction.NONE)).toBe(false);
  });

  it("ninguna lectura confunde null con un estado", () => {
    for (const leer of [esGratis, requiereAprobacion, esPorDia, esPorHora, bloqueaConDeuda]) {
      expect(leer(null)).toBe(false);
      expect(leer(undefined)).toBe(false);
    }
  });
});

describe("las etiquetas", () => {
  it("cubren todos los estados, incluido el archivado nuevo", () => {
    expect(AREA_STATUS_LABEL[AreaStatus.ACTIVE]).toBe("Activa");
    expect(AREA_STATUS_LABEL[AreaStatus.MAINTENANCE]).toBe("En mantenimiento");
    expect(AREA_STATUS_LABEL[AreaStatus.ARCHIVED]).toBe("Dada de baja");
  });

  it("cubren los dos modos de reserva", () => {
    expect(AREA_BOOKING_MODE_LABEL[AreaBookingMode.HOUR]).toBe("Por hora");
    expect(AREA_BOOKING_MODE_LABEL[AreaBookingMode.DAY]).toBe("Por día");
  });
});
