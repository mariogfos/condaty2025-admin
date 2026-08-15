/**
 * Cómo se escriben en pantalla los datos de una reserva.
 *
 * Los casos que se miden son los que rompieron algo alguna vez o los que
 * dependen de una decisión que no se ve leyendo la firma: el borde del día, la
 * fila sin hora, y el área gratuita que igual generó una deuda.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  formatPeopleCount,
  getActorName,
  getFormattedReservationDate,
  getFormattedReservationTime,
  getPriceDetails,
} from "../utils/reservationFormat";
import { AreaPricing } from "@/modulos/Areas/Type/AreaEnums";

describe("getFormattedReservationDate", () => {
  // 🔴 El runner corre en UTC, y en UTC el borde del día NO EXISTE: la primera
  // versión de este test afirmaba cubrirlo y quedaba verde con el bug puesto.
  // Se fuerza la zona del condominio para que la aserción mida algo.
  const tzOriginal = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "America/La_Paz";
  });
  afterAll(() => {
    process.env.TZ = tzOriginal;
  });

  it("en La Paz (UTC-4) escribe el MISMO día que vino, no el anterior", () => {
    // `reservations.date_at` es un DÍA calendario, no un instante. Medido:
    // `new Date("2026-08-12")` da el 11 en esta zona; `parseISO`, el 12.
    expect(getFormattedReservationDate("2026-08-12")).toContain("12");
    expect(getFormattedReservationDate("2026-08-12")).toContain("agosto");
    expect(getFormattedReservationDate("2026-08-12")).not.toContain("11");

    // El 1 de enero es el peor caso: un día para atrás cambia el AÑO.
    expect(getFormattedReservationDate("2026-01-01")).toContain("enero");
    expect(getFormattedReservationDate("2026-01-01")).toContain("2026");
    expect(getFormattedReservationDate("2026-01-01")).not.toContain("2025");
  });

  it("rechaza lo que no tiene forma de fecha en vez de inventar una", () => {
    expect(getFormattedReservationDate(undefined)).toBe("Fecha inválida");
    expect(getFormattedReservationDate("")).toBe("Fecha inválida");
    expect(getFormattedReservationDate("12/08/2026")).toBe("Fecha inválida");
    expect(getFormattedReservationDate("2026-08-12T10:00:00")).toBe(
      "Fecha inválida",
    );
  });
});

describe("getFormattedReservationTime", () => {
  it("usa los tramos de periods, ordenados, cuando los hay", () => {
    expect(
      getFormattedReservationTime(
        [
          { time_from: "18:00:00", time_to: "20:00:00" },
          { time_from: "09:00:00", time_to: "11:00:00" },
        ],
        "07:00:00",
        "23:00:00",
      ),
    ).toBe("09:00 - 11:00 / 18:00 - 20:00");
  });

  it("cae al par start/end cuando no hay tramos", () => {
    expect(getFormattedReservationTime(null, "18:00:00", "22:00:00")).toBe(
      "18:00 - 22:00",
    );
  });

  it("no rompe cuando no hay ni tramos ni horas", () => {
    expect(getFormattedReservationTime(null, null, null)).toBe(
      "Horario no especificado",
    );
  });
});

describe("getPriceDetails", () => {
  it("muestra el precio del área cuando cuesta", () => {
    expect(getPriceDetails({ id: 1, price: "350" }, "350")).toBe("Bs 350.00");
  });

  it("un área gratuita con deuda muestra las DOS cosas", () => {
    // El caso que se olvida: gratis no siempre significa cero cobrado (una
    // multa, un consumo). Mostrar sólo "Gratis" esconde la deuda.
    expect(getPriceDetails({ id: 1, price: "0", is_free: AreaPricing.FREE }, "120")).toBe(
      "Gratis · Total Bs 120.00",
    );
  });

  it("un área gratuita sin deuda dice sólo Gratis", () => {
    expect(getPriceDetails({ id: 1, price: "0", is_free: AreaPricing.FREE }, 0)).toBe(
      "Gratis",
    );
  });

  it("sin área no inventa un precio", () => {
    expect(getPriceDetails(null, "350")).toBe("No disponible");
  });
});

describe("getActorName", () => {
  it("arma el nombre completo con las cuatro columnas", () => {
    expect(
      getActorName({
        name: "Ana",
        middle_name: "María",
        last_name: "Quiroga",
        mother_last_name: "Vargas",
      }),
    ).toContain("Ana");
  });

  it("usa el reemplazo cuando no hay persona", () => {
    expect(getActorName(null, "Administración")).toBe("Administración");
    expect(getActorName(undefined, "Residente no disponible")).toBe(
      "Residente no disponible",
    );
  });

  it("tolera los nulls que manda el API sin escribir 'null' en pantalla", () => {
    // El API serializa las columnas vacías como `null`, no como `""`.
    const nombre = getActorName(
      {
        name: "Ana",
        middle_name: null,
        last_name: "Quiroga",
        mother_last_name: null,
      },
      "sin nombre",
    );

    expect(nombre).not.toContain("null");
    expect(nombre).toContain("Ana");
  });
});

describe("formatPeopleCount", () => {
  it("singulariza en uno y pluraliza en el resto", () => {
    expect(formatPeopleCount(1)).toBe("1 persona");
    expect(formatPeopleCount(12)).toBe("12 personas");
    expect(formatPeopleCount(0)).toBe("0 personas");
    expect(formatPeopleCount(null)).toBe("0 personas");
  });
});
