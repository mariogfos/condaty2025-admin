/**
 * El aviso que sobrevive al redirect a la pantalla de login.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 EL 401 TIRABA AL USUARIO AL LOGIN SIN DECIRLE NADA
 * ────────────────────────────────────────────────────────────────────────
 *
 * El interceptor de respuestas, ante un 401, borra el token y hace
 * `window.location.href = "/"`. Desde el asiento del usuario eso es: estaba
 * cargando una planilla, apreté Guardar, y la aplicacion me devolvio al login.
 * Sin mensaje, la lectura natural es "se rompio" — y es una llamada a soporte.
 *
 * Un `showToast` no sirve acá: `window.location.href` recarga la página entera
 * y se lleva puesto cualquier estado de React. El aviso tiene que sobrevivir a
 * esa recarga, y por eso va al `sessionStorage`.
 *
 * ⚠️ `sessionStorage` y no `localStorage`: el aviso es de ESTA pestaña y de
 * este momento. En `localStorage` quedaría pegado para la próxima sesión y
 * aparecería un "tu sesión venció" al abrir el navegador tres días después.
 */
const CLAVE = "condaty_aviso_de_sesion";

export const AVISO_DE_SESION_VENCIDA =
  "Tu sesión venció. Iniciá sesión nuevamente.";

export const recordarQueLaSesionVencio = () => {
  try {
    sessionStorage.setItem(CLAVE, AVISO_DE_SESION_VENCIDA);
  } catch {
    // Modo privado o storage lleno: el redirect igual tiene que pasar. Sin
    // aviso se pierde el mensaje, no la sesión.
  }
};

/**
 * Devuelve el aviso UNA vez y lo borra.
 *
 * ⚠️ Se consume a propósito: si quedara, volvería a aparecer cada vez que el
 * usuario vuelve al login en esta pestaña, incluso después de haber entrado.
 */
export const tomarElAvisoDeSesion = (): string | null => {
  try {
    const aviso = sessionStorage.getItem(CLAVE);
    if (aviso) sessionStorage.removeItem(CLAVE);
    return aviso;
  } catch {
    return null;
  }
};
