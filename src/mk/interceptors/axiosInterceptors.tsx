"use client";
import { logError } from "../utils/logs";
import { loQueSePuedeLoguear } from "../utils/errorDeRed";
import { recordarQueLaSesionVencio } from "../utils/sesionVencida";
import { CLAVE_DEL_TOKEN } from "@/mk/utils/claveDelToken";

const LOGIN_SCREEN_ROUTE = "/";

/**
 * El 401: se cierra la sesión y se avisa POR QUÉ.
 *
 * 🔴 Antes borraba el token y hacía el redirect, y nada más. Desde el asiento
 * del usuario eso es: apreté Guardar y la aplicación me devolvió al login. Sin
 * mensaje, la lectura natural es "se rompió", y eso es una llamada a soporte.
 *
 * ⚠️ El aviso va al `sessionStorage` y no a un toast: `window.location.href`
 * recarga la página entera y se lleva puesto cualquier estado de React.
 *
 * ⚠️ Y el `finally`: si guardar el aviso falla —modo privado, storage lleno—
 * el redirect tiene que pasar igual. Se pierde el mensaje, no el cierre de
 * sesión.
 */
const cerrarLaSesionYAvisar = () => {
  try {
    localStorage.removeItem(
      CLAVE_DEL_TOKEN
    );
    recordarQueLaSesionVencio();
  } finally {
    window.location.href = LOGIN_SCREEN_ROUTE;
  }
};

/**
 * A dónde se manda a quien todavía tiene la clave con la que nació.
 *
 * 🔴 La regla la aplica el API —`ObligaACambiarLaClaveDeNacimiento` contesta 403
 * a todo salvo el PIN, el cambio de clave, `iam` y `logout`—, así que esto NO es
 * la guarda: es el cartel. Una redirección del front se esquiva volviendo atrás
 * o entrando por una ruta profunda, y por eso el candado no vive acá.
 *
 * Lo que sí hace falta acá es que la persona entienda qué pasó en vez de ver un
 * error genérico en cada pantalla que abra.
 */
const CAMBIO_DE_CLAVE_ROUTE = "/profile?cambiar=clave";

/**
 * ⚠️ Se pregunta por el booleano que manda el API y NO por `user.status`: el
 * estado que significa «debe cambiar la clave» es `2` en `users`, `3` en
 * `owners` y el char `'P'` en `guards`. Deducirlo acá sería copiar el esquema
 * en el front.
 */
const debeCambiarLaClave = (data: any): boolean =>
  data?.errors?.must_change_password === true;

const mandarACambiarLaClave = () => {
  // Si ya está en la pantalla que lo desbloquea, redirigir de nuevo la
  // recargaría en loop: el propio flujo de cambio pide el PIN, y esa llamada
  // pasa por acá.
  if (window.location.pathname.startsWith("/profile")) return;

  window.location.href = CAMBIO_DE_CLAVE_ROUTE;
};

const axiosInterceptors = (instance: any) => {
  instance.interceptors.request.use(
    (config: any) => {
      let apiToken = null;
      try {
        apiToken = JSON.parse(
          localStorage.getItem(
            CLAVE_DEL_TOKEN
          ) + ""
        ).token;
      } catch (e) {
        apiToken = null;
      }

      if (apiToken) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: "Bearer " + apiToken,
          accept: "application/json",
        };
      }
      return config;
    },
    (error: any) => {
      logError("Network error1:", loQueSePuedeLoguear(error));
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response: any) => {
      if (response?.status === 403 && debeCambiarLaClave(response?.data)) {
        mandarACambiarLaClave();
        return response;
      }
      if (response?.status === 401) {
        cerrarLaSesionYAvisar();
      }
      return response;
    },
    (error: any) => {
      if (error.response?.status === 403 && debeCambiarLaClave(error.response?.data)) {
        mandarACambiarLaClave();

        return Promise.reject(error);
      }
      if (error.response?.status === 401) {
        cerrarLaSesionYAvisar();
      }
      logError("Network error:", loQueSePuedeLoguear(error));
      return Promise.reject(error);
    }
  );
};

export default axiosInterceptors;
