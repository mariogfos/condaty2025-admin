import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { panicTypeStyle } from "../panicTypeStyle";
import { ALERT_TYPE } from "../alertConstants";

/**
 * 🔴 The panic modal of `Layout` looked the type up in a map keyed by the old
 * letters (`E`, `F`, `T`, `O`), and the push carries `alerts.type` as a number
 * since 2026-08-28: every panic alert opened with no icon and no colour.
 */
describe("el modal de pánico lee el tipo numérico", () => {
  // ⚠️ Literal numbers, not `ALERT_TYPE`: with the constant on both sides,
  // swapping two of its values would still pass. These are the API's values.
  it("reconoce los cuatro tipos, también como string", () => {
    expect(panicTypeStyle(1)?.color.border).toBe("var(--cError)");
    expect(panicTypeStyle("3")?.color.border).toBe("var(--cWarning)");
    expect(panicTypeStyle(2)?.color.border).toBe("var(--cInfo)");
    expect(panicTypeStyle(4)?.icon).toBeDefined();
    expect(panicTypeStyle(ALERT_TYPE.FIRE)).toEqual(panicTypeStyle(3));
  });

  it("la letra vieja ya no se reconoce", () => {
    expect(panicTypeStyle("F")).toBeUndefined();
  });

  // The modal must use THIS function, not a map of its own (rule 290).
  it("el Layout pinta el modal con esta función", () => {
    const sinComentarios = fs
      .readFileSync(path.resolve(__dirname, "../../../components/layout/Layout.tsx"), "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    expect(sinComentarios).toMatch(/panicTypeStyle\(openAlert\?\.item\?\.type\)/);
    expect(sinComentarios).not.toMatch(/typeAlerts/);
  });
});
