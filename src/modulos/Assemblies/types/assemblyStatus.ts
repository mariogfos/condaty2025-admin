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
