"use client";
import { logError } from "../utils/logs";

const LOGIN_SCREEN_ROUTE = "/";

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
            (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
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
      logError("Network error1:", error);
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
        localStorage.removeItem(
          (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
        );
        window.location.href = LOGIN_SCREEN_ROUTE;
      }
      return response;
    },
    (error: any) => {
      if (error.response?.status === 403 && debeCambiarLaClave(error.response?.data)) {
        mandarACambiarLaClave();

        return Promise.reject(error);
      }
      if (error.response?.status === 401) {
        localStorage.removeItem(
          (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
        );
        window.location.href = LOGIN_SCREEN_ROUTE;
      }
      logError("Network error:", error);
      return Promise.reject(error);
    }
  );
};

export default axiosInterceptors;
