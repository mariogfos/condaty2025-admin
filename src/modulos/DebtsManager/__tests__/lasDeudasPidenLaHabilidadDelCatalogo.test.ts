import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Las pantallas de deudas piden la habilidad que el API exige, por su nombre
 * EXACTO del catálogo.
 *
 * `userCan()` compara por PREFIJO: `debts` abría con `debts_manager:` y
 * `expense` con `expenses:`, pero ninguna de las dos existe en el catálogo y el
 * API compara exacto. Desde la revisión entera de DebtDptos (2026-10-01) el API
 * pide `debts_manager` para escribir deudas y condonar, y `expenses` para las
 * expensas (`DebtDptoPolicy::habilidadDelTipo()`).
 *
 * ⚠️ El pin lee el archivo SIN comentarios (regla 173 de la skill).
 */
const sinComentarios = (ruta: string): string =>
  fs
    .readFileSync(path.resolve(__dirname, "../../..", ruta), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const PANTALLAS: Array<[string, RegExp]> = [
  ["modulos/DebtsManager/DebtsManager.tsx", /userCan\("debts_manager", "R"\)/],
  ["modulos/DebtsManager/TabComponents/AllDebts/AllDebts.tsx", /permiso: "debts_manager"/],
  ["modulos/DebtsManager/TabComponents/IndividualDebts/IndividualDebts.tsx", /permiso: 'debts_manager'/],
  ["modulos/DebtsManager/TabComponents/SharedDebts/SharedDebts.tsx", /permiso: "debts_manager"/],
  ["modulos/DebtsManager/TabComponents/SharedDebts/DetalleDeudaCompartida/DetailSharedDebts.tsx", /permiso: "debts_manager"/],
  ["modulos/DebtsManager/TabComponents/Forgiveness/Forgiveness.tsx", /permiso: 'debts_manager'/],
  ["modulos/Expenses/Expenses.tsx", /permiso: 'expenses'/],
];

describe("las pantallas de deudas piden la habilidad del catálogo", () => {
  it.each(PANTALLAS)("%s", (ruta, esperado) => {
    const fuente = sinComentarios(ruta);
    expect(fuente).toMatch(esperado);
    expect(fuente).not.toMatch(/permiso: ["']expense["']|userCan\(["']debts["']/);
  });
});
