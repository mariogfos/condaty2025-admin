/**
 * En qué estado está una asamblea.
 *
 * 🔴 Numérico desde 1 (flip del 2026-08-27, api#439). Era `"S"` / `"P"` / `"C"`
 * / `"X"`.
 *
 * ────────────────────────────────────────────────────────────────────────
 * ⚠️ POR QUÉ VIVE EN SU PROPIO ARCHIVO Y NO EN `assemblies.types.ts`
 * ────────────────────────────────────────────────────────────────────────
 *
 * Porque `assemblies.types.ts` re-exporta `STATUS_LABELS` desde
 * `assemblies.constants.ts`, y esas tablas ahora se indexan **por el enum**.
 * Ponerlo en `types` cierra un ciclo de imports: al evaluar `constants`, el
 * enum todavía es `undefined` y las tablas se arman con la clave
 * `"undefined"`.
 *
 * 🔴 Y eso **no lo ve `tsc`**: el ciclo compila sin una sola queja y revienta
 * recién al ejecutar, con `Cannot read properties of undefined (reading
 * 'Scheduled')`. Lo agarró la suite, no el compilador.
 *
 * ────────────────────────────────────────────────────────────────────────
 * ⚠️ Y al barrer los literales viejos
 * ────────────────────────────────────────────────────────────────────────
 *
 * En este mismo módulo `"P"` también es `Presencial` en `AssemblyModality`, y
 * `"S"` / `"P"` / `"C"` / `"X"` son además cuatro de los siete valores del
 * estado de una **encuesta**, que sigue siendo char y se manda desde esta misma
 * pantalla (`handleStatusChange(survey.id, "C")` en `AssemblyDetail`). Esos
 * literales no cambian.
 */
export enum AssemblyStatus {
  Scheduled = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

/**
 * Qué clase de asamblea es.
 *
 * 🔴 Numérico desde 1 (flip del 2026-08-27, api#440). Era "O" / "E" / "I".
 *
 * ⚠️ Esas tres letras son también valores de OTROS enums del sistema —Visitas,
 * Encuestas, Mascotas— que siguen siendo char. Las letras se repiten; los
 * significados no.
 */
export enum AssemblyType {
  Ordinary = 1,
  Extraordinary = 2,
  Informative = 3,
}

/**
 * Cómo se hace la asamblea.
 *
 * 🔴 Numérico desde 1 (flip del 2026-08-27, api#440). Era "V" / "P" / "H".
 *
 * ⚠️ **Comparte escala con {@link AttendanceModality}**: Virtual es 1 y
 * Presencial es 2 en los dos. Son el mismo concepto en dos columnas del back
 * —`assemblies.modality` y `assembly_attendance.modality_type`— y tienen que
 * decir lo mismo.
 */
export enum AssemblyModality {
  Virtual = 1,
  // ⚠️ `Presencial` y `Hibrid`, no `InPerson`/`Hybrid`: son los nombres que el
  // SSoT declara para este front en `aliasesByApp`. Unificarlos con el API es
  // un rename aparte, no parte de un flip de valores.
  Presencial = 2,
  Hibrid = 3,
}

/**
 * Cómo asistió una persona.
 *
 * 🔴 Los números son los de {@link AssemblyModality}, no un orden propio.
 */
export enum AttendanceModality {
  Virtual = 1,
  Presencial = 2,
}
