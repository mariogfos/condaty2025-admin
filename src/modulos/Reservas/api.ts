/**
 * El ÚNICO lugar del módulo Reservas donde se escribe una URL del API.
 *
 * 🔴 Por qué existe este archivo: hasta el 2026-08-12 la misma base convivía
 * en TRES grafías distintas dentro del módulo, y una de las tres estaba rota:
 *
 *   - `"v3/reservations"`      → `mod.modulo` de useCrud (sin `/` inicial: el
 *                                hook concatena `"/" + mod.modulo`).
 *   - `"/v3/reservations"`     → las llamadas sueltas por axios.
 *   - `"/api/v3/reservations"` → el detalle. **404.**
 *
 * `API_BASE_URL` (`NEXT_PUBLIC_API_URL`, ver `AxiosInstanceProvider`) YA
 * termina en `/api`, así que axios concatena y sale
 * `.../api/api/v3/reservations` → *"The route api/api/v3/reservations could
 * not be found"*. Ese 404 sobrevivió a los dos pines de `Sprint128AxiosApiPrefixPin`
 * porque buscan dos formas concretas —la clave `url:` de un objeto de config, y
 * un `execute(` con el path pegado— y el detalle pasa el path como PRIMER
 * ARGUMENTO de `useAxios(…)`, que ninguna de las dos mira. Con una sola
 * constante el error deja de tener dónde esconderse.
 *
 * ⚠️ Y esos pines escanean el archivo ENTERO, comentarios incluidos: escribir
 * el patrón acá adentro para explicarlo los pone en rojo. Por eso está contado
 * con palabras y no citado literal.
 *
 * Rutas reales del back (`app/Modules/Reservations/Routes/api.php`):
 *   GET|POST|PUT|DELETE  /api/v3/reservations[/{id}]   (apiResource)
 *   GET                  /api/v3/reservations/calendar
 *   POST                 /api/v3/reservations/area-blocked
 */
export const RESERVATIONS_V3_BASE = "/v3/reservations";

export const reservationsApi = {
  /** Base del listado, del alta y del export. Con `/` inicial: es un path de axios. */
  base: RESERVATIONS_V3_BASE,

  /**
   * La misma base SIN `/` inicial, que es lo que espera `mod.modulo` de
   * `useCrud`: el hook arma la URL como `"/" + mod.modulo`.
   */
  modulo: RESERVATIONS_V3_BASE.replace(/^\//, ""),

  /** Detalle / modificación / baja de UNA reserva (`apiResource`). */
  detail: (reservationId: string | number) =>
    `${RESERVATIONS_V3_BASE}/${reservationId}`,

  /** Disponibilidad para el calendario. */
  calendar: `${RESERVATIONS_V3_BASE}/calendar`,

  /** Bloqueo administrativo de un área (mantenimiento). */
  areaBlocked: `${RESERVATIONS_V3_BASE}/area-blocked`,
};
