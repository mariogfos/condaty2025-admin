/**
 * El mensaje que el API mandó, venga por `data` o por `error`.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 POR QUÉ HACE FALTA: UNA NEGACIÓN AHORA ES UN 403
 * ────────────────────────────────────────────────────────────────────────
 *
 * La migración de Tasks a Mk2 cambió las negaciones de **HTTP 200 con
 * `success: false`** a **403**, que es lo correcto: un 200 le dice al front que
 * salió bien y lo obliga a mirar el cuerpo para enterarse de que no.
 *
 * Pero `useAxios` usa axios, y axios **lanza** en cualquier código fuera de 2xx:
 *
 * ```ts
 * } catch (err) {
 *   error = { message: err.message, data: err.response?.data || {}, status: … };
 * }
 * return { data, error };   // ← `data` queda en null
 * ```
 *
 * Así que `const { data } = await execute(...)` deja `data` en **null** y el
 * `showToast(data?.message || "No se pudo…")` cae siempre al texto genérico: el
 * usuario ve «No se pudo guardar la tarea» en vez de **«Solo administradores
 * pueden asignar tareas»**.
 *
 * ⚠️ Esto ya estaba pasando con las CATEGORÍAS desde el corte 1, que fue el que
 * cambió esas cuatro negaciones a 403 — y nadie lo vio, porque el toast de error
 * aparece igual. El síntoma no es que falte el aviso: es que **el aviso dejó de
 * decir por qué**.
 */
export type RespuestaDelApi = {
  data?: { success?: boolean; message?: unknown } | null;
  error?: { data?: { message?: unknown } | null } | null;
};

/**
 * @param porDefecto El texto genérico, para cuando el API no mandó ninguno.
 */
export const elMensajeDeLaRespuesta = (
  respuesta: RespuestaDelApi,
  porDefecto: string,
): string => {
  const delCuerpo = respuesta?.data?.message;
  const delError = respuesta?.error?.data?.message;

  // Se prueban los dos en orden: el camino 2xx primero, el del 4xx después.
  for (const candidato of [delCuerpo, delError]) {
    if (typeof candidato === "string" && candidato.trim() !== "") {
      return candidato;
    }
  }

  return porDefecto;
};

/**
 * ¿Salió bien?
 *
 * 🔴 Con un 403 el `data` es `null`, así que `!data?.success` ya da `true` y el
 * chequeo de hoy acierta. Existe para que el llamador no tenga que saber eso:
 * «éxito» es `data.success === true` y nada más.
 */
export const salioBien = (respuesta: RespuestaDelApi): boolean =>
  respuesta?.data?.success === true;
