import { describe, it, expect, vi } from "vitest";

import {
  buscarPorCi,
  buscarPorCorreo,
} from "../buscarAdministradorExistente";

/**
 * El rol elegido mientras la consulta viaja NO se borra.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 `props.item` ERA LA FOTO DEL FORMULARIO AL MOMENTO DEL BLUR
 * ────────────────────────────────────────────────────────────────────────
 *
 * Entre el blur del CI y la respuesta pasa un request entero, y en ese rato el
 * administrador sigue completando: elige el rol, escribe el teléfono. El
 * `setItem({ ...props.item, … })` escribía de vuelta esa foto vieja y **borraba
 * lo elegido mientras esperaba**, sin ningún aviso — el rol simplemente volvía
 * a estar vacío.
 *
 * Este test simula exactamente eso: el estado cambia DURANTE el `await`.
 */
describe("el alta de administradores, mientras la consulta viaja", () => {
  /** Un `setItem` como el de React: aplica el updater sobre el estado actual. */
  const formularioVivo = (inicial: Record<string, any>) => {
    let estado = { ...inicial };

    return {
      leer: () => estado,
      cambiar: (parche: Record<string, any>) => {
        estado = { ...estado, ...parche };
      },
      setItem: (valor: any) => {
        estado = typeof valor === "function" ? valor(estado) : valor;
      },
    };
  };

  const evento = (valor: string) => ({ target: { value: valor } });

  it("el rol elegido durante la espera sobrevive a la respuesta del CI", async () => {
    const form = formularioVivo({ ci: "80010001", role_id: "" });

    const execute = vi.fn(async () => {
      // 🔴 Acá está el punto: el usuario elige el rol MIENTRAS la consulta
      // viaja. El handler ya capturó `props.item` sin este valor.
      form.cambiar({ role_id: "3" });

      return {
        data: {
          success: true,
          data: { data: { id: "u1", ci: "80010001", name: "Ana", existCondo: false } },
        },
      };
    });

    await buscarPorCi(evento("80010001"), {
      item: form.leer(),
      setItem: form.setItem,
      setError: () => {},
    }, { execute, showToast: () => {} });

    expect(
      form.leer().role_id,
      "🔴 Ésta es la selección que desaparecía sin aviso."
    ).toBe("3");
    expect(form.leer().name, "Y los datos de la consulta igual entran.").toBe("Ana");
  });

  // ⚠️ La CONTRAPRUEBA: los datos de la consulta SÍ se escriben. Sin esta
  // mitad, un handler que no tocara nada pasaría el test de arriba y dejaría el
  // formulario sin autocompletar, que es para lo que existe la consulta.
  it("y el formulario se autocompleta con lo que devolvió el CI", async () => {
    const form = formularioVivo({});

    const execute = vi.fn(async () => ({
      data: {
        success: true,
        data: {
          data: {
            id: "u1",
            ci: "80010002",
            name: "Beto",
            phone: "70000001",
            existCondo: false,
          },
        },
      },
    }));

    await buscarPorCi(evento("80010002"), {
      item: form.leer(),
      setItem: form.setItem,
      setError: () => {},
    }, { execute, showToast: () => {} });

    expect(form.leer()).toMatchObject({
      ci: "80010002",
      name: "Beto",
      phone: "70000001",
      _disabled: true,
    });
  });

  /**
   * 🔴 Y la respuesta vieja no pisa el CI nuevo.
   *
   * Si el administrador se equivoca y corrige el CI, la respuesta del primero
   * llega después: aplicarla rellena el formulario con los datos de OTRA
   * persona.
   */
  it("una respuesta que ya no corresponde al CI en pantalla se descarta", async () => {
    const form = formularioVivo({});
    const e = evento("80010003");

    const execute = vi.fn(async () => {
      // El usuario corrige el CI mientras la primera consulta viaja.
      e.target.value = "80010009";

      return {
        data: {
          success: true,
          data: { data: { id: "u9", ci: "80010003", name: "Elviejo", existCondo: false } },
        },
      };
    });

    await buscarPorCi(e, {
      item: form.leer(),
      setItem: form.setItem,
      setError: () => {},
    }, { execute, showToast: () => {} });

    expect(form.leer().name).toBeUndefined();
  });

  /**
   * ⚠️ Y `setError` no puede reemplazar el mapa: se lleva los otros campos.
   */
  it("el error del correo no borra el error del CI", async () => {
    let errores: Record<string, string> = { ci: "Ese CI ya esta en uso" };

    const setError = (valor: any) => {
      errores = typeof valor === "function" ? valor(errores) : valor;
    };

    const execute = vi.fn(async () => ({
      data: { success: true, data: { data: { id: "u1" } } },
    }));

    await buscarPorCorreo(evento("ana@example.test"), {
      item: {},
      setItem: () => {},
      setError,
    }, { execute, showToast: () => {} });

    expect(errores).toEqual({
      ci: "Ese CI ya esta en uso",
      email: "El email ya esta en uso",
    });
  });
});
