import { describe, expect, it } from "vitest";
import { createFormState, getComparableState } from "../DptoConfig";

/**
 * El plazo para cerrar accesos sin salida: un solo número, y 0 es "apagado".
 *
 * ## 🔴 Por qué el switch no es un campo aparte
 *
 * Pedido de Mario (2026-08-09): el plazo va **en días, por condominio**, y
 * **0 no aplica nada**. El back guarda un único entero,
 * `access_auto_close_days`.
 *
 * En pantalla hacen falta dos controles —un switch y un input— pero **no dos
 * datos**: el switch es la forma de decir 0. Guardar además un booleano sería
 * tener dos fuentes para el mismo estado, y tarde o temprano se contradicen:
 * el switch en OFF y el cron cerrando accesos igual.
 *
 * ⚠️ Estos tests miden las dos funciones puras que gobiernan la traducción —de
 * lo que manda el back a la pantalla, y de la pantalla a lo que se guarda—,
 * que es donde puede estar el error. Lo que el usuario ve pintado lo dice
 * abrir la pantalla.
 */
describe("cierre automático de accesos: del back a la pantalla", () => {
  it("un condominio en 0 se lee como apagado", () => {
    const estado = createFormState({ access_auto_close_days: 0 });

    expect(estado.access_auto_close_days).toBe(0);
    expect(estado.cierraAccesosSolo).toBe(false);
  });

  it("un condominio con plazo se lee como encendido", () => {
    const estado = createFormState({ access_auto_close_days: 60 });

    expect(estado.access_auto_close_days).toBe(60);
    expect(estado.cierraAccesosSolo).toBe(true);
  });

  /**
   * ⚠️ La API puede mandar el número como cadena. Sin el `Number()`, `"60" > 0`
   * funciona por coerción pero el input recibiría una cadena y el `||` de más
   * abajo se comportaría distinto.
   */
  it("entiende el plazo aunque venga como cadena", () => {
    const estado = createFormState({ access_auto_close_days: "45" });

    expect(estado.access_auto_close_days).toBe(45);
    expect(estado.cierraAccesosSolo).toBe(true);
  });

  /**
   * 🔴 Un condominio SIN el campo —una respuesta vieja, un cache— nace
   * apagado, no roto.
   */
  it("sin el campo, nace apagado", () => {
    const estado = createFormState({});

    expect(estado.access_auto_close_days).toBe(0);
    expect(estado.cierraAccesosSolo).toBe(false);
  });
});

describe("cierre automático de accesos: de la pantalla a lo que se guarda", () => {
  it("encendido, guarda el plazo escrito", () => {
    const guardado = getComparableState({
      ...createFormState({}),
      cierraAccesosSolo: true,
      access_auto_close_days: 30,
    });

    expect(guardado.access_auto_close_days).toBe(30);
  });

  /**
   * 🔴 El caso que importa: apagar DESPUÉS de haber escrito un número.
   *
   * Si el 30 sobreviviera, la pantalla mostraría el switch en OFF y el cron
   * seguiría cerrando accesos a los 30 días. Es la contradicción que este
   * diseño de un solo campo existe para evitar.
   */
  it("apagado, guarda 0 aunque haya quedado un número escrito", () => {
    const guardado = getComparableState({
      ...createFormState({}),
      cierraAccesosSolo: false,
      access_auto_close_days: 30,
    });

    expect(guardado.access_auto_close_days).toBe(0);
  });

  /**
   * ⚠️ Y encendido con el input vacío guarda 0, no `NaN` ni `""`.
   *
   * Es un estado transitorio —el usuario borró para reescribir— y lo que se
   * manda tiene que ser un número igual. La validación del formulario es la
   * que impide GUARDAR en ese estado; esto sólo evita mandar basura.
   */
  it("encendido con el campo vacío no manda NaN", () => {
    const guardado = getComparableState({
      ...createFormState({}),
      cierraAccesosSolo: true,
      access_auto_close_days: "",
    });

    expect(guardado.access_auto_close_days).toBe(0);
  });

  /**
   * ⚠️ Apagar y volver a apagar comparan igual: el botón de guardar no se
   * enciende por un cambio que no existe.
   */
  it("dos estados apagados con distinto número escrito comparan igual", () => {
    const base = createFormState({});
    const a = getComparableState({ ...base, cierraAccesosSolo: false, access_auto_close_days: 30 });
    const b = getComparableState({ ...base, cierraAccesosSolo: false, access_auto_close_days: 90 });

    expect(a.access_auto_close_days).toBe(b.access_auto_close_days);
  });
});
