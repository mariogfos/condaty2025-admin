import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  AVISO_DE_SESION_VENCIDA,
  recordarQueLaSesionVencio,
  tomarElAvisoDeSesion,
} from "../sesionVencida";
import { loQueSePuedeLoguear, mensajeDelError } from "../errorDeRed";

/**
 * 🔴 El 401 tiraba al usuario al login SIN DECIRLE NADA.
 *
 * El interceptor borra el token y hace `window.location.href = "/"`. Desde el
 * asiento del usuario: apreté Guardar y la aplicación me devolvió al login.
 * Sin mensaje, la lectura natural es «se rompió» — y eso es una llamada a
 * soporte.
 *
 * Un toast no sirve: el `href` recarga la página entera y se lleva puesto todo
 * el estado de React. Por eso el aviso pasa por `sessionStorage`.
 */
describe("el aviso de sesión vencida", () => {
  beforeEach(() => sessionStorage.clear());

  it("sobrevive a la recarga que hace el redirect", () => {
    recordarQueLaSesionVencio();

    expect(tomarElAvisoDeSesion()).toBe(AVISO_DE_SESION_VENCIDA);
  });

  // ⚠️ La contraprueba: se consume UNA vez. Sin esto volvería a aparecer cada
  // vez que el usuario vuelve al login en esta pestaña, incluso después de
  // haber entrado bien.
  it("se muestra una sola vez", () => {
    recordarQueLaSesionVencio();
    tomarElAvisoDeSesion();

    expect(tomarElAvisoDeSesion()).toBeNull();
  });

  it("sin aviso guardado no inventa uno", () => {
    expect(tomarElAvisoDeSesion()).toBeNull();
  });

  // ⚠️ Modo privado: guardar puede tirar. El redirect tiene que pasar igual —
  // se pierde el mensaje, no el cierre de sesión.
  it("si el storage falla no rompe", () => {
    const set = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    expect(() => recordarQueLaSesionVencio()).not.toThrow();

    set.mockRestore();
  });
});

/**
 * 🔴 `console.error(error)` de un error de axios IMPRIME EL TOKEN.
 *
 * El objeto de error trae `config.headers.Authorization` con el `Bearer …` del
 * administrador. Volcarlo entero deja el token a la vista de cualquiera que
 * abra las herramientas del navegador.
 */
describe("lo que se puede loguear de un error de red", () => {
  const errorDeAxios = {
    message: "Request failed with status code 500",
    config: {
      method: "post",
      url: "/v3/guards",
      headers: { Authorization: "Bearer el-token-del-administrador" },
    },
    response: { status: 500, data: { message: "Algo salió mal" } },
  };

  it("no deja pasar el token", () => {
    const impreso = JSON.stringify(loQueSePuedeLoguear(errorDeAxios));

    expect(impreso).not.toContain("el-token-del-administrador");
    expect(impreso).not.toContain("Authorization");
  });

  // ⚠️ La contraprueba: y sigue sirviendo para diagnosticar. Un recorte que
  // devolviera un objeto vacío pasaría el test de arriba y dejaría los errores
  // sin nada que mirar.
  it("y conserva lo que sirve para diagnosticar", () => {
    expect(loQueSePuedeLoguear(errorDeAxios)).toEqual({
      message: "Request failed with status code 500",
      status: 500,
      method: "post",
      url: "/v3/guards",
      responseMessage: "Algo salió mal",
    });
  });
});

/**
 * El mensaje que ve el usuario: «el servidor dijo que no» y «no llegamos al
 * servidor» son dos problemas distintos, y hace cosas distintas con cada uno.
 */
describe("el mensaje del error", () => {
  it("el motivo del servidor gana sobre cualquier genérico", () => {
    expect(
      mensajeDelError({ data: { message: "El CI ya está registrado" } }, "otro")
    ).toBe("El CI ya está registrado");
  });

  it("sin respuesta dice que no se llegó al servidor", () => {
    expect(mensajeDelError({ message: "Network Error" })).toContain(
      "contactar al servidor"
    );
  });

  it("un 401 dice que venció la sesión", () => {
    expect(mensajeDelError({ status: 401 })).toContain("sesión venció");
  });

  it("sin error usa el texto de la pantalla", () => {
    expect(mensajeDelError(null, "No se pudo guardar el guardia.")).toBe(
      "No se pudo guardar el guardia."
    );
  });
});
