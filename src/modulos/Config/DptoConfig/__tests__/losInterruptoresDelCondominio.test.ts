import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFormState, toConfigPayload } from "../DptoConfig";
import { ClientConfigSwitch, FinancialMode, isSwitchOn } from "@/types/clientConfigEnums";

/**
 * Los interruptores de la configuración del condominio, desde el 2026-10-07
 * `ClientConfigSwitch` (1 = apagado, 2 = prendido).
 *
 * 🔴🔴 Es la mudanza que NO revienta: el `1` que era prendido ahora es apagado.
 * La pantalla los leía con `Number(x) === 1`, o sea que habría mostrado prendido
 * todo lo apagado —y al guardar, lo habría escrito—. Se miden las dos puntas:
 * del API a la pantalla y de la pantalla a lo que se guarda.
 */
const SWITCHES = [
  "has_maintenance_value",
  "has_financial_data",
  "has_financial_debt",
  "has_soft_reservation",
  "has_reservation_advance_limit",
  "has_tasks_visible",
] as const;

const todos = (valor: unknown) => Object.fromEntries(SWITCHES.map((s) => [s, valor]));

describe("la pantalla lee la escala nueva", () => {
  it("el 1 es apagado y el 2 prendido, en los seis", () => {
    const apagado = createFormState(todos(ClientConfigSwitch.DISABLED));
    const prendido = createFormState(todos(ClientConfigSwitch.ENABLED));

    SWITCHES.forEach((s) => {
      expect(apagado[s], s).toBe(false);
      expect(prendido[s], s).toBe(true);
    });
  });

  it("el modo financiero ya no se inventa un 0", () => {
    expect(createFormState({ financial_mode: FinancialMode.DEBT_PENALTY_AND_MAINTENANCE }).financial_mode).toBe(3);
    expect(createFormState({}).financial_mode).toBe("");
  });
});

describe("lo que se guarda es el enum", () => {
  it("los booleanos del formulario viajan como 1 y 2", () => {
    const payload = toConfigPayload({ ...todos(true), has_tasks_visible: false, soft_limit: 3 });

    SWITCHES.filter((s) => s !== "has_tasks_visible").forEach((s) => {
      expect(payload[s], s).toBe(ClientConfigSwitch.ENABLED);
    });
    expect(payload.has_tasks_visible).toBe(ClientConfigSwitch.DISABLED);
    expect(payload.soft_limit).toBe(3);
  });

  it("ida y vuelta deja lo mismo", () => {
    const delApi = todos(ClientConfigSwitch.ENABLED);
    delApi.has_financial_debt = ClientConfigSwitch.DISABLED;

    const payload = toConfigPayload(createFormState(delApi));

    SWITCHES.forEach((s) => expect(payload[s], s).toBe(delApi[s]));
  });
});

/** El predicado, contra TODOS los valores: uno escrito como `>= 1` pasaría si sólo se preguntara por el 2. */
describe("isSwitchOn", () => {
  it("sólo el 2 es prendido", () => {
    expect([1, 2, "1", "2", 0, true, false, null, undefined, "Y"].map(isSwitchOn)).toEqual([
      false, true, false, true, false, false, false, false, false, false,
    ]);
  });
});

/**
 * La pestaña de Mora no exporta funciones puras: se pinea su fuente, SIN
 * comentarios (regla 173 — los docblocks citan la forma vieja a propósito).
 */
describe("la pestaña de Mora", () => {
  const sinComentarios = (ruta: string): string =>
    fs
      .readFileSync(path.resolve(__dirname, ruta), "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  it("button_mora se lee y se escribe en la escala nueva", () => {
    const fuente = sinComentarios("../../DefaulterConfig/DefaulterConfig.tsx");

    expect(fuente).not.toMatch(/button_mora\s*==\s*1/);
    expect(fuente).not.toMatch(/optionValue=\{\["1",\s*"0"\]\}/);
    expect(fuente).toMatch(/checked=\{isSwitchOn\(formState\?\.button_mora\)\}/);
  });
});
