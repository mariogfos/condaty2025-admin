import { describe, it, expect } from "vitest";
import { getAlertTypeBoxDetails } from "../RenderView/RenderView";
import { ALERT_LEVELS, ALERT_TYPE } from "../alertConstants";

/**
 * `alerts.type` pasó de `varchar(255)` con letras a enum numérico el 2026-08-28
 * (api#463). Este `switch` decide el ícono, el color y el TÍTULO de la tarjeta
 * de una alerta de pánico.
 *
 * 🔴 Con la columna numérica y el `switch` viejo, las cuatro emergencias caían
 * al `default`: caja gris, campana genérica y "Alerta de Todo el condominio".
 * No hay error — el administrador simplemente no ve de qué se trata.
 */
describe("el tipo de alerta es un número", () => {
  const alerta = (type: unknown) => ({
    type,
    level: ALERT_LEVELS.PANIC,
    descrip: "",
  });

  it("reconoce los cuatro tipos numéricos", () => {
    expect(getAlertTypeBoxDetails(alerta(ALERT_TYPE.MEDICAL)).title).toBe(
      "Emergencia Médica"
    );
    expect(getAlertTypeBoxDetails(alerta(ALERT_TYPE.FIRE)).title).toBe("Incendio");
    expect(getAlertTypeBoxDetails(alerta(ALERT_TYPE.THEFT)).title).toBe(
      "Robo o Intrusión"
    );
  });

  // 🔴 El sobre puede traer el número como string, y `4 === '4'` es `false`.
  // Un test que arma el fixture cómodo —siempre `number`— no ve este caso.
  it("reconoce el tipo aunque venga como string", () => {
    expect(getAlertTypeBoxDetails(alerta(String(ALERT_TYPE.FIRE))).title).toBe(
      "Incendio"
    );
  });

  // Un tipo que no reconocemos NO puede romper la tarjeta: cae al genérico.
  it("un tipo desconocido cae al genérico sin romper", () => {
    const detalle = getAlertTypeBoxDetails({
      ...alerta(99),
      descrip: "Se cayó el ascensor",
    });

    expect(detalle.title).toBe("Se cayó el ascensor");
    expect(detalle.icon).toBeDefined();
  });

  // La letra vieja ya no significa nada: tiene que caer al genérico, no
  // pretender que sigue siendo un incendio.
  it("la letra vieja ya no se reconoce", () => {
    expect(getAlertTypeBoxDetails(alerta("F")).title).not.toBe("Incendio");
  });
});
