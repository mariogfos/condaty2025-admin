import { beforeEach, describe, expect, it, vi } from "vitest";
import axiosInterceptors from "../axiosInterceptors";

/**
 * El cartel de «tenés que cambiar la clave con la que nació tu cuenta».
 *
 * ## 🔴 Esto NO es la guarda
 *
 * La regla la aplica el API: `ObligaACambiarLaClaveDeNacimiento` contesta **403**
 * a todo salvo el PIN, el cambio de clave, `iam` y `logout`. Una redirección del
 * front se esquiva volviendo atrás o entrando por una ruta profunda, y por eso
 * el candado no vive acá.
 *
 * Lo que se mide es que la persona **entienda qué pasó** en vez de ver un error
 * genérico en cada pantalla que abra.
 *
 * ⚠️ El caso de la pantalla de destino vale tanto como el resto: el propio flujo
 * de cambio pide el PIN, y esa llamada también pasa por el interceptor. Sin el
 * corte, redirigiría en loop y la persona no podría cambiar nada.
 */
describe("el 403 de clave de nacimiento manda al cambio de clave", () => {
  let onResponseError: (error: any) => any;
  let onResponse: (response: any) => any;
  let href: string;
  let pathname: string;

  const conRespuesta = (status: number, data: any) => ({
    response: { status, data },
  });

  beforeEach(() => {
    href = "";
    pathname = "/dashboard";

    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        get pathname() {
          return pathname;
        },
        get href() {
          return href;
        },
        set href(v: string) {
          href = v;
        },
        search: "",
      },
    });

    const instance: any = {
      interceptors: {
        request: { use: vi.fn() },
        response: {
          use: (ok: any, err: any) => {
            onResponse = ok;
            onResponseError = err;
          },
        },
      },
    };

    axiosInterceptors(instance);
  });

  it("manda a la pantalla que lo desbloquea", () => {
    onResponseError(
      conRespuesta(403, { errors: { must_change_password: true } }),
    ).catch(() => {});

    expect(href).toBe("/profile?cambiar=clave");
  });

  it("un 403 cualquiera NO manda a ningún lado", () => {
    // 🔴 El contrapunto: sin esto, cualquier falta de permisos sacaría a la
    // persona de la pantalla donde está.
    onResponseError(
      conRespuesta(403, { message: "No tiene permisos para esta acción." }),
    ).catch(() => {});

    expect(href).toBe("");
  });

  it("estando ya en la pantalla de cambio no redirige de nuevo", () => {
    pathname = "/profile";

    onResponseError(
      conRespuesta(403, { errors: { must_change_password: true } }),
    ).catch(() => {});

    expect(href).toBe("");
  });

  it("una respuesta 200 normal pasa de largo", () => {
    const respuesta = { status: 200, data: { success: true } };

    expect(onResponse(respuesta)).toBe(respuesta);
    expect(href).toBe("");
  });
});
