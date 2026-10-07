import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { panicTypeStyle } from "../panicTypeStyle";
import { ALERT_TYPE } from "../alertConstants";

/**
 * 🔴 The panic modal of `Layout` looked the type up in a map keyed by the old
 * letters (`E`, `F`, `T`, `O`), and the push carries `alerts.type` as a number
 * since 2026-08-28: every panic alert opened with no icon, colour or name.
 */
describe("el modal de pánico lee el tipo numérico", () => {
  const translate = (key: string) => `t:${key}`;

  it("reconoce los cuatro tipos, también como string", () => {
    expect(panicTypeStyle(ALERT_TYPE.MEDICAL, translate)?.name).toBe("t:medicalEmergency");
    expect(panicTypeStyle(String(ALERT_TYPE.FIRE), translate)?.name).toBe("t:fire");
    expect(panicTypeStyle(ALERT_TYPE.THEFT, translate)?.name).toBe("t:theft");
    expect(panicTypeStyle(ALERT_TYPE.OTHER, translate)?.name).toBe("t:other");
  });

  it("la letra vieja ya no se reconoce", () => {
    expect(panicTypeStyle("F", translate)).toBeUndefined();
  });

  // The modal must use THIS function, not a map of its own (rule 290).
  it("el Layout pinta el modal con esta función", () => {
    const sinComentarios = fs
      .readFileSync(path.resolve(__dirname, "../../../components/layout/Layout.tsx"), "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    expect(sinComentarios).toMatch(/panicTypeStyle\(openAlert\?\.item\?\.type/);
    expect(sinComentarios).not.toMatch(/typeAlerts/);
  });
});
