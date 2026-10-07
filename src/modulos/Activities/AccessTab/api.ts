/**
 * The access routes the admin calls. Only `v3/access/*`: after the cutover the
 * API keeps no unprefixed aliases (`/api/accesses*` goes away).
 *
 * Measured against `route:list` of condaty-api `dev` (2026-10-06):
 *   GET   /api/v3/access                      -> list (delegates to the same
 *                                                `AccessController::index` the
 *                                                old alias used: same filters,
 *                                                `fullType`, `_export`)
 *   POST  /api/v3/access                      -> create
 *   POST  /api/v3/access/exit                 -> register the exit
 *   POST  /api/v3/access/close-without-exit   -> close an access left open
 *
 * ⚠️ There is no `v3/access/{id}` (show, update, delete): every screen that
 * uses `modulo` hides add, edit and delete, and the detail is read through the
 * list with `searchBy` + `fullType: "DET"`.
 */
export const ACCESS_V3_BASE = "/v3/access";

export const accessApi = {
  /** Axios path (leading `/`): list, create and the list-driven export. */
  base: ACCESS_V3_BASE,
  /**
   * The same base WITHOUT the leading `/`, which is what `mod.modulo` expects
   * (`useCrud` builds `"/" + mod.modulo`). It is also the `localStorage` key
   * prefix `setParamsCrud` writes to, so callers MUST use this constant.
   */
  modulo: ACCESS_V3_BASE.replace(/^\//, ""),
  exit: `${ACCESS_V3_BASE}/exit`,
  closeWithoutExit: `${ACCESS_V3_BASE}/close-without-exit`,
};
