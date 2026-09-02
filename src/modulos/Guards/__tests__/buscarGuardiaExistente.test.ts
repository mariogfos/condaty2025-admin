/**
 * Las tres del blur del CI de un guardia, medidas contra la funcion real.
 *
 * Es la misma familia que cerro `buscarAdministradorExistente` para el alta de
 * administradores (admin#790). Los DOS formularios de guardia la tenian:
 * `Guards/RenderForm` (el alta) y `GuardEditForm` (la edicion desde el perfil).
 */
import { describe, it, expect, vi } from "vitest";
import { alCambiarElCi, buscarGuardiaPorCi } from "../buscarGuardiaExistente";

const inputCon = (valor: string) => ({ target: { value: valor } });

/** Un `useState` de mentira que respeta los updaters, como React. */
const estado = (inicial: Record<string, any> = {}) => {
  let actual = { ...inicial };
  return {
    leer: () => actual,
    set: (actualizar: any) => {
      actual =
        typeof actualizar === "function" ? actualizar(actual) : actualizar;
    },
  };
};

const armar = (respuesta: any, inicial: Record<string, any> = {}) => {
  const form = estado(inicial);
  const errores = estado({});
  const execute = vi.fn().mockResolvedValue(respuesta);
  const showToast = vi.fn();
  return {
    execute,
    showToast,
    form,
    errores,
    escrituras: {
      setFormState: form.set,
      setErrors: errores.set,
      vaciarFormulario: () => form.set(() => ({})),
    },
  };
};

const guardiaEncontrado = {
  data: {
    success: true,
    data: {
      data: {
        id: "g1",
        ci: "12345",
        name: "Ana",
        last_name: "Perez",
        email: "ana@x.com",
        phone: "700",
        existCondo: false,
      },
    },
  },
};

const sinGuardia = { data: { success: true, data: { data: null } } };

describe("el blur del CI no pisa lo que se escribio mientras esperaba", () => {
  it("conserva lo tipeado durante el request", async () => {
    const ctx = armar(guardiaEncontrado, { ci: "12345" });

    const promesa = buscarGuardiaPorCi(
      inputCon("12345"),
      { execute: ctx.execute, showToast: ctx.showToast },
      ctx.escrituras,
    );

    // Mientras el request viaja, el administrador sigue completando.
    ctx.form.set((a: any) => ({ ...a, address: "Av. Siempre Viva 742" }));
    await promesa;

    expect(ctx.form.leer().address).toBe("Av. Siempre Viva 742");
    expect(ctx.form.leer().name).toBe("Ana");
  });

  it("no reemplaza el mapa de errores entero", async () => {
    const ctx = armar(sinGuardia);
    ctx.errores.set(() => ({ email: "El email ya esta en uso" }));

    await buscarGuardiaPorCi(
      inputCon("999"),
      { execute: ctx.execute, showToast: ctx.showToast },
      ctx.escrituras,
    );

    expect(ctx.errores.leer().email).toBe("El email ya esta en uso");
    expect(ctx.errores.leer().ci).toBe("");
  });

  it("descarta la respuesta vieja: habla de otra persona", async () => {
    const ctx = armar(guardiaEncontrado);
    const input = { target: { value: "12345" } };

    const promesa = buscarGuardiaPorCi(
      input,
      { execute: ctx.execute, showToast: ctx.showToast },
      ctx.escrituras,
    );

    // El usuario ya corrigio el CI antes de que llegue la respuesta.
    input.target.value = "99999";
    await promesa;

    expect(ctx.form.leer().name).toBeUndefined();
  });

  it("cuando el CI ya esta en el condominio, vacia el formulario y avisa", async () => {
    const ctx = armar(
      {
        data: {
          success: true,
          data: { data: { id: "g1", ci: "12345", existCondo: true } },
        },
      },
      { name: "algo" },
    );

    await buscarGuardiaPorCi(
      inputCon("12345"),
      { execute: ctx.execute, showToast: ctx.showToast },
      ctx.escrituras,
    );

    expect(ctx.form.leer()).toEqual({});
    expect(ctx.errores.leer().ci).toContain("ya esta en uso");
    expect(ctx.showToast).toHaveBeenCalled();
  });

  it("un CI vacio no consulta nada", async () => {
    const ctx = armar(sinGuardia);
    await buscarGuardiaPorCi(
      inputCon("   "),
      { execute: ctx.execute, showToast: ctx.showToast },
      ctx.escrituras,
    );
    expect(ctx.execute).not.toHaveBeenCalled();
  });

  it("en la edicion manda el id para que no se encuentre a si mismo", async () => {
    const ctx = armar(sinGuardia);
    await buscarGuardiaPorCi(
      inputCon("12345"),
      { execute: ctx.execute, showToast: ctx.showToast },
      ctx.escrituras,
      "g-editado",
    );
    expect(ctx.execute.mock.calls[0][2]).toMatchObject({ value: "g-editado" });
  });
});

describe("cambiar el CI desbloquea los campos", () => {
  it("suelta `_disabled` sin tocar lo demas", () => {
    const ctx = armar(sinGuardia, {
      _disabled: true,
      _emailDisabled: true,
      phone: "700",
    });

    alCambiarElCi("999", {
      setFormState: ctx.escrituras.setFormState,
      setErrors: ctx.escrituras.setErrors,
    });

    expect(ctx.form.leer()).toMatchObject({
      ci: "999",
      _disabled: false,
      _emailDisabled: false,
      phone: "700",
    });
  });
});
