/**
 * Que lo que el módulo PIDE esté dentro de lo que el API ACEPTA.
 *
 * 🔴 El riesgo que cubre no es un error: es el SILENCIO. Un filtro que el
 * `ReservationsListConfig` del API no declara no devuelve 4xx, no loguea nada y
 * no cambia el aspecto de la pantalla. Simplemente **no filtra**, y el usuario
 * ve la lista entera creyendo que ése es el resultado de su búsqueda.
 *
 * Ya pasó exactamente eso: la pestaña "Reservas pendientes" mandaba
 * `filterBy=status:1` desde siempre contra un back que no conocía el filtro
 * `status`, caía en un `default: break` y la pestaña listaba TODAS las
 * reservas. Esa pestaña se borró —estaba muerta, nadie la renderizaba— pero el
 * modo de fallar es el que este archivo existe para evitar.
 *
 * `RESERVATIONS_API_CONTRACT` es la copia declarada del ListConfig del API.
 * Este test compara lo que el módulo manda contra esa copia. Lo que NO puede
 * hacer —y hay que decirlo— es verificar que la copia siga coincidiendo con el
 * PHP: eso lo tiene que actualizar quien toque el PHP, en el mismo commit.
 */
import { describe, it, expect } from "vitest";
import {
  getReservationsConfig,
  RESERVATIONS_INITIAL_PARAMS,
} from "../config/reservas.config";
import {
  FILTER_ALL,
  RESERVATION_STATUS_OPTIONS,
  RESERVATIONS_API_CONTRACT,
} from "../config/reservas.constants";
import { ReservationStatus } from "../Type/ReservaType";

/** Los nombres de filtro que un `fields` declara con un slot `filter`. */
const filtrosDeclarados = (fields: Record<string, any>) =>
  Object.entries(fields)
    .filter(([, field]) => field?.filter)
    .map(([name]) => name);

describe("Reservas — el módulo no se sale del contrato del API", () => {
  it("cada filtro que declara la lista existe en el ListConfig del API", () => {
    const { fields } = getReservationsConfig();

    const declarados = filtrosDeclarados(fields);

    expect(declarados.length).toBeGreaterThan(0);
    expect(
      declarados.filter(
        (name) =>
          !(RESERVATIONS_API_CONTRACT.filters as readonly string[]).includes(
            name,
          ),
      ),
      "un filtro que el API no declara NO filtra, y no avisa",
    ).toEqual([]);
  });


  it("la lista no pide más filas que el tope del API", () => {
    for (const params of [RESERVATIONS_INITIAL_PARAMS]) {
      expect(params.perPage).toBeLessThanOrEqual(
        RESERVATIONS_API_CONTRACT.maxPerPage,
      );
    }
  });

  it("la lista no manda los params que el API ya ignora (cols, joins)", () => {
    // Mandarlos no rompe, pero mentir sobre lo que se pide es cómo se
    // acumulan los parámetros que sí importaban.
    const params = RESERVATIONS_INITIAL_PARAMS as Record<string, unknown>;

    for (const ignorado of RESERVATIONS_API_CONTRACT.ignoredParams) {
      expect(params).not.toHaveProperty(ignorado);
    }
  });

  it("la lista apunta al módulo sin barra inicial", () => {
    // `useCrud` arma la URL como `"/" + mod.modulo`: una barra de más da
    // `//v3/reservations`.
    expect(getReservationsConfig().mod.modulo).toBe("v3/reservations");
  });

  it("el export apunta al endpoint sin el prefijo /api", () => {
    const { mod } = getReservationsConfig();

    expect(mod.exportAsync?.endpoint).toBe("/v3/reservations");
    // El array de formatos es lo que hace que el endpoint llegue al botón.
    expect(mod.exportAsync?.supportedFormats?.length).toBeGreaterThan(0);
  });
});

describe("Reservas — los valores de los filtros son numéricos", () => {
  it("ninguna opción de estado manda un char legacy", () => {
    // `reservations.status` es TINYINT. Un `"A"` llega al API como `(int) "A"`
    // = 0, `ReservationStatus::tryFrom(0)` da null y el filtro NO filtra nada.
    const idsQueNoSonElCentinela = RESERVATION_STATUS_OPTIONS.filter(
      (option) => option.id !== FILTER_ALL,
    ).map((option) => option.id);

    expect(idsQueNoSonElCentinela.length).toBeGreaterThan(0);
    expect(
      idsQueNoSonElCentinela.filter((id) => !/^\d+$/.test(id)),
      "los ids del filtro de estado tienen que ser el número del enum",
    ).toEqual([]);
  });

  it("cada opción de estado corresponde a un valor real del enum", () => {
    const valoresDelEnum = new Set(
      Object.values(ReservationStatus).filter(
        (value) => typeof value === "number",
      ) as number[],
    );

    for (const option of RESERVATION_STATUS_OPTIONS) {
      if (option.id === FILTER_ALL) continue;
      expect(valoresDelEnum).toContain(Number(option.id));
    }
  });

});
