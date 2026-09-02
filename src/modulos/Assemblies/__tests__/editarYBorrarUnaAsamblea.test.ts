/**
 * Los botones de editar y borrar una asamblea no aparecian NUNCA.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 `!== "S"` CONTRA UNA COLUMNA `tinyint`
 * ────────────────────────────────────────────────────────────────────────
 *
 * `assemblies.config.tsx` decidia asi:
 *
 *     const notScheduled = item.status !== "S";
 *     return { hideEdit: hasAttendances || notScheduled,
 *              hideDel:  hasAttendances || notScheduled };
 *
 * `assemblies.status` es `tinyint` —medido con `SHOW COLUMNS`— y el enum del
 * API documenta el mapeo: `'S' → 1` (Scheduled). La comparacion daba SIEMPRE
 * true, asi que `notScheduled` era siempre cierto y los dos botones quedaban
 * escondidos en TODA asamblea, incluso en una programada y sin asistentes.
 *
 * ⚠️ `AssemblyStatus` ya existia en `types/assemblyStatus.ts`, numerico y con
 * los cuatro casos. Como en Contenidos y en Encuestas: el enum estaba, y las
 * comparaciones se quedaron en los chars.
 *
 * La otra del mismo modulo: `AssemblyDashboardCard` pintaba
 * `assembly.status === "P"` (`'P' → 2`, InProgress), asi que la tarjeta nunca
 * se mostraba como «en curso».
 */
import { describe, it, expect } from "vitest";
import { AssemblyStatus } from "../types/assemblyStatus";
// La funcion REAL que llama `onHideActions` del config, no una copia parecida.
import { accionesEscondidas as seEscondenLosBotones } from "../accionesDeLaAsamblea";

describe("el mapeo de los chars viejos", () => {
  it("es el que documenta el enum del API", () => {
    // 'S' → 1  'P' → 2  'C' → 3  'X' → 4
    expect(AssemblyStatus.Scheduled).toBe(1);
    expect(AssemblyStatus.InProgress).toBe(2);
    expect(AssemblyStatus.Completed).toBe(3);
    expect(AssemblyStatus.Cancelled).toBe(4);
  });
});

describe("editar y borrar una asamblea", () => {
  it("una PROGRAMADA sin asistentes se puede editar y borrar", () => {
    const r = seEscondenLosBotones({ status: AssemblyStatus.Scheduled });
    expect(r.hideEdit).toBe(false);
    expect(r.hideDel).toBe(false);
  });

  it("el char viejo NO alcanza: era lo que escondia los dos botones", () => {
    const r = seEscondenLosBotones({ status: "S" });
    expect(r.hideEdit).toBe(true);
    expect(r.hideDel).toBe(true);
  });

  it("con asistentes se esconden, aunque este programada", () => {
    const r = seEscondenLosBotones({
      status: AssemblyStatus.Scheduled,
      attendances_count: 3,
    });
    expect(r.hideEdit).toBe(true);
  });

  it("una en curso o finalizada se esconden", () => {
    for (const status of [AssemblyStatus.InProgress, AssemblyStatus.Completed]) {
      expect(seEscondenLosBotones({ status }).hideEdit).toBe(true);
    }
  });
});
