import { AssemblyStatus } from "./types/assemblyStatus";

/**
 * Qué botones ofrece el listado de asambleas.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 EDITAR Y BORRAR NO APARECÍAN NUNCA
 * ────────────────────────────────────────────────────────────────────────
 *
 * El config decidía así:
 *
 * ```ts
 * const notScheduled = item.status !== "S";
 * return { hideEdit: hasAttendances || notScheduled,
 *          hideDel:  hasAttendances || notScheduled };
 * ```
 *
 * `assemblies.status` es `tinyint` —medido con `SHOW COLUMNS`— y el enum del
 * API documenta el mapeo: `'S' → 1` (Scheduled). La comparación daba **siempre
 * true**, así que `notScheduled` era siempre cierto y los dos botones quedaban
 * escondidos en TODA asamblea, incluso en una programada y sin asistentes.
 *
 * ⚠️ `AssemblyStatus` ya existía en `types/assemblyStatus.ts`, numérico y con
 * los cuatro casos. Como en Contenidos (#802) y en Encuestas (#803): el enum
 * estaba, y las comparaciones se quedaron en los chars.
 *
 * Vive acá y no dentro del objeto de config para que el test mida la función
 * que la pantalla llama, y no una copia parecida.
 */

type AsambleaDelListado = {
  status?: unknown;
  attendances_count?: number;
};

/**
 * Una asamblea se puede editar o borrar mientras siga **programada y sin
 * asistentes registrados**: desde que alguien registró asistencia, el acta ya
 * tiene historia.
 */
export const accionesEscondidas = (item: AsambleaDelListado) => {
  const tieneAsistentes = (item?.attendances_count || 0) > 0;
  const noEstaProgramada = item?.status !== AssemblyStatus.Scheduled;
  const esconder = tieneAsistentes || noEstaProgramada;

  return { hideEdit: esconder, hideDel: esconder };
};
