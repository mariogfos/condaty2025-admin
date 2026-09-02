/**
 * Lo que se puede loguear de un error de axios, y lo que NO.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 `console.error(error)` DE UN ERROR DE AXIOS IMPRIME EL TOKEN
 * ────────────────────────────────────────────────────────────────────────
 *
 * El objeto de error de axios trae `config`, y `config.headers` trae el
 * `Authorization: Bearer …` con el que se hizo el pedido. Volcarlo entero a la
 * consola deja el token del administrador a la vista de cualquiera que abra las
 * herramientas del navegador — o de cualquier extensión que lea la consola.
 *
 * Esto se queda con lo que sirve para diagnosticar y deja afuera el resto.
 */
export const loQueSePuedeLoguear = (error: any) => ({
  message: error?.message,
  status: error?.response?.status,
  method: error?.config?.method,
  url: error?.config?.url,
  responseMessage: error?.response?.data?.message,
});

/**
 * El mensaje que se le muestra al usuario cuando un pedido no salió.
 *
 * ⚠️ El orden importa. El sobre de la API trae `message` con el motivo real
 * —"El CI ya está registrado"— y ése es el que sirve. Recién si no vino se cae
 * a los genéricos, y ahí lo importante es distinguir **el servidor dijo que no**
 * de **no llegamos al servidor**: son dos problemas distintos y el usuario hace
 * cosas distintas con cada uno.
 */
export const mensajeDelError = (
  error: any,
  porDefecto = "No se pudo completar la solicitud. Intentá nuevamente."
): string => {
  if (!error) return porDefecto;

  const delServidor = error?.data?.message ?? error?.response?.data?.message;
  if (typeof delServidor === "string" && delServidor.trim()) {
    return delServidor;
  }

  const estado = error?.status ?? error?.response?.status;

  if (estado === 401) return AVISO_401;

  // Sin estado no hubo respuesta: el pedido no llegó.
  if (!estado || error?.message === "Network Error") {
    return "No se pudo contactar al servidor. Revisá tu conexión e intentá nuevamente.";
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return porDefecto;
};

const AVISO_401 = "Tu sesión venció. Iniciá sesión nuevamente.";
